// Композиційна група брендових дудлів для порожніх станів / лобі.
// Не фон-розсип — навмисна ілюстрація в контейнері.
const SETS = {
  lobby: ['crown', 'terminal', 'code', 'coffee', 'bolt'],
  wait: ['coffee', 'bulb', 'code'],
  win: ['crown'],
};

export default function DoodleCluster({ set = 'wait', size = 46, gap = 14, style }) {
  const items = SETS[set] || SETS.wait;
  return (
    <div
      aria-hidden
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap, ...style }}
    >
      {items.map((name, i) => (
        <img
          key={name}
          src={`/doodles/${name}.png`}
          alt=""
          style={{
            width: i === Math.floor(items.length / 2) ? size * 1.25 : size,
            opacity: 0.85,
            transform: `rotate(${(i % 2 ? 1 : -1) * (4 + i * 2)}deg)`,
          }}
        />
      ))}
    </div>
  );
}
