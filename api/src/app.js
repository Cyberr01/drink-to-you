const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const waterEntryRoutes = require('./routes/waterEntryRoutes');
const preferencesRoutes = require('./routes/preferencesRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();
const webDir = path.join(__dirname, '../public');
const indexHtml = path.join(webDir, 'index.html');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/water-entries', waterEntryRoutes);
app.use('/api/preferences', preferencesRoutes);

if (fs.existsSync(indexHtml)) {
  app.use(express.static(webDir));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(indexHtml));
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
