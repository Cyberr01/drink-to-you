const { query } = require('../database/pool');
const { HttpError } = require('../utils/httpError');

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_ENTRIES_FOR_CHECKIN = 2;

function todayInTimezone(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

function shiftDay(dayString, offsetDays) {
  const shifted = new Date(Date.parse(`${dayString}T00:00:00Z`) + offsetDays * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

function computeStatus(startDate, endDate, today) {
  if (today < startDate) return 'upcoming';
  if (today > endDate) return 'finished';
  return 'active';
}

function randomInviteCode() {
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `AGUA-${suffix}`;
}

async function generateUniqueCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = randomInviteCode();
    const existing = await query('SELECT 1 FROM challenges WHERE code = $1', [code]);
    if (existing.rowCount === 0) return code;
  }
  throw new HttpError(500, 'Não foi possível gerar código de convite.');
}

function calculateCollectiveStreak(memberIds, daysByUser, referenceDay, startDate) {
  if (memberIds.length === 0) return 0;
  const allCheckedOn = (day) => memberIds.every((id) => daysByUser.get(id)?.has(day));

  let day = allCheckedOn(referenceDay) ? referenceDay : shiftDay(referenceDay, -1);
  let streak = 0;
  while (day >= startDate && allCheckedOn(day)) {
    streak += 1;
    day = shiftDay(day, -1);
  }
  return streak;
}

function calculateUserStreak(daysSet, referenceDay, startDate) {
  if (!daysSet || daysSet.size === 0) return 0;
  let day = daysSet.has(referenceDay) ? referenceDay : shiftDay(referenceDay, -1);
  let streak = 0;
  while (day >= startDate && daysSet.has(day)) {
    streak += 1;
    day = shiftDay(day, -1);
  }
  return streak;
}

async function assertMembership(userId, challengeId) {
  const challengeRes = await query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
  const challenge = challengeRes.rows[0];
  if (!challenge) throw new HttpError(404, 'Sala de desafio não encontrada.');

  const memberRes = await query(
    'SELECT 1 FROM challenge_members WHERE challenge_id = $1 AND user_id = $2',
    [challengeId, userId],
  );
  if (memberRes.rowCount === 0) {
    throw new HttpError(403, 'Você não participa desta sala de desafio.');
  }
  return challenge;
}

async function buildChallengeSummary(challenge, userId, today) {
  const [membersRes, checkinsRes] = await Promise.all([
    query('SELECT user_id FROM challenge_members WHERE challenge_id = $1', [challenge.id]),
    query('SELECT user_id, checkin_date FROM challenge_checkins WHERE challenge_id = $1', [challenge.id]),
  ]);

  const memberIds = membersRes.rows.map((r) => r.user_id);
  const daysByUser = new Map();
  for (const row of checkinsRes.rows) {
    if (!daysByUser.has(row.user_id)) daysByUser.set(row.user_id, new Set());
    daysByUser.get(row.user_id).add(row.checkin_date);
  }

  const refDay = today > challenge.end_date ? challenge.end_date : today;
  const myDays = daysByUser.get(userId) || new Set();

  return {
    id: challenge.id,
    code: challenge.code,
    name: challenge.name,
    description: challenge.description,
    prize: challenge.prize,
    daily_goal_ml: challenge.daily_goal_ml,
    start_date: challenge.start_date,
    end_date: challenge.end_date,
    lock_after_start: challenge.lock_after_start,
    creator_id: challenge.creator_id,
    status: computeStatus(challenge.start_date, challenge.end_date, today),
    members_count: memberIds.length,
    collective_streak: calculateCollectiveStreak(memberIds, daysByUser, refDay, challenge.start_date),
    my_points: myDays.size,
    checked_in_today: myDays.has(today),
  };
}

async function listMyChallenges(userId, timezone) {
  const today = todayInTimezone(timezone);
  const res = await query(
    `SELECT c.*
       FROM challenges c
       JOIN challenge_members cm ON cm.challenge_id = c.id
      WHERE cm.user_id = $1
      ORDER BY c.end_date DESC, c.created_at DESC`,
    [userId],
  );
  return Promise.all(res.rows.map((challenge) => buildChallengeSummary(challenge, userId, today)));
}

async function createChallenge(userId, payload, timezone) {
  const today = todayInTimezone(timezone);
  if (payload.end_date < payload.start_date) {
    throw new HttpError(400, 'A data final deve ser igual ou posterior à data inicial.');
  }
  if (payload.end_date < today) {
    throw new HttpError(400, 'A data final não pode estar no passado.');
  }

  const code = await generateUniqueCode();
  const res = await query(
    `INSERT INTO challenges
       (code, name, description, prize, daily_goal_ml, start_date, end_date, lock_after_start, creator_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      code,
      payload.name.trim(),
      payload.description?.trim() || null,
      payload.prize?.trim() || null,
      payload.daily_goal_ml,
      payload.start_date,
      payload.end_date,
      payload.lock_after_start !== false,
      userId,
    ],
  );
  const challenge = res.rows[0];
  await query('INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2)', [
    challenge.id,
    userId,
  ]);
  return buildChallengeSummary(challenge, userId, today);
}

async function joinByCode(userId, rawCode, timezone) {
  const today = todayInTimezone(timezone);
  const normalizedCode = String(rawCode || '').trim().toUpperCase();
  const challengeRes = await query('SELECT * FROM challenges WHERE code = $1', [normalizedCode]);
  const challenge = challengeRes.rows[0];
  if (!challenge) throw new HttpError(404, 'Código de sala inválido ou não encontrado.');

  const alreadyMember = await query(
    'SELECT 1 FROM challenge_members WHERE challenge_id = $1 AND user_id = $2',
    [challenge.id, userId],
  );
  if (alreadyMember.rowCount > 0) {
    throw new HttpError(409, 'Você já participa desta sala de desafio.');
  }
  if (today > challenge.end_date) {
    throw new HttpError(400, 'Este desafio já foi encerrado.');
  }
  if (challenge.lock_after_start && today > challenge.start_date) {
    throw new HttpError(
      400,
      'Este desafio já iniciou e a entrada de novos participantes está fechada.',
    );
  }

  await query('INSERT INTO challenge_members (challenge_id, user_id) VALUES ($1, $2)', [
    challenge.id,
    userId,
  ]);
  return buildChallengeSummary(challenge, userId, today);
}

async function leaveChallenge(userId, challengeId) {
  await assertMembership(userId, challengeId);
  await query('DELETE FROM challenge_members WHERE challenge_id = $1 AND user_id = $2', [
    challengeId,
    userId,
  ]);
  const remaining = await query(
    'SELECT COUNT(*)::int AS total FROM challenge_members WHERE challenge_id = $1',
    [challengeId],
  );
  if (remaining.rows[0].total === 0) {
    await query('DELETE FROM challenges WHERE id = $1', [challengeId]);
  }
}

async function getTodayWaterStatus(userId, timezone, today) {
  const res = await query(
    `SELECT COALESCE(SUM(amount_ml), 0)::int AS consumed_ml,
            COUNT(*)::int AS entries_count
       FROM water_entries
      WHERE user_id = $1
        AND to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') = $3`,
    [userId, timezone, today],
  );
  return res.rows[0];
}

async function getDetails(userId, challengeId, timezone) {
  const today = todayInTimezone(timezone);
  const challenge = await assertMembership(userId, challengeId);

  const [membersRes, allCheckinsRes, feedRes, todayWater] = await Promise.all([
    query(
      `SELECT u.id, u.name, cm.joined_at
         FROM challenge_members cm
         JOIN users u ON u.id = cm.user_id
        WHERE cm.challenge_id = $1
        ORDER BY cm.joined_at ASC`,
      [challengeId],
    ),
    query(
      'SELECT user_id, checkin_date, consumed_ml FROM challenge_checkins WHERE challenge_id = $1',
      [challengeId],
    ),
    query(
      `SELECT cc.id, cc.user_id, u.name AS user_name, cc.checkin_date, cc.consumed_ml,
              cc.photo_data, cc.caption, cc.created_at,
              COUNT(cr.user_id)::int AS reactions_count,
              BOOL_OR(cr.user_id = $2) AS reacted_by_me
         FROM challenge_checkins cc
         JOIN users u ON u.id = cc.user_id
         LEFT JOIN challenge_reactions cr ON cr.checkin_id = cc.id
        WHERE cc.challenge_id = $1
        GROUP BY cc.id, u.name
        ORDER BY cc.created_at DESC
        LIMIT 30`,
      [challengeId, userId],
    ),
    getTodayWaterStatus(userId, timezone, today),
  ]);

  const daysByUser = new Map();
  const mlByUser = new Map();
  for (const row of allCheckinsRes.rows) {
    if (!daysByUser.has(row.user_id)) daysByUser.set(row.user_id, new Set());
    daysByUser.get(row.user_id).add(row.checkin_date);
    mlByUser.set(row.user_id, (mlByUser.get(row.user_id) || 0) + row.consumed_ml);
  }

  const refDay = today > challenge.end_date ? challenge.end_date : today;
  const memberIds = membersRes.rows.map((m) => m.id);
  const collectiveStreak = calculateCollectiveStreak(
    memberIds,
    daysByUser,
    refDay,
    challenge.start_date,
  );

  const ranking = membersRes.rows
    .map((member) => {
      const daysSet = daysByUser.get(member.id) || new Set();
      return {
        user_id: member.id,
        name: member.name,
        points: daysSet.size,
        total_verified_ml: mlByUser.get(member.id) || 0,
        streak_days: calculateUserStreak(daysSet, refDay, challenge.start_date),
        checked_in_today: daysSet.has(today),
      };
    })
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.streak_days - a.streak_days ||
        b.total_verified_ml - a.total_verified_ml ||
        a.name.localeCompare(b.name),
    )
    .map((entry, idx) => ({ position: idx + 1, ...entry }));

  const myDays = daysByUser.get(userId) || new Set();
  const checkedInToday = myDays.has(today);
  const status = computeStatus(challenge.start_date, challenge.end_date, today);
  const goalReached = todayWater.consumed_ml >= challenge.daily_goal_ml;
  const enoughEntries = todayWater.entries_count >= MIN_ENTRIES_FOR_CHECKIN;

  return {
    challenge: {
      id: challenge.id,
      code: challenge.code,
      name: challenge.name,
      description: challenge.description,
      prize: challenge.prize,
      daily_goal_ml: challenge.daily_goal_ml,
      start_date: challenge.start_date,
      end_date: challenge.end_date,
      lock_after_start: challenge.lock_after_start,
      creator_id: challenge.creator_id,
      status,
      members_count: memberIds.length,
      collective_streak: collectiveStreak,
    },
    my_today: {
      date: today,
      consumed_ml: todayWater.consumed_ml,
      entries_count: todayWater.entries_count,
      required_entries: MIN_ENTRIES_FOR_CHECKIN,
      goal_reached: goalReached,
      enough_entries: enoughEntries,
      checked_in_today: checkedInToday,
      can_checkin: status === 'active' && !checkedInToday && goalReached && enoughEntries,
    },
    ranking,
    checkins: feedRes.rows.map((row) => ({
      ...row,
      reacted_by_me: Boolean(row.reacted_by_me),
    })),
  };
}

async function createCheckin(userId, challengeId, { photo_data, caption }, timezone) {
  const today = todayInTimezone(timezone);
  const challenge = await assertMembership(userId, challengeId);
  const status = computeStatus(challenge.start_date, challenge.end_date, today);

  if (status === 'upcoming') {
    throw new HttpError(400, `Este desafio só começa em ${challenge.start_date}.`);
  }
  if (status === 'finished') {
    throw new HttpError(400, 'Este desafio já foi encerrado.');
  }

  const existing = await query(
    'SELECT 1 FROM challenge_checkins WHERE challenge_id = $1 AND user_id = $2 AND checkin_date = $3',
    [challengeId, userId, today],
  );
  if (existing.rowCount > 0) {
    throw new HttpError(409, 'Você já realizou seu check-in de hoje nesta sala!');
  }

  const todayWater = await getTodayWaterStatus(userId, timezone, today);
  if (todayWater.consumed_ml < challenge.daily_goal_ml) {
    throw new HttpError(
      400,
      `Meta da sala ainda não atingida hoje (${todayWater.consumed_ml} / ${challenge.daily_goal_ml} ml).`,
    );
  }
  if (todayWater.entries_count < MIN_ENTRIES_FOR_CHECKIN) {
    throw new HttpError(
      400,
      `Trava anti-burla: registre pelo menos ${MIN_ENTRIES_FOR_CHECKIN} consumos separados ao longo do dia antes do check-in.`,
    );
  }

  if (!photo_data || !photo_data.startsWith('data:image/')) {
    throw new HttpError(400, 'Envie uma foto válida da sua garrafa ou copo d’água.');
  }

  const res = await query(
    `INSERT INTO challenge_checkins
       (challenge_id, user_id, checkin_date, consumed_ml, photo_data, caption)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, checkin_date, consumed_ml, caption, created_at`,
    [challengeId, userId, today, todayWater.consumed_ml, photo_data, caption?.trim() || null],
  );
  return res.rows[0];
}

async function toggleReaction(userId, challengeId, checkinId) {
  await assertMembership(userId, challengeId);
  const checkinRes = await query(
    'SELECT 1 FROM challenge_checkins WHERE id = $1 AND challenge_id = $2',
    [checkinId, challengeId],
  );
  if (checkinRes.rowCount === 0) throw new HttpError(404, 'Check-in não encontrado.');

  const deleted = await query(
    'DELETE FROM challenge_reactions WHERE checkin_id = $1 AND user_id = $2',
    [checkinId, userId],
  );
  if (deleted.rowCount === 0) {
    await query('INSERT INTO challenge_reactions (checkin_id, user_id) VALUES ($1, $2)', [
      checkinId,
      userId,
    ]);
    return { reacted: true };
  }
  return { reacted: false };
}

module.exports = {
  listMyChallenges,
  createChallenge,
  joinByCode,
  leaveChallenge,
  getDetails,
  createCheckin,
  toggleReaction,
};
