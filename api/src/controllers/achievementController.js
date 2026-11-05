const achievementService = require('../services/achievementService');
const { resolveTimezone } = require('../utils/timezone');

async function list(req, res) {
  res.json(
    await achievementService.getUserAchievements(req.userId, resolveTimezone(req.query.tz)),
  );
}

module.exports = { list };
