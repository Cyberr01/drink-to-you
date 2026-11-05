const challengeService = require('../services/challengeService');
const { resolveTimezone } = require('../utils/timezone');

async function list(req, res) {
  res.json(await challengeService.listMyChallenges(req.userId, resolveTimezone(req.query.tz)));
}

async function create(req, res) {
  const created = await challengeService.createChallenge(
    req.userId,
    req.body,
    resolveTimezone(req.query.tz),
  );
  res.status(201).json(created);
}

async function join(req, res) {
  const joined = await challengeService.joinByCode(
    req.userId,
    req.body.code,
    resolveTimezone(req.query.tz),
  );
  res.json(joined);
}

async function leave(req, res) {
  await challengeService.leaveChallenge(req.userId, Number(req.params.id));
  res.status(204).send();
}

async function details(req, res) {
  res.json(
    await challengeService.getDetails(
      req.userId,
      Number(req.params.id),
      resolveTimezone(req.query.tz),
    ),
  );
}

async function createCheckin(req, res) {
  const created = await challengeService.createCheckin(
    req.userId,
    Number(req.params.id),
    req.body,
    resolveTimezone(req.query.tz),
  );
  res.status(201).json(created);
}

async function toggleReaction(req, res) {
  const result = await challengeService.toggleReaction(
    req.userId,
    Number(req.params.id),
    Number(req.params.checkinId),
  );
  res.json(result);
}

module.exports = { list, create, join, leave, details, createCheckin, toggleReaction };
