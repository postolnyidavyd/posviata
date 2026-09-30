import Timer from '../components/Timer.jsx';
import KeyboardTeam from '../components/KeyboardTeam.jsx';
import WheelStage from '../components/WheelStage.jsx';
import FinalTeam from '../components/FinalTeam.jsx';
import DoodleCluster from '../components/DoodleCluster.jsx';

export default function TeamView({ state, send, cfg }) {
  const teams = state.teams || [];
  const me = teams.find((t) => t.id === state.myTeamId);
  const tm = state.timer || {};
  const mode = state.mode;
  const TIMER_MODES = ['keyboard', 'word_reveal'];
  const timerActive = tm.running || (tm.secondsLeft > 0 && TIMER_MODES.includes(mode));

  const wide = mode === 'keyboard';

  return (
    <div className="wrap" style={{ display: 'grid', gap: 16, maxWidth: wide ? 900 : 560 }}>
      <div
        className={`card team-${me?.os || ''}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div>
          <div className="label">Твоя команда</div>
          <div className="row" style={{ gap: 8, marginTop: 2 }}>
            <span className="dot" style={{ background: 'var(--team)', width: 10, height: 10 }} />
            <span className="mono" style={{ fontSize: 24, fontWeight: 600 }}>{me?.name || '—'}</span>
          </div>
        </div>
        <div className="display" style={{ fontSize: 46, color: 'var(--team)' }}>{me?.score ?? 0}</div>
      </div>

      {timerActive && <Timer state={state} send={send} host={false} cfg={cfg} />}

      {mode === 'keyboard' && <KeyboardTeam state={state} send={send} />}
      {mode === 'wheel' && <WheelStage state={state} />}
      {mode === 'final_bet' && <FinalTeam state={state} send={send} cfg={cfg} />}

      {mode === 'word_reveal' && (
        <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 14, padding: 28 }}>
          {state.offline?.event ? (
            <>
              <span className="label">Зараз</span>
              <div className="display" style={{ fontSize: 28, color: 'var(--accent)' }}>
                {state.offline.event}
              </div>
              <div className="mono" style={{ color: 'var(--ink-2)' }}>Слідкуйте за ведучим</div>
            </>
          ) : (
            <>
              <DoodleCluster set="wait" size={44} />
              <div className="mono" style={{ color: 'var(--ink-2)' }}>Готуємось…</div>
            </>
          )}
        </div>
      )}

      {['lobby', 'scoreboard'].includes(mode) && (
        <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 16, padding: 28 }}>
          <DoodleCluster set="wait" size={44} />
          <div className="mono" style={{ color: 'var(--ink-2)' }}>
            Слідкуйте за екраном. Коли буде ваш хід — тут зʼявиться поле.
          </div>
        </div>
      )}
    </div>
  );
}
