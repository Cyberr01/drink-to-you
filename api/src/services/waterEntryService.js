const { query } = require('../database/pool');
const { HttpError } = require('../utils/httpError');

const DEFAULT_LIST_LIMIT = 200;

async function list(userId, { limit = DEFAULT_LIST_LIMIT, offset = 0 } = {}) {
  const result = await query(
    `SELECT id, amount_ml, created_at, note
       FROM water_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
}

async function findById(userId, entryId) {
  const result = await query(
    'SELECT id, amount_ml, created_at, note FROM water_entries WHERE id = $1 AND user_id = $2',
    [entryId, userId],
  );
  if (!result.rows[0]) throw new HttpError(404, 'Registro não encontrado.');
  return result.rows[0];
}

async function create(userId, { amount_ml, note, created_at }) {
  const result = await query(
    `INSERT INTO water_entries (user_id, amount_ml, note, created_at)
     VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()))
     RETURNING id, amount_ml, created_at, note`,
    [userId, amount_ml, note || null, created_at || null],
  );
  return result.rows[0];
}

async function update(userId, entryId, { amount_ml, note, created_at }) {
  const result = await query(
    `UPDATE water_entries
        SET amount_ml  = $3,
            note       = $4,
            created_at = COALESCE($5::timestamptz, created_at)
      WHERE id = $1 AND user_id = $2
      RETURNING id, amount_ml, created_at, note`,
    [entryId, userId, amount_ml, note || null, created_at || null],
  );
  if (!result.rows[0]) throw new HttpError(404, 'Registro não encontrado.');
  return result.rows[0];
}

async function remove(userId, entryId) {
  const result = await query('DELETE FROM water_entries WHERE id = $1 AND user_id = $2', [
    entryId,
    userId,
  ]);
  if (result.rowCount === 0) throw new HttpError(404, 'Registro não encontrado.');
}

module.exports = { list, findById, create, update, remove };
