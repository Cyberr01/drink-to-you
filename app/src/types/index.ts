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

export type ChallengeStatus = 'upcoming' | 'active' | 'finished';

export interface ChallengeSummary {
  id: number;
  code: string;
  name: string;
  description: string | null;
  prize: string | null;
  daily_goal_ml: number;
  start_date: string;
  end_date: string;
  lock_after_start: boolean;
  creator_id: number;
  status: ChallengeStatus;
  members_count: number;
  collective_streak: number;
  my_points: number;
  checked_in_today: boolean;
}

export interface CreateChallengeInput {
  name: string;
  description?: string | null;
  prize?: string | null;
  daily_goal_ml: number;
  start_date: string;
  end_date: string;
  lock_after_start: boolean;
}

export interface ChallengeRankingItem {
  position: number;
  user_id: number;
  name: string;
  points: number;
  total_verified_ml: number;
  streak_days: number;
  checked_in_today: boolean;
}

export interface ChallengeCheckinItem {
  id: number;
  user_id: number;
  user_name: string;
  checkin_date: string;
  consumed_ml: number;
  photo_data: string;
  caption: string | null;
  created_at: string;
  reactions_count: number;
  reacted_by_me: boolean;
}

export interface ChallengeDetailsResponse {
  challenge: Omit<ChallengeSummary, 'my_points' | 'checked_in_today'>;
  my_today: {
    date: string;
    consumed_ml: number;
    entries_count: number;
    required_entries: number;
    goal_reached: boolean;
    enough_entries: boolean;
    checked_in_today: boolean;
    can_checkin: boolean;
  };
  ranking: ChallengeRankingItem[];
  checkins: ChallengeCheckinItem[];
}

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  tier_label: string;
  xp: number;
  current: number;
  target: number;
  unit: string;
  progress: number;
  unlocked: boolean;
}

export interface UserLevel {
  number: number;
  title: string;
  xp: number;
  next_level_xp: number | null;
  progress: number;
}

export interface AchievementsResponse {
  level: UserLevel;
  unlocked_count: number;
  total_count: number;
  stats: {
    total_ml: number;
    total_entries: number;
    max_entries_in_day: number;
    early_morning_days: number;
    goal_days: number;
    current_streak: number;
    best_streak: number;
    challenges_joined: number;
    challenge_checkins: number;
  };
  achievements: AchievementItem[];
}
