const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const { HttpError } = require('../utils/httpError');

function extractToken(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length);
}

function authenticate(req, res, next) {
  const token = extractToken(req.headers.authorization);
  if (!token) return next(new HttpError(401, 'Token não informado.'));

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = payload.sub;
    return next();
  } catch {
    return next(new HttpError(401, 'Token inválido ou expirado.'));
  }
}

module.exports = { authenticate };
