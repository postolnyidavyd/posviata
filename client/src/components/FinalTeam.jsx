import { useState } from 'react';
import DoodleCluster from './DoodleCluster.jsx';

export default function FinalTeam({ state, send, cfg }) {
  const f = state.final || {};
  const q = f.question;
  const me = (state.teams || []).find((t) => t.id === state.myTeamId);
  const myScore = me?.score ?? 0;
  const maxBet = Math.min(cfg?.final?.maxBet ?? 3, myScore);
  const [openAns, setOpenAns] = useState('');

  if (!q) {
    return (
      <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 14, padding: 30 }}>
        <DoodleCluster set="wait" size={44} />
        <div className="display" style={{ fontSize: 22 }}>Фінал скоро почнеться</div>
      </div>
    );
  }

  // після reveal — показуємо результат
  if (f.revealed) {
    const mine = (f.results || []).find((r) => r.id === state.myTeamId);
    const win = mine?.correct;
    return (
      <div className="card" style={{ display: 'grid', gap: 10, textAlign: 'center', padding: 24 }}>
        <div className="mono" style={{ fontSize: 18 }}>{q.text}</div>
        <div className="pill" style={{ justifySelf: 'center', color: 'var(--good)' }}>
          Правильно: {q.type === 'single' ? q.options[q.correct] : (Array.isArray(q.correct) ? q.correct[0] : q.correct)}
        </div>
        {mine?.bet != null && (
          <div
            className="big-name"
            style={{ color: win ? 'var(--good)' : 'var(--bad)', fontSize: 30 }}
          >
            {win ? `+${mine.bet}` : `−${mine.bet}`}
          </div>
        )}
        <div className="mono">Ваш рахунок: {myScore}</div>
      </div>
    );
  }

  const betLocked = f.myBet != null;
  const ansLocked = f.myAnswer != null;

  return (
    <div className="card" style={{ display: 'grid', gap: 16, padding: 20 }}>
      <div className="mono" style={{ fontSize: 20, textAlign: 'center' }}>{q.text}</div>

      {/* Ставка */}
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="label">Ваша ставка (рахунок: {myScore})</span>
        {maxBet < 1 ? (
          <span className="pill" style={{ color: 'var(--warn)' }}>
            немає балів для ставки — можна лише відповісти
          </span>
        ) : (
          <div className="row">
            {Array.from({ length: maxBet }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={f.myBet === n ? 'primary' : 'ghost'}
                style={{ fontSize: 18, padding: '10px 18px' }}
                onClick={() => send('final_bet', { amount: n })}
              >
                {n}
              </button>
            ))}
            {betLocked && <span className="pill live">ставка: {f.myBet}</span>}
          </div>
        )}
      </div>

      {/* Відповідь */}
      <div style={{ display: 'grid', gap: 8 }}>
        <span className="label">Ваша відповідь</span>
        {q.type === 'single' ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {q.options.map((o, i) => (
              <button
                key={i}
                className={f.myAnswer === i ? 'primary' : 'ghost'}
                style={{ fontSize: 16, padding: '12px', textAlign: 'left' }}
                onClick={() => send('final_answer', { value: i })}
              >
                {o}
              </button>
            ))}
          </div>
        ) : (
          <div className="row">
            <input
              value={openAns}
              onChange={(e) => setOpenAns(e.target.value)}
              placeholder="Ваша відповідь…"
              disabled={ansLocked}
            />
            <button
              className="primary"
              disabled={ansLocked || !openAns.trim()}
              onClick={() => send('final_answer', { value: openAns.trim() })}
            >
              {ansLocked ? 'Готово' : 'Відповісти'}
            </button>
          </div>
        )}
        {ansLocked && q.type === 'open' && (
          <span className="pill live">відповідь: {String(f.myAnswer)}</span>
        )}
      </div>
    </div>
  );
}
