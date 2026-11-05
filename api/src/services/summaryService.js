const { query } = require('../database/pool');
const preferencesService = require('./preferencesService');

const HISTORY_DAYS = 90;
const WEEK_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayInTimezone(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

function shiftDay(dayString, offsetDays) {
  const shifted = new Date(Date.parse(`${dayString}T00:00:00Z`) + offsetDays * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

async function totalsByDay(userId, timezone) {
  const result = await query(
    `SELECT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day,
            SUM(amount_ml)::int AS total_ml
       FROM water_entries
      WHERE user_id = $1 AND created_at >= NOW() - ($3 || ' days')::interval
      GROUP BY day`,
    [userId, timezone, String(HISTORY_DAYS + 1)],
  );
  return new Map(result.rows.map((row) => [row.day, row.total_ml]));
}

function calculateStreak(totals, goal, today) {
  const reachedToday = (totals.get(today) || 0) >= goal;
  let day = reachedToday ? today : shiftDay(today, -1);
  let streak = 0;

  while ((totals.get(day) || 0) >= goal) {
    streak += 1;
    day = shiftDay(day, -1);
  }
  return streak;
}

async function getToday(userId, timezone) {
  const [totals, preferences] = await Promise.all([
    totalsByDay(userId, timezone),
    preferencesService.get(userId),
  ]);
  const today = todayInTimezone(timezone);
  const consumed = totals.get(today) || 0;
  const goal = preferences.daily_goal_ml;

  const countResult = await query(
    `SELECT COUNT(*)::int AS entries
       FROM water_entries
      WHERE user_id = $1
        AND to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') = $3`,
    [userId, timezone, today],
  );

  return {
    date: today,
    goal_ml: goal,
    consumed_ml: consumed,
    remaining_ml: Math.max(goal - consumed, 0),
    progress: Math.min(consumed / goal, 1),
    entries_count: countResult.rows[0].entries,
    streak_days: calculateStreak(totals, goal, today),
  };
}

async function getWeekly(userId, timezone) {
  const [totals, preferences] = await Promise.all([
    totalsByDay(userId, timezone),
    preferencesService.get(userId),
  ]);
  const today = todayInTimezone(timezone);
  const goal = preferences.daily_goal_ml;

  const days = Array.from({ length: WEEK_DAYS }, (_, index) => {
    const date = shiftDay(today, index - (WEEK_DAYS - 1));
    const total = totals.get(date) || 0;
    return { date, total_ml: total, goal_reached: total >= goal };
  });

  return {
    goal_ml: goal,
    days,
    average_ml: Math.round(days.reduce((sum, day) => sum + day.total_ml, 0) / WEEK_DAYS),
    streak_days: calculateStreak(totals, goal, today),
  };
}

module.exports = { getToday, getWeekly };
