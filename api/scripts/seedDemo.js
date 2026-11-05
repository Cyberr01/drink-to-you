const bcrypt = require('bcryptjs');
const { pool } = require('../src/database/pool');
const { initDatabase } = require('../src/database/initDatabase');

const DEMO_USER = { name: 'Usuário Demo', email: 'demo@drinktoyou.com', password: 'demo1234' };
const COLLEAGUES = [
  { name: 'Mariana Costa', email: 'mariana.demo@drinktoyou.com' },
  { name: 'Lucas Almeida', email: 'lucas.demo@drinktoyou.com' },
];
const DEMO_GOAL_ML = 2000;
const HISTORY_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HOURS_OF_ENTRIES = [7, 10, 12, 15, 17, 20];
const AMOUNT_OPTIONS_ML = [150, 250, 300, 350, 500];

// Miniatura SVG convertida em data URI de imagem para ilustrar os check-ins de demonstração
function buildDemoPhotoSvg(label, bgHex) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360" viewBox="0 0 360 360">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#102B46"/>
        <stop offset="100%" stop-color="${bgHex}"/>
      </linearGradient>
    </defs>
    <rect width="360" height="360" rx="28" fill="url(#g)"/>
    <path d="M180 70 C180 70 118 162 118 212 C118 246 146 274 180 274 C214 274 242 246 242 212 C242 162 180 70 180 70 Z" fill="#6FE7F7" opacity="0.92"/>
    <circle cx="160" cy="218" r="14" fill="#FFFFFF" opacity="0.45"/>
    <text x="180" y="324" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#FFFFFF">${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function pick(options, seed) {
  return options[seed % options.length];
}

function buildDayEntries(daysAgo) {
  const reachGoal = daysAgo === 0 ? false : daysAgo % 5 !== 4;
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

function dayStringDaysAgo(daysAgo) {
  return new Date(Date.now() - daysAgo * MS_PER_DAY).toLocaleDateString('en-CA', {
    timeZone: 'America/Sao_Paulo',
  });
}

async function recreateUsers() {
  const allEmails = [DEMO_USER.email, ...COLLEAGUES.map((c) => c.email)];
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [allEmails]);

  const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);
  const { rows: demoRows } = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [DEMO_USER.name, DEMO_USER.email, passwordHash],
  );
  const demoId = demoRows[0].id;
  await pool.query('INSERT INTO user_preferences (user_id, daily_goal_ml) VALUES ($1, $2)', [
    demoId,
    DEMO_GOAL_ML,
  ]);

  const colleagueIds = [];
  for (const col of COLLEAGUES) {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [col.name, col.email, passwordHash],
    );
    colleagueIds.push(rows[0].id);
    await pool.query('INSERT INTO user_preferences (user_id, daily_goal_ml) VALUES ($1, $2)', [
      rows[0].id,
      DEMO_GOAL_ML,
    ]);
  }

  return { demoId, colleagueIds };
}

async function insertHistory(userId) {
  for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const baseDay = new Date(Date.now() - daysAgo * MS_PER_DAY);
    for (const { hour, amount } of buildDayEntries(daysAgo)) {
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

async function seedDemoChallenge(demoId, colleagueIds) {
  await pool.query("DELETE FROM challenges WHERE code = 'AGUA-DEMO'");
  const startDate = dayStringDaysAgo(7);
  const endDate = dayStringDaysAgo(-22);

  const { rows } = await pool.query(
    `INSERT INTO challenges
       (code, name, description, prize, daily_goal_ml, start_date, end_date, lock_after_start, creator_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      'AGUA-DEMO',
      'Desafio 30 Dias · Equipe Tech',
      'Bater 2L por dia com check-in real da garrafa! Sem falhar para não apagar a chama da equipe.',
      'Último colocado paga um açaí para o 1º lugar!',
      2000,
      startDate,
      endDate,
      false,
      demoId,
    ],
  );
  const challengeId = rows[0].id;
  const members = [demoId, ...colleagueIds];

  for (const uid of members) {
    await pool.query('INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2)', [
      challengeId,
      uid,
    ]);
  }

  // Últimos 3 dias todos fizeram check-in (Chama Coletiva = 3 🔥!), Mariana tem 6 pts, Demo 5 pts, Lucas 4 pts
  const schedule = [
    { uid: colleagueIds[0], days: [6, 5, 4, 3, 2, 1, 0], color: '#176B9B', caption: 'Garrafa térmica de 2L batida! 💪' },
    { uid: demoId, days: [5, 4, 3, 2, 1], color: '#20B9CF', caption: 'Meta concluída no expediente!' },
    { uid: colleagueIds[1], days: [4, 3, 2, 1], color: '#2E9E6B', caption: 'Check-in pós-treino pago!' },
  ];

  for (const item of schedule) {
    for (const d of item.days) {
      const dateStr = dayStringDaysAgo(d);
      const photo = buildDemoPhotoSvg(`Check-in · ${dateStr}`, item.color);
      await pool.query(
        `INSERT INTO challenge_checkins (challenge_id, user_id, checkin_date, consumed_ml, photo_data, caption)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [challengeId, item.uid, dateStr, 2150, photo, item.caption],
      );
    }
  }
}

async function main() {
  await initDatabase();
  const { demoId, colleagueIds } = await recreateUsers();
  await insertHistory(demoId);
  await seedDemoChallenge(demoId, colleagueIds);
  console.log(`Usuário demo e Sala AGUA-DEMO criados: ${DEMO_USER.email} / ${DEMO_USER.password}`);
}

main()
  .catch((error) => {
    console.error('Falha ao criar dados demo:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
