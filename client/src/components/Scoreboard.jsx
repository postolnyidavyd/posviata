import Icon from './Icon.jsx';

// Табло балів. host=true -> керування (+/-); big=true -> герой-варіант (проектор).
export default function Scoreboard({ state, send, host, big }) {
  const teams = state.teams || [];

  const max = Math.max(...teams.map((t) => t.score), 0);
  const leaders = teams.filter((t) => t.score === max && max > 0);
  const leaderId = leaders.length === 1 ? leaders[0].id : null;

  return (
    <section className={big ? '' : 'card'} style={{ display: 'grid', gap: big ? 18 : 14 }}>
      {host && <span className="label">Табло</span>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${teams.length}, 1fr)`,
          gap: big ? 18 : 12,
        }}
      >
        {teams.map((t) => {
          const lead = t.id === leaderId;
          return (
            <article
              key={t.id}
              className={`team-${t.os}`}
              style={{
                position: 'relative',
                borderRadius: 'var(--r-card)',
                padding: big ? '26px 20px 22px' : '16px 14px',
                textAlign: 'center',
                background: lead ? 'var(--accent-soft)' : big ? 'var(--surface)' : 'var(--panel)',
                boxShadow: lead ? 'inset 0 0 0 2px var(--accent-line)' : big ? 'var(--shadow-1)' : 'none',
              }}
            >
              {lead && (
                <img
                  src="/doodles/crown.png"
                  alt=""
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: big ? -20 : -14,
                    left: '50%',
                    width: big ? 44 : 30,
                    transform: 'translateX(-50%) rotate(-6deg)',
                  }}
                />
              )}
              <div
                className="row"
                style={{ justifyContent: 'center', gap: 8, marginBottom: big ? 8 : 4 }}
              >
                <span className="dot" style={{ background: 'var(--team)' }} />
                <span
                  className="mono"
                  style={{ fontSize: big ? 20 : 14, fontWeight: 700, color: 'var(--team)' }}
                >
                  {t.name}
                </span>
              </div>
              <div
                className="display"
                style={{
                  fontSize: big ? 'clamp(56px, 9vw, 108px)' : 44,
                  color: lead ? 'var(--accent)' : 'var(--ink)',
                }}
              >
                {t.score}
              </div>

              {host && (
                <div className="row" style={{ justifyContent: 'center', marginTop: 12, gap: 6 }}>
                  <button
                    className="icon-btn"
                    aria-label={`−1 ${t.name}`}
                    onClick={() => send('host_score_adjust', { teamId: t.id, delta: -1 })}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    aria-label={`+1 ${t.name}`}
                    onClick={() => send('host_score_adjust', { teamId: t.id, delta: +1 })}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      const n = Number(
                        prompt(`Скільки балів команді «${t.name}»? (можна відʼємне)`, '0'),
                      );
                      if (!Number.isNaN(n) && n !== 0)
                        send('host_score_adjust', { teamId: t.id, delta: n });
                    }}
                  >
                    ±N
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
