CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_entries (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ml  INTEGER NOT NULL CHECK (amount_ml > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note       TEXT
);

CREATE INDEX IF NOT EXISTS idx_water_entries_user_date
  ON water_entries (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_preferences (
  id                        SERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  daily_goal_ml             INTEGER NOT NULL DEFAULT 2000 CHECK (daily_goal_ml > 0),
  reminders_enabled         BOOLEAN NOT NULL DEFAULT FALSE,
  reminder_interval_minutes INTEGER NOT NULL DEFAULT 60 CHECK (reminder_interval_minutes >= 15),
  reminder_start_time       TEXT NOT NULL DEFAULT '08:00',
  reminder_end_time         TEXT NOT NULL DEFAULT '22:00'
);
