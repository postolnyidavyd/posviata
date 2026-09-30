import { useState } from 'react';
import WheelStage from './WheelStage.jsx';
import Icon from './Icon.jsx';

export default function WheelHost({ state, send }) {
  const w = state.wheel || {};
  const [total, setTotal] = useState(w.total || 15);
  const remaining = (w.total ?? 0) - (w.counts || []).reduce((a, b) => a + b, 0);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card row">
        <span className="label">Учасників усього</span>
        <input
          type="number"
          min={0}
          style={{ width: 96 }}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
        />
        <button onClick={() => send('host_wheel_set_total', { total })}>Завести</button>
        <div style={{ flex: 1 }} />
        <span className="pill">всього {w.total ?? 0} · лишилось {Math.max(0, remaining)}</span>
        <button className="danger" onClick={() => send('host_wheel_reset')}>Скинути</button>
      </div>

      <WheelStage state={state} />

      <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
        <button
          className="primary"
          style={{ fontSize: 18, padding: '14px 32px' }}
          disabled={w.spinning || remaining <= 0}
          onClick={() => send('host_wheel_spin')}
        >
          <Icon name="spin" size={18} /> Крутити
        </button>
        {remaining <= 0 && w.total > 0 && <span className="pill live">усіх розподілено</span>}
      </div>
    </div>
  );
}
