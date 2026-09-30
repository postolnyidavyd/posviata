import { useState } from 'react';
import Icon from './Icon.jsx';
import DoodleCluster from './DoodleCluster.jsx';

// Екран команди у Keyboard Battle.
export default function KeyboardTeam({ state, send }) {
  const kb = state.keyboard || {};
  const [text, setText] = useState('');
  const my = kb.my || { submitted: false };

  if (!kb.started) {
    return (
      <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 14, padding: 36 }}>
        <DoodleCluster set="wait" size={44} />
        <div className="display" style={{ fontSize: 24 }}>Чекаємо старту</div>
        <p style={{ color: 'var(--ink-2)', margin: 0 }}>
          Тримайте пальці на клавіатурі — друкувати почнете за сигналом ведучого.
        </p>
      </div>
    );
  }

  if (my.submitted) {
    return (
      <div className="card" style={{ textAlign: 'center', display: 'grid', gap: 10, padding: 36 }}>
        <div className="row" style={{ justifyContent: 'center', color: 'var(--good)' }}>
          <Icon name="check" size={28} />
        </div>
        <div className="display" style={{ fontSize: 26 }}>Готово!</div>
        <p style={{ color: 'var(--ink-2)', margin: 0 }}>Час зафіксовано. Далі — рішення ведучого.</p>
        <div className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>{my.text}</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      <span className="label">Друкуйте українською і тисніть «Готово»</span>
      <textarea
        autoFocus
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Друкуйте тут…"
        style={{ fontSize: 19, lineHeight: 1.6 }}
      />
      <button
        className="primary"
        style={{ fontSize: 18, padding: '14px', justifyContent: 'center' }}
        onClick={() => send('kb_submit', { text })}
      >
        <Icon name="check" size={18} /> Готово
      </button>
    </div>
  );
}
