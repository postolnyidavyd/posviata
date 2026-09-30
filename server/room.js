import { config } from './config.js';
import { MODES } from './protocol.js';
import { diffWords, rankKeyboard } from './scoring.js';
import { FINAL_QUESTIONS } from './banks.js';

// Єдине джерело правди. Усі мутації йдуть через методи класу,
// кожна викликає this.touch() -> броадкаст + (для важливих) снапшот.
export class Room {
  constructor(onChange) {
    this.onChange = onChange || (() => {});
    this.state = Room.initialState();
  }

  static blankSub(teamId) {
    return {
      teamId,
      submitted: false,
      text: '',
      finishedAt: null,
      elapsedMs: 0,
      errors: 0,
      finalErrors: 0,
      diff: [],
    };
  }

  // teamCount: 2 або 3 (за замовчуванням — скільки заведено в config)
  static initialState(teamCount = config.teams.length) {
    const n = Math.max(2, Math.min(config.teams.length, teamCount));
    // Для 2 команд — Mac + Windows (без Linux); для 3 — усі.
    // id завжди 0..n-1 (щоб URL team=, колесо й табло лишались коректні).
    const comp =
      n === 2 ? [config.teams[0], config.teams[2]] : config.teams.slice(0, n);
    const teams = comp.map((t, i) => ({
      id: i,
      name: t.name,
      os: t.os,
      score: 0,
    }));
    return {
      id: config.roomId,
      mode: MODES.LOBBY,
      teamCount: n,
      teams,
      timer: { running: false, secondsLeft: 0, total: 0, label: '' },
      wheel: {
        total: 0, // скільки всього учасників
        counts: teams.map(() => 0), // скільки вже в кожній команді
        spinning: false, // йде анімація
        result: null, // teamId, куди випало (для зупинки колеса)
        spinId: 0, // інкремент — щоб клієнт розпізнав новий спін
      },
      // Офлайн-івент: лише назва поточного (слова загадуються офлайн наперед).
      offline: { event: null },
      keyboard: {
        reference: '',
        started: false,
        startedAt: null,
        submissions: teams.map((t) => Room.blankSub(t.id)),
      },
      final: {
        question: null, // { text, type, options?, correct } — correct ховається від team
        index: -1, // індекс у банку
        bets: {}, // teamId -> ставка
        answers: {}, // teamId -> відповідь (index для single / текст для open)
        judged: {}, // teamId -> bool (ручний суд для open)
        revealed: false,
        applied: false, // бали вже нараховані?
      },
    };
  }

  // persist=true => зберегти снапшот (зміни балів/структури)
  touch(persist = false) {
    this.onChange(persist);
  }

  // ── Відновлення зі снапшоту ────────────────────────────────
  restore(data) {
    if (!data || typeof data !== 'object') return;
    const count = data.teamCount || (data.teams && data.teams.length) || config.teams.length;
    const base = Room.initialState(count);
    this.state = {
      ...base,
      ...data,
      teamCount: base.teamCount,
      teams: base.teams.map((t) => {
        const saved = (data.teams || []).find((x) => x.id === t.id);
        return saved ? { ...t, ...saved } : t;
      }),
      timer: { ...base.timer, ...(data.timer || {}), running: false },
      keyboard: { ...base.keyboard, ...(data.keyboard || {}) },
      wheel: { ...base.wheel, ...(data.wheel || {}), spinning: false, result: null },
      offline: { ...base.offline, ...(data.offline || {}) },
      final: { ...base.final, ...(data.final || {}) },
    };
  }

  // ── Кількість команд (2 або 3) — налаштування на старті ────
  // Повний скид (бали/розподіл/режим), бо це зміна складу гри.
  setTeamCount(n) {
    clearTimeout(this._spinTimer);
    this.state = Room.initialState(Math.floor(Number(n) || 0));
    this.touch(true);
  }

  // ── Режими ─────────────────────────────────────────────────
  setMode(mode) {
    if (!Object.values(MODES).includes(mode)) return;
    this.state.mode = mode;
    this.touch(true);
  }

  // ── Табло ──────────────────────────────────────────────────
  adjustScore(teamId, delta) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.score = Math.max(0, team.score + Number(delta || 0));
    this.touch(true);
  }

  // places = [teamId 1-е місце, teamId 2-е, teamId 3-є]
  awardByPlace(places) {
    const pts = config.scoring.placePoints;
    (places || []).forEach((teamId, i) => {
      if (teamId == null) return;
      const team = this.state.teams.find((t) => t.id === teamId);
      if (team && pts[i] != null) team.score += pts[i];
    });
    this.touch(true);
  }

  setTeamName(teamId, name) {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) return;
    team.name = String(name || '').slice(0, 40) || team.name;
    this.touch(true);
  }

  // ── Таймер ─────────────────────────────────────────────────
  timerSet(seconds, label) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    this.state.timer = { running: false, secondsLeft: s, total: s, label: label || '' };
    this.touch();
  }
  timerStart() {
    if (this.state.timer.secondsLeft > 0) this.state.timer.running = true;
    this.touch();
  }
  timerPause() {
    this.state.timer.running = false;
    this.touch();
  }
  timerReset() {
    this.state.timer.running = false;
    this.state.timer.secondsLeft = this.state.timer.total;
    this.touch();
  }
  // Викликається щосекунди з index.js
  timerTick() {
    const t = this.state.timer;
    if (t.running && t.secondsLeft > 0) {
      t.secondsLeft -= 1;
      if (t.secondsLeft === 0) t.running = false;
      return true; // потрібен броадкаст
    }
    return false;
  }

  // ── Keyboard Battle ────────────────────────────────────────
  kbSetReference(reference) {
    this.state.keyboard.reference = String(reference || '');
    this.touch(true);
  }

  kbStart() {
    const kb = this.state.keyboard;
    kb.started = true;
    kb.startedAt = Date.now();
    kb.submissions = this.state.teams.map((t) => ({
      teamId: t.id,
      submitted: false,
      text: '',
      finishedAt: null,
      elapsedMs: 0,
      errors: 0,
      finalErrors: 0,
      diff: [],
    }));
    this.touch(true);
  }

  kbSubmit(teamId, text) {
    const kb = this.state.keyboard;
    if (!kb.started || !kb.startedAt) return;
    const sub = kb.submissions.find((s) => s.teamId === teamId);
    if (!sub || sub.submitted) return; // час фіксуємо один раз
    sub.submitted = true;
    sub.text = String(text || '');
    sub.finishedAt = Date.now();
    sub.elapsedMs = sub.finishedAt - kb.startedAt;
    const { errors, ops } = diffWords(kb.reference, sub.text);
    sub.errors = errors;
    sub.diff = ops;
    sub.finalErrors = errors; // дефолт = авто, host може змінити
    this.touch(true);
  }

  kbCorrect(teamId, errors) {
    const sub = this.state.keyboard.submissions.find((s) => s.teamId === teamId);
    if (!sub) return;
    sub.finalErrors = Math.max(0, Math.floor(Number(errors) || 0));
    this.touch(true);
  }

  // Порахувати ранжування за поточним станом (для показу host).
  kbRanking() {
    const subs = this.state.keyboard.submissions.map((s) => ({
      teamId: s.teamId,
      finishedAt: s.finishedAt,
      elapsedMs: s.elapsedMs,
      errors: s.finalErrors,
    }));
    return rankKeyboard(subs, config.scoring.keyboardErrorPenalty);
  }

  kbAward() {
    const order = this.kbRanking();
    this.awardByPlace(order); // awardByPlace вже викликає touch(true)
  }

  kbReset() {
    this.state.keyboard = Room.initialState().keyboard;
    // зберегти вже заведений еталон? — ні, повний ресет раунду
    this.touch(true);
  }

  // ── Колесо розподілу ───────────────────────────────────────
  wheelSetTotal(total) {
    const n = Math.max(0, Math.floor(Number(total) || 0));
    clearTimeout(this._spinTimer);
    this.state.wheel = {
      total: n,
      counts: this.state.teams.map(() => 0),
      spinning: false,
      result: null,
      spinId: 0,
    };
    this.touch(true);
  }

  wheelRemaining() {
    const w = this.state.wheel;
    return w.total - w.counts.reduce((a, b) => a + b, 0);
  }

  // Крутнути: вибір команди + АВТО-зарахування (без підтвердження).
  // Щоб команди були рівні (різниця максимум 1), обираємо ВИПАДКОВО серед
  // команд із найменшою поточною кількістю. Виглядає як чесний рандом,
  // але гарантує баланс.
  wheelSpin() {
    const w = this.state.wheel;
    if (w.spinning || this.wheelRemaining() <= 0) return;

    const min = Math.min(...w.counts);
    const candidates = w.counts.map((c, i) => (c === min ? i : -1)).filter((i) => i >= 0);
    const picked = candidates[Math.floor(Math.random() * candidates.length)];

    // авто-зарахування одразу
    w.counts[picked] += 1;
    w.result = picked;
    w.spinning = true;
    w.spinId += 1;
    this.touch(true);

    // зупиняємо анімацію через ~4.9с (синхронно з довшим спіном на клієнті)
    clearTimeout(this._spinTimer);
    this._spinTimer = setTimeout(() => {
      this.state.wheel.spinning = false;
      this.touch();
    }, 4900);
  }

  wheelReset() {
    clearTimeout(this._spinTimer);
    this.state.wheel = Room.initialState().wheel;
    this.touch(true);
  }

  // ── Офлайн-івенти (Paint / Поясни / Хто я? / свій) ─────────
  // Застосунок не видає слів — лише показує, який івент зараз активний.
  offlineSet(event) {
    this.state.offline.event = String(event || '').slice(0, 60) || null;
    this.touch(true);
  }

  offlineClear() {
    this.state.offline.event = null;
    this.touch(true);
  }

  // ── Фінал на ставках ───────────────────────────────────────
  finalNext() {
    const f = this.state.final;
    const idx = (f.index + 1) % FINAL_QUESTIONS.length;
    this.state.final = {
      ...Room.initialState().final,
      question: FINAL_QUESTIONS[idx],
      index: idx,
    };
    this.touch(true);
  }

  finalBet(teamId, amount) {
    const f = this.state.final;
    if (!f.question || f.revealed) return;
    const team = this.state.teams.find((t) => t.id === teamId);
    if (!team) return;
    const max = Math.min(config.scoring.final.maxBet, team.score);
    const a = Math.max(0, Math.min(max, Math.floor(Number(amount) || 0)));
    f.bets[teamId] = a;
    this.touch(true);
  }

  finalAnswer(teamId, value) {
    const f = this.state.final;
    if (!f.question || f.revealed) return;
    f.answers[teamId] = value; // single: index; open: текст
    this.touch(true);
  }

  finalReveal() {
    const f = this.state.final;
    if (!f.question) return;
    f.revealed = true;
    // авто-суд для single
    if (f.question.type === 'single') {
      for (const t of this.state.teams) {
        f.judged[t.id] = f.answers[t.id] === f.question.correct;
      }
    }
    this.touch(true);
  }

  // Ручний суд для open-питань (host тисне «зараховано/ні»)
  finalJudge(teamId, correct) {
    const f = this.state.final;
    if (!f.revealed) return;
    f.judged[teamId] = !!correct;
    this.touch(true);
  }

  finalApply() {
    const f = this.state.final;
    if (!f.revealed || f.applied) return;
    const min = config.scoring.final.minScore;
    for (const t of this.state.teams) {
      const bet = f.bets[t.id];
      if (bet == null) continue; // не ставила — пропускаємо
      const win = !!f.judged[t.id];
      t.score = Math.max(min, t.score + (win ? bet : -bet));
    }
    f.applied = true;
    this.touch(true);
  }

  finalReset() {
    this.state.final = Room.initialState().final;
    this.touch(true);
  }
}
