import Scoreboard from '../components/Scoreboard.jsx';
import Timer from '../components/Timer.jsx';
import KeyboardHost from '../components/KeyboardHost.jsx';
import WheelHost from '../components/WheelHost.jsx';
import WordHost from '../components/WordHost.jsx';
import FinalHost from '../components/FinalHost.jsx';
import BrandHeader from '../components/BrandHeader.jsx';

const MODES = [
  ['lobby', 'Лобі'],
  ['wheel', 'Колесо'],
  ['keyboard', 'Keyboard'],
  ['word_reveal', 'Офлайн'],
  ['final_bet', 'Фінал'],
  ['scoreboard', 'Табло'],
];

export default function HostView({ state, send, cfg }) {
  return (
    <div className="wrap" style={{ display: 'grid', gap: 18 }}>
      <BrandHeader
        title="Пульт ведучого"
        right={
          <div className="segmented" role="tablist" aria-label="Режим">
            {MODES.map(([m, label]) => (
              <button
                key={m}
                role="tab"
                aria-selected={state.mode === m}
                onClick={() => send('host_set_mode', { mode: m })}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {state.mode === 'lobby' && (
        <div className="card row" style={{ justifyContent: 'space-between' }}>
          <div className="row" style={{ gap: 12 }}>
            <span className="label">Кількість команд</span>
            <div className="segmented" role="group" aria-label="Кількість команд">
              {[2, 3].map((n) => (
                <button
                  key={n}
                  aria-selected={state.teamCount === n}
                  onClick={() => {
                    if (
                      state.teamCount !== n &&
                      confirm('Змінити кількість команд? Це скине бали, розподіл і режим.')
                    )
                      send('host_set_team_count', { count: n });
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <span className="pill">зміна скидає бали й розподіл — став на старті</span>
        </div>
      )}

      {state.mode !== 'wheel' && <Scoreboard state={state} send={send} host cfg={cfg} />}
      <Timer state={state} send={send} host cfg={cfg} />

      {state.mode === 'keyboard' && <KeyboardHost state={state} send={send} cfg={cfg} />}
      {state.mode === 'wheel' && <WheelHost state={state} send={send} />}
      {state.mode === 'word_reveal' && <WordHost state={state} send={send} />}
      {state.mode === 'final_bet' && <FinalHost state={state} send={send} />}
    </div>
  );
}
