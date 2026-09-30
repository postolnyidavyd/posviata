import { writeFile, readFile, rename } from 'node:fs/promises';
import { config } from './config.js';

const FILE = config.snapshotFile;
const TMP = FILE + '.tmp';

let pending = null;
let timer = null;

// Дебаунс: часті зміни балів не б'ють по диску щоразу.
export function scheduleSnapshot(state) {
  pending = state;
  if (timer) return;
  timer = setTimeout(flush, 400);
}

async function flush() {
  timer = null;
  const data = pending;
  pending = null;
  if (!data) return;
  try {
    // atomic: пишемо в .tmp -> rename (щоб не лишити побитий файл)
    await writeFile(TMP, JSON.stringify(data, null, 2), 'utf8');
    await rename(TMP, FILE);
  } catch (err) {
    console.error('[persist] помилка запису снапшоту:', err.message);
  }
}

export async function loadSnapshot() {
  try {
    const raw = await readFile(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[persist] не вдалось прочитати снапшот:', err.message);
    }
    return null; // немає файлу — стартуємо з чистого стану
  }
}
