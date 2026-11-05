require('dotenv').config();

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET'];

function assertRequiredVariables() {
  const missing = requiredVariables.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
}

assertRequiredVariables();

module.exports = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
