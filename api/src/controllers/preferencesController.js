const preferencesService = require('../services/preferencesService');

async function get(req, res) {
  res.json(await preferencesService.get(req.userId));
}

async function update(req, res) {
  res.json(await preferencesService.update(req.userId, req.body));
}

module.exports = { get, update };
