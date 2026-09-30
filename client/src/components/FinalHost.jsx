import Icon from './Icon.jsx';

export default function FinalHost({ state, send }) {
  const f = state.final || {};
  const teams = state.teams || [];
  const q = f.question;

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card row">
        <button onClick={() => send('host_final_next')}>
          <Icon name="next" size={16} /> Наступне питання
        </button>
        {q && !f.revealed && (
          <button className="primary" onClick={() => send('host_final_reveal')}>
            <Icon name="eye" size={16} /> Показати відповідь
          </button>
        )}
        {q && f.revealed && !f.applied && (
          <button className="primary" onClick={() => send('host_final_apply')}>
            <Icon name="award" size={16} /> Нарахувати
          </button>
        )}
        {f.applied && <span className="pill live">бали нараховано</span>}
        <div style={{ flex: 1 }} />
        <button className="danger" onClick={() => send('host_final_reset')}>
          Скинути
        </button>
      </div>

      {!q ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
          Тисни «Наступне питання», щоб почати.
        </div>
      ) : (
        <>
          <div className="card" style={{ display: 'grid', gap: 8 }}>
            <span className="label">Питання · {q.type === 'single' ? 'варіанти' : 'відкрита'}</span>
            <div className="mono" style={{ fontSize: 20 }}>{q.text}</div>
            {q.type === 'single' && (
              <div className="row" style={{ gap: 8 }}>
                {q.options.map((o, i) => (
                  <span
                    key={i}
                    className="pill"
                    style={
                      i === q.correct
                        ? { background: 'color-mix(in srgb, var(--good) 20%, transparent)', color: 'var(--good)' }
                        : {}
                    }
                  >
                    {o}
                  </span>
                ))}
              </div>
            )}
            {q.type === 'open' && (
              <span className="pill" style={{ color: 'var(--good)' }}>
                приймати: {Array.isArray(q.correct) ? q.correct.join(' / ') : q.correct}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {teams.map((t) => {
              const bet = f.bets?.[t.id];
              const ans = f.answers?.[t.id];
              const answered =
                ans == null
                  ? '—'
                  : q.type === 'single'
                    ? q.options[ans]
                    : String(ans);
              const judged = !!f.judged?.[t.id];
              return (
                <div key={t.id} className={`card team-${t.os}`} style={{ display: 'grid', gap: 8 }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <strong className="mono" style={{ color: 'var(--team)' }}>
                      {t.name} · {t.score} б
                    </strong>
                    <div className="row">
                      <span className="pill">ставка: {bet ?? '—'}</span>
                      <span className="pill">відповідь: {answered}</span>
                    </div>
                  </div>
                  {f.revealed && (
                    <div className="row">
                      {q.type === 'open' ? (
                        <>
                          <span className="label">Зараховуємо?</span>
                          <button
                            className={judged ? 'primary' : 'ghost'}
                            onClick={() => send('host_final_judge', { teamId: t.id, correct: true })}
                          >
                            <Icon name="check" size={15} /> так
                          </button>
                          <button
                            className={!judged ? 'primary' : 'ghost'}
                            onClick={() => send('host_final_judge', { teamId: t.id, correct: false })}
                          >
                            <Icon name="x" size={15} /> ні
                          </button>
                        </>
                      ) : (
                        <span
                          className="pill"
                          style={{ color: judged ? 'var(--good)' : 'var(--bad)' }}
                        >
                          {judged ? `+${bet ?? 0}` : `−${bet ?? 0}`}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
