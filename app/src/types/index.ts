export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface WaterEntry {
  id: number;
  amount_ml: number;
  created_at: string;
  note: string | null;
}

export interface WaterEntryInput {
  amount_ml: number;
  note?: string | null;
}

export interface TodaySummary {
  date: string;
  goal_ml: number;
  consumed_ml: number;
  remaining_ml: number;
  progress: number;
  entries_count: number;
  streak_days: number;
}

export interface WeeklyDay {
  date: string;
  total_ml: number;
  goal_reached: boolean;
}

export interface WeeklySummary {
  goal_ml: number;
  days: WeeklyDay[];
  average_ml: number;
  streak_days: number;
}

export interface Preferences {
  daily_goal_ml: number;
  reminders_enabled: boolean;
  reminder_interval_minutes: number;
  reminder_start_time: string;
  reminder_end_time: string;
}
