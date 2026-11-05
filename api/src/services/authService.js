const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/pool');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const PASSWORD_SALT_ROUNDS = 10;
const UNIQUE_VIOLATION = '23505';

function toPublicUser(row) {
  return { id: row.id, name: row.name, email: row.email, created_at: row.created_at };
}

function generateToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function insertUser({ name, email, passwordHash }) {
  try {
    const result = await query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, passwordHash],
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new HttpError(409, 'Este e-mail já está cadastrado.');
    }
    throw error;
  }
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
  const user = await insertUser({ name, email, passwordHash });
  await query('INSERT INTO user_preferences (user_id) VALUES ($1)', [user.id]);
  return { user: toPublicUser(user), token: generateToken(user.id) };
}

async function login({ email, password }) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0];
  const passwordMatches = user && (await bcrypt.compare(password, user.password_hash));

  if (!passwordMatches) throw new HttpError(401, 'E-mail ou senha incorretos.');
  return { user: toPublicUser(user), token: generateToken(user.id) };
}

async function getUserById(userId) {
  const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
  if (!result.rows[0]) throw new HttpError(401, 'Usuário não encontrado.');
  return toPublicUser(result.rows[0]);
}

module.exports = { register, login, getUserById };
