import { useState } from 'react';
import Icon from './Icon.jsx';

function secs(ms) {
  return (ms / 1000).toFixed(1);
}

// Пословна підсвітка набраного тексту відносно еталона.
function DiffView({ ops }) {
  if (!ops || !ops.length) return <em style={{ color: 'var(--ink-faint)' }}>(порожньо)</em>;
  return (
    <div className="diff">
      {ops.map((o, i) => {
        if (o.type === 'equal') return <span key={i} className="w w-ok">{o.sub}</span>;
        if (o.type === 'sub')
          return (
            <span key={i} className="w w-wrong" title={`треба: ${o.ref}`}>
              {o.sub} <span className="exp">→{o.ref}</span>
            </span>
          );
        if (o.type === 'ins')
          return (
            <span key={i} className="w w-extra" title="зайве слово">
              {o.sub}
            </span>
          );
        // del — пропущене слово
        return (
          <span key={i} className="w w-miss" title="пропущене слово">
            {o.ref}
          </span>
        );
      })}
    </div>
  );
}

// Панель ведучого для Keyboard Battle.
export default function KeyboardHost({ state, send, cfg }) {
  const kb = state.keyboard || {};
  const teams = state.teams || [];
  const [ref, setRef] = useState(kb.reference || '');
  const penalty = cfg?.keyboardErrorPenalty ?? 3;
  const ranking = kb.ranking || [];

  const finalTime = (sub) => sub.elapsedMs / 1000 + (sub.finalErrors || 0) * penalty;
  const placeOf = (teamId) => {
    const i = ranking.indexOf(teamId);
    return i >= 0 ? i + 1 : null;
  };
  const setErrors = (teamId, v) =>
    send('host_kb_correct', { teamId, errors: Math.max(0, v) });

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* ── Налаштування раунду ── */}
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <span className="label">Еталонний текст (те, що має вийти)</span>
        <textarea
          rows={2}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="Введи текст, який команди друкуватимуть…"
        />
        <div className="row">
          <button onClick={() => send('host_kb_set_reference', { reference: ref })}>
            Зберегти еталон
          </button>
          <span className="pill">штраф: {penalty}с / помилку</span>
          <span className="pill">1 слово = максимум 1 помилка</span>
          <div style={{ flex: 1 }} />
          <button className="primary" onClick={() => send('host_kb_start')}>
            <Icon name="play" size={16} /> Старт раунду
          </button>
          <button className="danger" onClick={() => send('host_kb_reset')}>
            Скинути
          </button>
        </div>
      </div>

      {/* ── Команди ── */}
      <div style={{ display: 'grid', gap: 10 }}>
        {teams.map((t) => {
          const sub = (kb.submissions || []).find((s) => s.teamId === t.id) || {};
          const p = placeOf(t.id);
          const corrected = (sub.finalErrors ?? 0) !== (sub.errors ?? 0);
          return (
            <div key={t.id} className={`card team-${t.os}`} style={{ display: 'grid', gap: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong className="mono" style={{ color: 'var(--team)', fontSize: 17 }}>
                  {t.name}
                  {p && <span className="pill live" style={{ marginLeft: 8 }}>{p} місце</span>}
                </strong>
                <div className="row">
                  {sub.submitted ? (
                    <>
                      <span className="pill">час {secs(sub.elapsedMs)}с</span>
                      <span className="pill">підсумок {finalTime(sub).toFixed(1)}с</span>
                    </>
                  ) : (
                    <span className="pill">…друкує</span>
                  )}
                </div>
              </div>

              {sub.submitted && (
                <>
                  <DiffView ops={sub.diff} />

                  <div
                    className="row"
                    style={{
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--border)',
                      paddingTop: 10,
                    }}
                  >
                    <div className="row" style={{ gap: 10 }}>
                      <span className="label">Помилок</span>
                      <button onClick={() => setErrors(t.id, (sub.finalErrors ?? 0) - 1)}>−</button>
                      <span
                        className="mono"
                        style={{ fontSize: 22, minWidth: 28, textAlign: 'center' }}
                      >
                        {sub.finalErrors ?? 0}
                      </span>
                      <button onClick={() => setErrors(t.id, (sub.finalErrors ?? 0) + 1)}>+</button>
                      <span className="label" style={{ color: 'var(--ink-faint)' }}>
                        авто: {sub.errors}
                        {corrected && ' · виправлено вручну'}
                      </span>
                      {corrected && (
                        <button className="ghost" onClick={() => setErrors(t.id, sub.errors)}>
                          <Icon name="reset" size={14} /> до авто
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Легенда + нарахування ── */}
      <div className="card" style={{ display: 'grid', gap: 10 }}>
        <div className="row" style={{ gap: 14, fontSize: 12 }}>
          <span className="w w-wrong">слово з помилкою</span>
          <span className="w w-extra">зайве</span>
          <span className="w w-miss">пропущене</span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <span className="label">
            Місця:{' '}
            {ranking.length
              ? ranking.map((id) => teams.find((t) => t.id === id)?.name).join(' › ')
              : '—'}
          </span>
          <button className="primary" onClick={() => send('host_kb_award')}>
  <Icon name="award" size={16} /> Нарахувати бали
          </button>
        </div>
      </div>
    </div>
  );
}
