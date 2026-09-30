// ─────────────────────────────────────────────────────────────
// Підрахунок помилок для Keyboard Battle + пословний дифф для підсвітки.
// Це ПІДКАЗКА ведучому — фінальне число завжди затверджує host вручну.
//
// Правила з ТЗ:
//  - порівнюємо ПО СЛОВАХ; будь-яка відмінність у слові = рівно 1 помилка
//    (1 буква чи 5 — все одно 1; більше 1 помилки на слово бути НЕ може)
//  - пропущене / зайве слово = 1 помилка
//  - розділові знаки ігноруємо
//  - регістр ігноруємо ("Слово" == "слово")
// ─────────────────────────────────────────────────────────────

const PUNCT = /[.,!?;:"'`«»„“”()\[\]{}<>\/\\|–—\-_+*=~@#$%^&№…]/g;

// Нормалізація одного слова для порівняння (регістр + пунктуація геть).
export function normWord(w) {
  return String(w || '').toLowerCase().replace(PUNCT, '');
}

// Розбити текст на слова, зберігаючи як оригінал (для показу), так і
// нормалізовану форму (для порівняння). Слова-пустушки (сама пунктуація) прибираємо.
function tokenize(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  return raw
    .split(/\s+/)
    .map((w) => ({ raw: w, norm: normWord(w) }))
    .filter((t) => t.norm.length > 0);
}

// Пословний Левенштейн з бектрейсом.
// Повертає { errors, ops } де ops — послідовність:
//   { type:'equal', ref, sub }
//   { type:'sub',   ref, sub }   // слово набране з помилкою
//   { type:'del',   ref }        // слово пропущене
//   { type:'ins',   sub }        // зайве слово
// errors = кількість НЕ-equal операцій (кожна = 1, тобто макс 1 на слово).
export function diffWords(reference, submitted) {
  const a = tokenize(reference); // еталон
  const b = tokenize(submitted); // те, що набрали
  const m = a.length;
  const n = b.length;

  // d[i][j] — відстань між a[0..i) та b[0..j)
  const d = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].norm === b[j - 1].norm ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }

  // бектрейс від (m,n) до (0,0)
  const ops = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    const cost = i > 0 && j > 0 && a[i - 1].norm === b[j - 1].norm ? 0 : 1;
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + cost) {
      ops.push(
        cost === 0
          ? { type: 'equal', ref: a[i - 1].raw, sub: b[j - 1].raw }
          : { type: 'sub', ref: a[i - 1].raw, sub: b[j - 1].raw },
      );
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ type: 'del', ref: a[i - 1].raw }); // є в еталоні, немає в наборі
      i--;
    } else {
      ops.push({ type: 'ins', sub: b[j - 1].raw }); // зайве в наборі
      j--;
    }
  }
  ops.reverse();

  const errors = ops.filter((o) => o.type !== 'equal').length;
  return { errors, ops };
}

// Зручний шорткат, якщо треба лише число.
export function countErrors(reference, submitted) {
  return diffWords(reference, submitted).errors;
}

// Ранжування команд Keyboard Battle.
// finalTime = elapsedMs/1000 + errors * penalty(с). Менше = краще.
// Повертає масив teamId у порядку місць (1-е, 2-е, 3-є...).
export function rankKeyboard(submissions, penaltySeconds) {
  const rows = submissions
    .filter((s) => s && s.finishedAt != null)
    .map((s) => ({
      teamId: s.teamId,
      finalTime: s.elapsedMs / 1000 + (s.errors ?? 0) * penaltySeconds,
    }))
    .sort((a, b) => a.finalTime - b.finalTime);
  return rows.map((r) => r.teamId);
}
