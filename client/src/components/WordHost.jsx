import Icon from './Icon.jsx';

// Ведучий позначає активний офлайн-івент. Застосунок слів НЕ видає —
// слова/питання загадані офлайн наперед. Бали — вручну через табло.
const EVENTS = ['Paint it!', 'Поясни програмісту', 'Хто я? (IT)'];

export default function WordHost({ state, send }) {
  const active = state.offline?.event ?? null;

  const setCustom = () => {
    const v = prompt('Назва івенту:', '');
    if (v && v.trim()) send('host_offline_set', { event: v.trim() });
  };

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <span className="label">Активний офлайн-івент</span>

      <div style={{ display: 'grid', gap: 10 }}>
        {EVENTS.map((ev) => (
          <button
            key={ev}
            className={active === ev ? 'primary' : ''}
            style={{ justifyContent: 'space-between', fontSize: 16, padding: '14px 18px' }}
            onClick={() => send('host_offline_set', { event: ev })}
          >
            {ev}
            {active === ev && <Icon name="check" size={18} />}
          </button>
        ))}
        <div className="row">
          <button className="ghost" onClick={setCustom}>+ свій івент</button>
          {active && (
            <button className="ghost" onClick={() => send('host_offline_clear')}>
              <Icon name="x" size={15} /> Завершити
            </button>
          )}
        </div>
      </div>

      <span className="pill">
        слова/питання загадані офлайн · тут лише активний івент · бали через табло, час — таймером
      </span>
    </div>
  );
}
