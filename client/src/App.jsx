import { useSocket } from './ws.js';
import HostView from './views/HostView.jsx';
import ScreenView from './views/ScreenView.jsx';
import TeamView from './views/TeamView.jsx';
import Splotches from './components/Splotches.jsx';

export default function App() {
  const { role, state, connected, welcome, error, send } = useSocket();
  const cfg = welcome?.config;

  return (
    <>
      <Splotches />
      <div className="conn">
        <span className="pill">
          <span className="dot" style={{ background: connected ? 'var(--good)' : 'var(--bad)' }} />
          {connected ? 'на звʼязку' : 'перепідключення…'}
        </span>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {error && (
          <div className="wrap">
            <div className="card" style={{ color: 'var(--bad)' }}>{error}</div>
          </div>
        )}

        {!state ? (
          <div className="wrap">
            <div className="card" style={{ textAlign: 'center', color: 'var(--ink-3)' }}>
              Завантаження стану…
            </div>
          </div>
        ) : role === 'host' ? (
          <HostView state={state} send={send} cfg={cfg} />
        ) : role === 'team' ? (
          <TeamView state={state} send={send} cfg={cfg} />
        ) : (
          <ScreenView state={state} cfg={cfg} />
        )}
      </div>
    </>
  );
}
