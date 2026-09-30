// ─────────────────────────────────────────────────────────────
// ЄДИНЕ МІСЦЕ ДЛЯ ВСІХ ТЮНАБЕЛЬНИХ ЧИСЕЛ.
// Міняй тут (або через .env) — не треба лазити по коду.
// ─────────────────────────────────────────────────────────────

export const config = {
  // Одна фіксована кімната на весь івент
  roomId: process.env.ROOM_ID || 'posvyata',

  // Секрет ведучого: /host?key=...
  hostKey: process.env.HOST_KEY || 'change-me-please',

  port: Number(process.env.PORT) || 3001,

  snapshotFile: process.env.SNAPSHOT_FILE || './state.json',

  // 3 команди. Порядок = id.
  teams: [
    { id: 0, name: 'Mac', os: 'mac' },
    { id: 1, name: 'Linux', os: 'linux' },
    { id: 2, name: 'Windows', os: 'windows' },
  ],

  scoring: {
    // Бали за місце: [1-е, 2-е, 3-є]. Стосується всіх конкурсів.
    placePoints: [3, 2, 1],

    // Keyboard Battle: штраф (умовні секунди) за 1 помилку.
    keyboardErrorPenalty: 3,

    final: {
      maxBet: 3, // стеля ставки на питання
      minScore: 0, // не можна впасти нижче нуля
    },
  },

  // Пресети таймера для швидких кнопок ведучого
  timerPresets: [
    { label: '1 хв', seconds: 60 },
    { label: '5 хв', seconds: 300 },
    { label: '10 хв', seconds: 600 },
    { label: '15 хв', seconds: 900 },
  ],
};

// Публічна частина конфіга — те, що безпечно віддати всім клієнтам.
export function publicConfig() {
  return {
    roomId: config.roomId,
    placePoints: config.scoring.placePoints,
    keyboardErrorPenalty: config.scoring.keyboardErrorPenalty,
    final: config.scoring.final,
    timerPresets: config.timerPresets,
  };
}
