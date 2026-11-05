const { query } = require('../database/pool');
const preferencesService = require('./preferencesService');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const LEVEL_TITLES = [
  { minXp: 0, title: 'Gota Iniciante' },
  { minXp: 250, title: 'Aprendiz das Águas' },
  { minXp: 600, title: 'Hidratado Fiel' },
  { minXp: 1200, title: 'Guardião da Fonte' },
  { minXp: 2200, title: 'Mestre da Consistência' },
  { minXp: 3800, title: 'Lenda Oceânica' },
];

function todayInTimezone(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

function shiftDay(dayString, offsetDays) {
  const shifted = new Date(Date.parse(`${dayString}T00:00:00Z`) + offsetDays * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

function computeStreaks(dailyRows, goalMl, today) {
  const goalDays = dailyRows
    .filter((row) => row.total_ml >= goalMl)
    .map((row) => row.day)
    .sort();

  const goalSet = new Set(goalDays);
  let currentStreak = 0;
  let cursor = goalSet.has(today) ? today : shiftDay(today, -1);
  while (goalSet.has(cursor)) {
    currentStreak += 1;
    cursor = shiftDay(cursor, -1);
  }

  let bestStreak = 0;
  let running = 0;
  let previousDay = null;
  for (const day of goalDays) {
    if (previousDay && shiftDay(previousDay, 1) === day) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > bestStreak) bestStreak = running;
    previousDay = day;
  }

  return { goalDaysCount: goalDays.length, currentStreak, bestStreak };
}

function buildAchievements(stats) {
  const definitions = [
    {
      id: 'first_sip',
      title: 'Primeiro Gole',
      description: 'Registre seu primeiro consumo de água no aplicativo.',
      icon: 'water-Check',
      iconName: 'cup-water',
      tier: 'bronze',
      tierLabel: 'Iniciante',
      xp: 50,
      current: stats.total_entries,
      target: 1,
      unit: 'registro',
    },
    {
      id: 'daily_five',
      title: 'Ritmo Hidratado',
      description: 'Faça pelo menos 5 registros separados em um mesmo dia.',
      iconName: 'clock-check-outline',
      tier: 'bronze',
      tierLabel: 'Iniciante',
      xp: 80,
      current: stats.max_entries_in_day,
      target: 5,
      unit: 'registros/dia',
    },
    {
      id: 'first_goal',
      title: 'Meta Batida!',
      description: 'Atinja 100% da sua meta diária pela primeira vez.',
      iconName: 'flag-checkered',
      tier: 'bronze',
      tierLabel: 'Iniciante',
      xp: 100,
      current: stats.goal_days,
      target: 1,
      unit: 'dia',
    },
    {
      id: 'early_bird',
      title: 'Madrugador Saudável',
      description: 'Beba água pela manhã (entre 05h e 09h) em 3 dias diferentes.',
      iconName: 'weather-sunset-up',
      tier: 'bronze',
      tierLabel: 'Iniciante',
      xp: 100,
      current: stats.early_morning_days,
      target: 3,
      unit: 'manhãs',
    },
    {
      id: 'streak_3',
      title: 'Chama Acesa',
      description: 'Cumpra sua meta diária por 3 dias consecutivos.',
      iconName: 'fire',
      tier: 'silver',
      tierLabel: 'Consistente',
      xp: 150,
      current: stats.best_streak,
      target: 3,
      unit: 'dias seguidos',
    },
    {
      id: 'team_player',
      title: 'Espírito de Equipe',
      description: 'Crie ou entre na sua primeira Sala de Desafio com amigos.',
      iconName: 'account-group',
      tier: 'silver',
      tierLabel: 'Consistente',
      xp: 150,
      current: stats.challenges_joined,
      target: 1,
      unit: 'sala',
    },
    {
      id: 'volume_20l',
      title: 'Galão de 20 Litros',
      description: 'Acumule 20.000 ml (20 litros) de água registrados.',
      iconName: 'water',
      tier: 'silver',
      tierLabel: 'Consistente',
      xp: 200,
      current: stats.total_ml,
      target: 20000,
      unit: 'ml',
    },
    {
      id: 'streak_7',
      title: 'Semana Perfeita',
      description: 'Cumpra sua meta diária por 7 dias consecutivos.',
      iconName: 'calendar-check',
      tier: 'silver',
      tierLabel: 'Consistente',
      xp: 250,
      current: stats.best_streak,
      target: 7,
      unit: 'dias seguidos',
    },
    {
      id: 'checkin_5',
      title: 'Check-in Comprovado',
      description: 'Realize 5 check-ins com foto em Salas de Desafio.',
      iconName: 'camera-iris',
      tier: 'gold',
      tierLabel: 'Veterano',
      xp: 300,
      current: stats.challenge_checkins,
      target: 5,
      unit: 'check-ins',
    },
    {
      id: 'streak_15',
      title: 'Quinzena Imbatível',
      description: 'Mantenha a sequência batendo a meta por 15 dias seguidos.',
      iconName: 'shield-star',
      tier: 'gold',
      tierLabel: 'Veterano',
      xp: 400,
      current: stats.best_streak,
      target: 15,
      unit: 'dias seguidos',
    },
    {
      id: 'volume_60l',
      title: '60 Litros de Pura Vida',
      description: 'Acumule 60.000 ml (60 litros) de água registrados.',
      iconName: 'waves',
      tier: 'gold',
      tierLabel: 'Veterano',
      xp: 450,
      current: stats.total_ml,
      target: 60000,
      unit: 'ml',
    },
    {
      id: 'checkin_20',
      title: 'Atleta da Hidratação',
      description: 'Conquiste 20 pontos comprovados em Salas de Desafio.',
      iconName: 'trophy-award',
      tier: 'gold',
      tierLabel: 'Veterano',
      xp: 500,
      current: stats.challenge_checkins,
      target: 20,
      unit: 'check-ins',
    },
    {
      id: 'streak_45',
      title: 'Mestre da Consistência (45 Dias)',
      description: 'DESAFIO EXTREMO: Cumpra sua meta por 45 dias consecutivos sem falhar.',
      iconName: 'crown',
      tier: 'diamond',
      tierLabel: 'Lendária',
      xp: 1000,
      current: stats.best_streak,
      target: 45,
      unit: 'dias seguidos',
    },
    {
      id: 'volume_200l',
      title: 'Oceano Particular (200 Litros)',
      description: 'DESAFIO EXTREMO: Acumule 200.000 ml (200 litros) registrados no app.',
      iconName: 'earth',
      tier: 'diamond',
      tierLabel: 'Lendária',
      xp: 1000,
      current: stats.total_ml,
      target: 200000,
      unit: 'ml',
    },
    {
      id: 'checkin_60',
      title: 'Lenda do Desafio (60 Check-ins)',
      description: 'DESAFIO EXTREMO: Realize 60 check-ins com foto em Salas de Desafio.',
      iconName: 'diamond-stone',
      tier: 'diamond',
      tierLabel: 'Lendária',
      xp: 1200,
      current: stats.challenge_checkins,
      target: 60,
      unit: 'check-ins',
    },
  ];

  return definitions.map((item) => {
    const unlocked = item.current >= item.target;
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.iconName,
      tier: item.tier,
      tier_label: item.tierLabel,
      xp: item.xp,
      current: item.current,
      target: item.target,
      unit: item.unit,
      progress: Math.min(item.current / item.target, 1),
      unlocked,
    };
  });
}

function buildLevelInfo(xp) {
  let levelIndex = 0;
  for (let i = 0; i < LEVEL_TITLES.length; i += 1) {
    if (xp >= LEVEL_TITLES[i].minXp) levelIndex = i;
  }
  const currentLevel = LEVEL_TITLES[levelIndex];
  const nextLevel = LEVEL_TITLES[levelIndex + 1] || null;
  const span = nextLevel ? nextLevel.minXp - currentLevel.minXp : 1000;
  const progress = nextLevel ? Math.min((xp - currentLevel.minXp) / span, 1) : 1;

  return {
    number: levelIndex + 1,
    title: currentLevel.title,
    xp,
    next_level_xp: nextLevel ? nextLevel.minXp : null,
    progress,
  };
}

async function getUserAchievements(userId, timezone) {
  const today = todayInTimezone(timezone);

  const [preferences, dailyRes, morningRes, challengeStatsRes] = await Promise.all([
    preferencesService.get(userId),
    query(
      `SELECT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day,
              SUM(amount_ml)::int AS total_ml,
              COUNT(*)::int AS entries_count
         FROM water_entries
        WHERE user_id = $1
        GROUP BY day
        ORDER BY day ASC`,
      [userId, timezone],
    ),
    query(
      `SELECT COUNT(DISTINCT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD'))::int AS days
         FROM water_entries
        WHERE user_id = $1
          AND EXTRACT(HOUR FROM (created_at AT TIME ZONE $2)) BETWEEN 5 AND 8`,
      [userId, timezone],
    ),
    query(
      `SELECT
         (SELECT COUNT(*)::int FROM challenge_members WHERE user_id = $1) AS challenges_joined,
         (SELECT COUNT(*)::int FROM challenge_checkins WHERE user_id = $1) AS challenge_checkins`,
      [userId],
    ),
  ]);

  const dailyRows = dailyRes.rows;
  const totalMl = dailyRows.reduce((sum, r) => sum + r.total_ml, 0);
  const totalEntries = dailyRows.reduce((sum, r) => sum + r.entries_count, 0);
  const maxEntriesInDay = dailyRows.reduce((max, r) => Math.max(max, r.entries_count), 0);

  const { goalDaysCount, currentStreak, bestStreak } = computeStreaks(
    dailyRows,
    preferences.daily_goal_ml,
    today,
  );

  const stats = {
    total_ml: totalMl,
    total_entries: totalEntries,
    max_entries_in_day: maxEntriesInDay,
    early_morning_days: morningRes.rows[0].days,
    goal_days: goalDaysCount,
    current_streak: currentStreak,
    best_streak: bestStreak,
    challenges_joined: challengeStatsRes.rows[0].challenges_joined,
    challenge_checkins: challengeStatsRes.rows[0].challenge_checkins,
  };

  const achievements = buildAchievements(stats);
  const unlockedXp = achievements
    .filter((a) => a.unlocked)
    .reduce((sum, a) => sum + a.xp, 0);
  const activityXp = Math.floor(totalMl / 250) * 5 + goalDaysCount * 15;
  const totalXp = unlockedXp + activityXp;

  return {
    level: buildLevelInfo(totalXp),
    unlocked_count: achievements.filter((a) => a.unlocked).length,
    total_count: achievements.length,
    stats,
    achievements,
  };
}

module.exports = { getUserAchievements };
