const bcrypt = require('bcryptjs');
const { pool } = require('../src/database/pool');
const { initDatabase } = require('../src/database/initDatabase');

const DEMO_USER = { name: 'Usuário Demo', email: 'demo@drinktoyou.com', password: 'demo1234' };
const DEMO_GOAL_ML = 2000;
const HISTORY_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HOURS_OF_ENTRIES = [8, 10, 12, 15, 17, 20];
const AMOUNT_OPTIONS_ML = [150, 250, 300, 350, 500];

function pick(options, seed) {
  return options[seed % options.length];
}

/** Gera consumo de um dia; dias pares batem a meta, ímpares ficam perto dela. */
function buildDayEntries(daysAgo) {
  const reachGoal = daysAgo === 0 ? false : daysAgo % 5 !== 3;
  const entries = [];
  let total = 0;

  HOURS_OF_ENTRIES.forEach((hour, index) => {
    const amount = pick(AMOUNT_OPTIONS_ML, daysAgo + index);
    entries.push({ hour, amount });
    total += amount;
  });

  if (reachGoal && total < DEMO_GOAL_ML) {
    entries.push({ hour: 21, amount: DEMO_GOAL_ML - total });
  }
  return daysAgo === 0 ? entries.slice(0, 2) : entries;
}

async function recreateDemoUser() {
  await pool.query('DELETE FROM users WHERE email = $1', [DEMO_USER.email]);
  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [DEMO_USER.name, DEMO_USER.email, passwordHash],
  );
  const userId = rows[0].id;
  await pool.query(
    'INSERT INTO user_preferences (user_id, daily_goal_ml) VALUES ($1, $2)',
    [userId, DEMO_GOAL_ML],
  );
  return userId;
}

async function insertHistory(userId) {
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const baseDay = new Date(Date.now() - daysAgo * MS_PER_DAY);
    for (const { hour, amount } of buildDayEntries(daysAgo)) {
      // Horário local de Brasília (UTC-3).
      const moment = new Date(
        Date.UTC(baseDay.getUTCFullYear(), baseDay.getUTCMonth(), baseDay.getUTCDate(), hour + 3),
      );
      if (moment.getTime() > Date.now()) continue;
      await pool.query(
        'INSERT INTO water_entries (user_id, amount_ml, created_at) VALUES ($1, $2, $3)',
        [userId, amount, moment.toISOString()],
      );
    }
  }
}

async function main() {
  await initDatabase();
  const userId = await recreateDemoUser();
  await insertHistory(userId);
  console.log(`Usuário demo criado: ${DEMO_USER.email} / ${DEMO_USER.password}`);
}

main()
  .catch((error) => {
    console.error('Falha ao criar dados demo:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
