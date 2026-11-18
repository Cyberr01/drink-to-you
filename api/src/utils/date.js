const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Retorna a data atual (YYYY-MM-DD) no fuso horário informado. */
function todayInTimezone(timezone) {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
}

function shiftDay(dayString, offsetDays) {
  const shifted = new Date(Date.parse(`${dayString}T00:00:00Z`) + offsetDays * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
}

module.exports = { todayInTimezone, shiftDay };
