import { useEffect, useRef, useState, useCallback } from 'react';

// Роль визначається шляхом URL (не логіном): /host /screen /team
export function roleFromPath() {
  const p = window.location.pathname.replace(/\/+$/, '');
  if (p.startsWith('/host')) return 'host';
  if (p.startsWith('/team')) return 'team';
  return 'screen';
}

function wsBase() {
  // Дев: бек на :3001. Прод: той самий origin (сервер віддає і фронт, і WS).
  if (import.meta.env.DEV) return `ws://${location.hostname}:3001`;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}`;
}

function buildUrl(role) {
  const q = new URLSearchParams(window.location.search);
  const params = new URLSearchParams({ role });
  if (role === 'host') params.set('key', q.get('key') || '');
  if (role === 'team') {
    params.set('team', q.get('team') || '0');
    const saved = teamToken(q.get('team') || '0').get();
    if (saved) params.set('token', saved);
  }
  return `${wsBase()}/?${params.toString()}`;
}

// teamToken зберігаємо в localStorage окремо на кожну команду
function teamToken(team) {
  const k = `posvyata_team_token_${team}`;
  return {
    get() {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set(v) {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };
}

export function useSocket() {
  const role = roleFromPath();
  const [state, setState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [welcome, setWelcome] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  const connect = useCallback(() => {
    const url = buildUrl(role);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
      setConnected(true);
      setError(null);
      if (role === 'team') {
        const q = new URLSearchParams(window.location.search);
        const tok = teamToken(q.get('team') || '0').get();
        ws.send(JSON.stringify({ type: 'team_hello', payload: { token: tok } }));
      }
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.type === 'welcome') {
        setWelcome(msg);
        if (role === 'team' && msg.token) {
          const q = new URLSearchParams(window.location.search);
          teamToken(q.get('team') || '0').set(msg.token);
        }
      } else if (msg.type === 'state') {
        setState(msg.state);
      } else if (msg.type === 'error') {
        setError(msg.message || 'Помилка');
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (closedRef.current) return;
      // авто-реконект з наростаючою затримкою (макс 3с)
      const delay = Math.min(3000, 400 * 2 ** retryRef.current);
      retryRef.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [role]);

  useEffect(() => {
    closedRef.current = false;
    connect();
    return () => {
      closedRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((type, payload = {}) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { role, state, connected, welcome, error, send };
}
