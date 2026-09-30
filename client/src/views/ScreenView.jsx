import Scoreboard from '../components/Scoreboard.jsx';
import Timer from '../components/Timer.jsx';
import WheelStage from '../components/WheelStage.jsx';
import BrandHeader from '../components/BrandHeader.jsx';
import DoodleCluster from '../components/DoodleCluster.jsx';

const TITLES = {
  lobby: 'Посвята в ІТшника',
  wheel: 'Розподіл команд',
  keyboard: 'Keyboard Battle',
  word_reveal: 'Офлайн-івент',
  final_bet: 'Фінал на ставках',
  scoreboard: 'Табло',
};

export default function ScreenView({ state, cfg }) {
  const kb = state.keyboard || {};
  const teams = state.teams || [];
  const t = state.timer || {};
  const mode = state.mode;
  const TIMER_MODES = ['keyboard', 'word_reveal'];
  const timerActive = t.running || (t.secondsLeft > 0 && TIMER_MODES.includes(mode));

  return (
    <div
      className="wrap"
      style={{ display: 'grid', gap: 22, maxWidth: 1320, minHeight: '100vh', alignContent: 'center' }}
    >
      <BrandHeader title={TITLES[mode] || 'Посвята в ІТшника'} big doodles />

      {mode !== 'wheel' && <Scoreboard state={state} send={() => {}} host={false} big cfg={cfg} />}

      {timerActive && <Timer state={state} send={() => {}} host={false} big cfg={cfg} />}

      {mode === 'wheel' && <WheelStage state={state} />}

      {mode === 'keyboard' && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
            {teams.map((tm) => {
              const sub = (kb.submissions || []).find((s) => s.teamId === tm.id) || {};
              return (
                <span key={tm.id} className={`pill ${sub.submitted ? 'live' : ''}`}>
                  <span className="dot" style={{ background: `var(--${tm.os})` }} />
                  {tm.name}: {sub.submitted ? 'готово' : 'друкує…'}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'word_reveal' && (
        <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 18, padding: 44 }}>
          {state.offline?.event ? (
            <>
              <span className="label">Зараз</span>
              <div className="display" style={{ fontSize: 'clamp(40px,6vw,72px)', color: 'var(--accent)' }}>
                {state.offline.event}
              </div>
            </>
          ) : (
            <>
              <DoodleCluster set="lobby" size={54} />
              <div className="display" style={{ fontSize: 36, color: 'var(--ink-2)' }}>Готуємось…</div>
            </>
          )}
        </div>
      )}

      {mode === 'final_bet' && <FinalScreen state={state} />}

      {(mode === 'lobby' || mode === 'scoreboard') && (
        <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 20, padding: 48 }}>
          <DoodleCluster set="lobby" size={58} />
          <div className="mono" style={{ color: 'var(--ink-2)', fontSize: 18 }}>
            Драйв, нетворкінг та трохи гіківської магії
          </div>
        </div>
      )}
    </div>
  );
}

function FinalScreen({ state }) {
  const f = state.final || {};
  const teams = state.teams || [];
  const q = f.question;
  if (!q)
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--ink-3)' }}>Фінал скоро…</div>
    );

  return (
    <div className="card" style={{ display: 'grid', gap: 20, padding: 32 }}>
      <div className="display" style={{ fontSize: 30, textAlign: 'center', letterSpacing: '-0.01em' }}>
        {q.text}
      </div>

      {q.type === 'single' && (
        <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
          {q.options.map((o, i) => (
            <span
              key={i}
              className="pill"
              style={
                f.revealed && i === q.correct
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 16, fontWeight: 600 }
                  : { fontSize: 16 }
              }
            >
              {o}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {teams.map((tm) => {
          const res = (f.results || []).find((r) => r.id === tm.id);
          const bet = f.bets?.[tm.id];
          return (
            <div
              key={tm.id}
              className="panel"
              style={{ textAlign: 'center', display: 'grid', gap: 6 }}
            >
              <span className="mono" style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{tm.name}</span>
              {!f.revealed ? (
                <span className="pill" style={{ justifySelf: 'center' }}>
                  {bet != null ? 'ставку зроблено' : 'думає…'}
                </span>
              ) : (
                <span
                  className="display"
                  style={{ fontSize: 30, color: res?.correct ? 'var(--good)' : 'var(--bad)' }}
                >
                  {res?.correct ? `+${res.bet ?? 0}` : `−${res.bet ?? 0}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
