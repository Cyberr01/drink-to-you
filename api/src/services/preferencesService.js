const { query } = require('../database/pool');
const { HttpError } = require('../utils/httpError');

const COLUMNS = `daily_goal_ml, reminders_enabled, reminder_interval_minutes,
                 reminder_start_time, reminder_end_time`;

async function get(userId) {
  const result = await query(`SELECT ${COLUMNS} FROM user_preferences WHERE user_id = $1`, [userId]);
  if (!result.rows[0]) throw new HttpError(404, 'Preferências não encontradas.');
  return result.rows[0];
}

async function update(userId, preferences) {
  const result = await query(
    `UPDATE user_preferences
        SET daily_goal_ml = $2,
            reminders_enabled = $3,
            reminder_interval_minutes = $4,
            reminder_start_time = $5,
            reminder_end_time = $6
      WHERE user_id = $1
      RETURNING ${COLUMNS}`,
    [
      userId,
      preferences.daily_goal_ml,
      preferences.reminders_enabled,
      preferences.reminder_interval_minutes,
      preferences.reminder_start_time,
      preferences.reminder_end_time,
    ],
  );
  if (!result.rows[0]) throw new HttpError(404, 'Preferências não encontradas.');
  return result.rows[0];
}

module.exports = { get, update };
