const app = require('./app');
const { port } = require('./config/env');
const { initDatabase } = require('./database/initDatabase');

async function start() {
  await initDatabase();
  app.listen(port, () => console.log(`API Drink To You rodando na porta ${port}`));
}

start().catch((error) => {
  console.error('Falha ao iniciar a API:', error.message);
  process.exit(1);
});
