import Icon from './Icon.jsx';

function fmt(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

// Таймер. host=true -> керування; big -> герой-варіант.
export default function Timer({ state, send, host, cfg, big }) {
  const t = state.timer || { secondsLeft: 0, running: false, label: '' };
  const presets = cfg?.timerPresets || [];
  const low = t.secondsLeft <= 10 && t.secondsLeft > 0;

  return (
    <div className={host ? 'card' : ''} style={{ display: 'grid', gap: 12 }}>
      <div className="row" style={{ justifyContent: 'center', gap: 10 }}>
        <span className="label">Таймер</span>
        {t.running && (
          <span className="pill live">
            <span className="live-dot" /> йде
          </span>
        )}
      </div>

      <div
        className="display"
        style={{
          fontSize: big ? 'clamp(72px, 13vw, 160px)' : 52,
          textAlign: 'center',
          color: low ? 'var(--bad)' : 'var(--ink)',
        }}
      >
        {fmt(t.secondsLeft)}
      </div>

      {host && (
        <>
          <div className="row" style={{ justifyContent: 'center' }}>
            {t.running ? (
              <button onClick={() => send('host_timer_pause')}>
                <Icon name="pause" size={16} /> Пауза
              </button>
            ) : (
              <button className="primary" onClick={() => send('host_timer_start')}>
                <Icon name="play" size={16} /> Старт
              </button>
            )}
            <button className="ghost" onClick={() => send('host_timer_reset')}>
              <Icon name="reset" size={16} /> Скинути
            </button>
          </div>
          <div className="row" style={{ justifyContent: 'center' }}>
            {presets.map((p) => (
              <button
                key={p.seconds}
                className="ghost"
                onClick={() => send('host_timer_set', { seconds: p.seconds })}
              >
                {p.label}
              </button>
            ))}
            <button
              className="ghost"
              onClick={() => {
                const m = Number(prompt('Скільки хвилин?', '5'));
                if (!Number.isNaN(m) && m > 0)
                  send('host_timer_set', { seconds: Math.round(m * 60) });
              }}
            >
              свій час
            </button>
          </div>
        </>
      )}
    </div>
  );
}
