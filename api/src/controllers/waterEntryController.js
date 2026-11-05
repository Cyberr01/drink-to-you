const waterEntryService = require('../services/waterEntryService');
const summaryService = require('../services/summaryService');
const { resolveTimezone } = require('../utils/timezone');

async function list(req, res) {
  const { limit, offset } = req.query;
  const entries = await waterEntryService.list(req.userId, {
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json(entries);
}

async function getById(req, res) {
  res.json(await waterEntryService.findById(req.userId, Number(req.params.id)));
}

async function create(req, res) {
  const entry = await waterEntryService.create(req.userId, req.body);
  res.status(201).json(entry);
}

async function update(req, res) {
  res.json(await waterEntryService.update(req.userId, Number(req.params.id), req.body));
}

async function remove(req, res) {
  await waterEntryService.remove(req.userId, Number(req.params.id));
  res.status(204).send();
}

async function summaryToday(req, res) {
  res.json(await summaryService.getToday(req.userId, resolveTimezone(req.query.tz)));
}

async function summaryWeekly(req, res) {
  res.json(await summaryService.getWeekly(req.userId, resolveTimezone(req.query.tz)));
}

module.exports = { list, getById, create, update, remove, summaryToday, summaryWeekly };
