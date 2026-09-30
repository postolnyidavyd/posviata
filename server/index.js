import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, normalize as pathNormalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';

import { config, publicConfig } from './config.js';
import { C2S, S2C, ROLES } from './protocol.js';
import { Room } from './room.js';
import { projectState } from './filter.js';
import { scheduleSnapshot, loadSnapshot } from './persist.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = join(__dirname, '..', 'client', 'dist');

// ── Стан + кімната ────────────────────────────────────────────
const room = new Room((persist) => {
  broadcast();
  if (persist) scheduleSnapshot(room.state);
});

const snap = await loadSnapshot();
if (snap) {
  room.restore(snap);
  console.log('[room] стан відновлено зі снапшоту');
}

// token -> teamId (для реконекту команди)
const tokens = new Map();

// ── HTTP сервер (роздача React-статики) ───────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  let filePath = join(CLIENT_DIST, pathNormalize(urlPath));

  // захист від виходу за межі dist
  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  try {
    const s = await stat(filePath);
    if (s.isDirectory()) filePath = join(filePath, 'index.html');
  } catch {
    // немає такого файлу — SPA fallback на index.html
    filePath = join(CLIENT_DIST, 'index.html');
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Не знайдено. Спочатку збери клієнт: npm run build');
  }
}

const httpServer = createServer(serveStatic);

// ── WebSocket ─────────────────────────────────────────────────
const wss = new WebSocketServer({ server: httpServer });
const clients = new Set(); // { ws, role, teamId }

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams((req.url || '').split('?')[1] || '');
  const roleParam = params.get('role');
  const key = params.get('key');
  const teamParam = params.get('team');

  // Визначення ролі. host — тільки з правильним ключем.
  let role = ROLES.SCREEN;
  let teamId = null;

  if (roleParam === ROLES.HOST) {
    if (key !== config.hostKey) {
      send(ws, { type: S2C.ERROR, message: 'Невірний ключ ведучого' });
      ws.close();
      return;
    }
    role = ROLES.HOST;
  } else if (roleParam === ROLES.TEAM) {
    role = ROLES.TEAM;
    teamId = clampTeam(teamParam);
  } else {
    role = ROLES.SCREEN;
  }

  const client = { ws, role, teamId };
  clients.add(client);

  // token для команди (реконект)
  let token = null;
  if (role === ROLES.TEAM) {
    token = randomUUID();
    tokens.set(token, teamId);
  }

  send(ws, {
    type: S2C.WELCOME,
    role,
    teamId,
    token,
    config: publicConfig(),
  });
  sendState(client);

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    handleMessage(client, msg);
  });

  ws.on('close', () => clients.delete(client));
  ws.on('error', () => clients.delete(client));
});

function clampTeam(v) {
  const n = Number(v);
  const count = room.state.teams.length;
  if (!Number.isInteger(n) || n < 0 || n >= count) return 0;
  return n;
}

// ── Роутинг повідомлень ───────────────────────────────────────
function handleMessage(client, msg) {
  const { type, payload = {} } = msg || {};
  const isHost = client.role === ROLES.HOST;

  switch (type) {
    // ── team ──
    case C2S.TEAM_HELLO: {
      if (client.role !== ROLES.TEAM) return;
      const known = payload.token && tokens.get(payload.token);
      if (known != null) client.teamId = known; // повертаємо в ту саму команду
      sendState(client);
      return;
    }
    case C2S.KB_SUBMIT: {
      if (client.role !== ROLES.TEAM) return;
      room.kbSubmit(client.teamId, payload.text);
      return;
    }
    case C2S.FINAL_BET: {
      if (client.role !== ROLES.TEAM) return;
      room.finalBet(client.teamId, payload.amount);
      return;
    }
    case C2S.FINAL_ANSWER: {
      if (client.role !== ROLES.TEAM) return;
      room.finalAnswer(client.teamId, payload.value);
      return;
    }

    // ── host (тільки авторизований) ──
    case C2S.HOST_SET_MODE:
      if (isHost) room.setMode(payload.mode);
      return;
    case C2S.HOST_SET_TEAM_COUNT:
      if (isHost) room.setTeamCount(payload.count);
      return;
    case C2S.HOST_SCORE_ADJUST:
      if (isHost) room.adjustScore(payload.teamId, payload.delta);
      return;
    case C2S.HOST_SCORE_PLACE:
      if (isHost) room.awardByPlace(payload.places);
      return;
    case C2S.HOST_SET_TEAM_NAME:
      if (isHost) room.setTeamName(payload.teamId, payload.name);
      return;

    case C2S.HOST_TIMER_SET:
      if (isHost) room.timerSet(payload.seconds, payload.label);
      return;
    case C2S.HOST_TIMER_START:
      if (isHost) room.timerStart();
      return;
    case C2S.HOST_TIMER_PAUSE:
      if (isHost) room.timerPause();
      return;
    case C2S.HOST_TIMER_RESET:
      if (isHost) room.timerReset();
      return;

    case C2S.HOST_KB_SET_REFERENCE:
      if (isHost) room.kbSetReference(payload.reference);
      return;
    case C2S.HOST_KB_START:
      if (isHost) room.kbStart();
      return;
    case C2S.HOST_KB_CORRECT:
      if (isHost) room.kbCorrect(payload.teamId, payload.errors);
      return;
    case C2S.HOST_KB_AWARD:
      if (isHost) room.kbAward();
      return;
    case C2S.HOST_KB_RESET:
      if (isHost) room.kbReset();
      return;

    // wheel
    case C2S.HOST_WHEEL_SET_TOTAL:
      if (isHost) room.wheelSetTotal(payload.total);
      return;
    case C2S.HOST_WHEEL_SPIN:
      if (isHost) room.wheelSpin();
      return;
    case C2S.HOST_WHEEL_RESET:
      if (isHost) room.wheelReset();
      return;

    // offline (активний офлайн-івент)
    case C2S.HOST_OFFLINE_SET:
      if (isHost) room.offlineSet(payload.event);
      return;
    case C2S.HOST_OFFLINE_CLEAR:
      if (isHost) room.offlineClear();
      return;

    // final_bet
    case C2S.HOST_FINAL_NEXT:
      if (isHost) room.finalNext();
      return;
    case C2S.HOST_FINAL_REVEAL:
      if (isHost) room.finalReveal();
      return;
    case C2S.HOST_FINAL_JUDGE:
      if (isHost) room.finalJudge(payload.teamId, payload.correct);
      return;
    case C2S.HOST_FINAL_APPLY:
      if (isHost) room.finalApply();
      return;
    case C2S.HOST_FINAL_RESET:
      if (isHost) room.finalReset();
      return;

    default:
      return;
  }
}

// ── Розсилка стану ────────────────────────────────────────────
function stateForClient(client) {
  const projected = projectState(room.state, client.role, client.teamId);
  // ранжування keyboard — тільки host/screen
  if (client.role !== ROLES.TEAM) {
    projected.keyboard = { ...projected.keyboard, ranking: room.kbRanking() };
  }
  return projected;
}

function sendState(client) {
  send(client.ws, { type: S2C.STATE, state: stateForClient(client) });
}

function broadcast() {
  for (const client of clients) sendState(client);
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

// ── Тік таймера ───────────────────────────────────────────────
setInterval(() => {
  if (room.timerTick()) broadcast();
}, 1000);

httpServer.listen(config.port, () => {
  console.log(`\n  Пульт «Посвята» піднято на порту ${config.port}`);
  console.log(`  host:   /host?role=host&key=${config.hostKey}`);
  console.log(`  screen: /screen?role=screen`);
  console.log(`  team:   /team?role=team&team=0|1|2\n`);
});
