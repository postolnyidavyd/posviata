import { ROLES } from './protocol.js';

// Повертає ВЕРСІЮ СТАНУ під конкретну роль.
// Критично: team не отримує приховане (еталон keyboard, тексти суперників,
// слово Paint/Поясни, результат колеса до commit, правильну відповідь фіналу
// до reveal). Фільтруємо ТУТ, на сервері.
export function projectState(state, role, teamId) {
  // Табло — публічне для всіх.
  const teams = state.teams.map((t) => ({
    id: t.id,
    name: t.name,
    os: t.os,
    score: t.score,
  }));

  if (role === ROLES.HOST || role === ROLES.SCREEN) {
    return { ...state, teams };
  }

  // ── TEAM: урізаний стан ──────────────────────────────────────
  const kb = state.keyboard;
  const mySub = kb.submissions.find((s) => s.teamId === teamId) || null;
  const w = state.wheel;
  const f = state.final;

  return {
    id: state.id,
    mode: state.mode,
    myTeamId: teamId,
    teams,
    timer: state.timer,

    keyboard: {
      started: kb.started,
      my: mySub
        ? { submitted: mySub.submitted, text: mySub.text }
        : { submitted: false, text: '' },
    },

    // колесо тепер публічне: усі бачать однакову анімацію й зупинку
    wheel: w,

    // назва поточного офлайн-івенту — публічна
    offline: { event: state.offline?.event ?? null },

    final: projectFinalForTeam(f, teamId, state.teams),
  };
}

function projectFinalForTeam(f, teamId, allTeams) {
  if (!f.question) return { question: null, revealed: false };

  const base = {
    revealed: f.revealed,
    myBet: f.bets?.[teamId] ?? null,
    myAnswer: f.answers?.[teamId] ?? null,
    // хто вже зафіксував ставку/відповідь (для «2/3 готові»), без значень
    locked: allTeams.map((t) => ({
      id: t.id,
      bet: f.bets?.[t.id] != null,
      answer: f.answers?.[t.id] != null,
    })),
  };

  if (!f.revealed) {
    // правильну відповідь ховаємо
    const { correct, ...q } = f.question;
    return { ...base, question: q };
  }

  // після reveal — все відкрито (публічно)
  return {
    ...base,
    question: f.question,
    results: allTeams.map((t) => ({
      id: t.id,
      bet: f.bets?.[t.id] ?? null,
      answer: f.answers?.[t.id] ?? null,
      correct: !!f.judged?.[t.id],
    })),
    applied: f.applied,
  };
}
