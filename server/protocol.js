// Типи повідомлень client -> server.
// Керуючі (HOST_*) сервер приймає ТІЛЬКИ від авторизованого host.
export const C2S = {
  // team
  TEAM_HELLO: 'team_hello', // { token? } — реконект/вхід
  KB_SUBMIT: 'kb_submit', // { text } — команда тисне «Готово»
  FINAL_BET: 'final_bet', // { amount } — ставка команди
  FINAL_ANSWER: 'final_answer', // { value } — відповідь команди

  // host (керування)
  HOST_SET_MODE: 'host_set_mode', // { mode }
  HOST_SET_TEAM_COUNT: 'host_set_team_count', // { count } — 2 або 3 (скидає гру)
  HOST_SCORE_ADJUST: 'host_score_adjust', // { teamId, delta }
  HOST_SCORE_PLACE: 'host_score_place', // { places: [teamId1st, teamId2nd, teamId3rd] }
  HOST_SET_TEAM_NAME: 'host_set_team_name', // { teamId, name }

  HOST_TIMER_SET: 'host_timer_set', // { seconds, label }
  HOST_TIMER_START: 'host_timer_start',
  HOST_TIMER_PAUSE: 'host_timer_pause',
  HOST_TIMER_RESET: 'host_timer_reset',

  HOST_KB_SET_REFERENCE: 'host_kb_set_reference', // { reference }
  HOST_KB_START: 'host_kb_start',
  HOST_KB_CORRECT: 'host_kb_correct', // { teamId, errors }
  HOST_KB_AWARD: 'host_kb_award', // нарахувати 3/2/1 за поточним ранжуванням
  HOST_KB_RESET: 'host_kb_reset',

  // wheel
  HOST_WHEEL_SET_TOTAL: 'host_wheel_set_total', // { total } — кількість учасників
  HOST_WHEEL_SPIN: 'host_wheel_spin', // крутнути (авто-зарахування куди випало)
  HOST_WHEEL_RESET: 'host_wheel_reset',

  // offline (колишній word_reveal): ведучий обирає активний офлайн-івент
  HOST_OFFLINE_SET: 'host_offline_set', // { event } — назва івенту
  HOST_OFFLINE_CLEAR: 'host_offline_clear',

  // final_bet
  HOST_FINAL_NEXT: 'host_final_next', // наступне питання з банку
  HOST_FINAL_REVEAL: 'host_final_reveal', // показати правильну + відповіді
  HOST_FINAL_JUDGE: 'host_final_judge', // { teamId, correct } — ручний суд (open)
  HOST_FINAL_APPLY: 'host_final_apply', // нарахувати +/- ставки
  HOST_FINAL_RESET: 'host_final_reset',
};

// Типи повідомлень server -> client
export const S2C = {
  WELCOME: 'welcome', // { role, teamId?, token?, config }
  STATE: 'state', // { state } — вже відфільтрований під роль
  ERROR: 'error', // { message }
};

export const MODES = {
  LOBBY: 'lobby',
  WHEEL: 'wheel',
  KEYBOARD: 'keyboard',
  WORD_REVEAL: 'word_reveal',
  FINAL_BET: 'final_bet',
  SCOREBOARD: 'scoreboard',
};

export const ROLES = {
  HOST: 'host',
  SCREEN: 'screen',
  TEAM: 'team',
};
