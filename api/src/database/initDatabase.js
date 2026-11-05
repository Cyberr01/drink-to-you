const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
}

module.exports = { initDatabase };
