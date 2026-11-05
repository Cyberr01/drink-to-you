const DEFAULT_TIMEZONE = 'America/Sao_Paulo';

function isValidTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function resolveTimezone(requested) {
  return requested && isValidTimezone(requested) ? requested : DEFAULT_TIMEZONE;
}

module.exports = { resolveTimezone };
