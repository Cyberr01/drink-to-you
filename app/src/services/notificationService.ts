import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Preferences } from '../types';

const CHANNEL_ID = 'hydration-reminders';
const MAX_SCHEDULED_REMINDERS = 60;
const MINUTES_PER_HOUR = 60;

const REMINDER_MESSAGES = [
  'Hora de um golinho de água! 💧',
  'Que tal um copo d’água agora?',
  'Seu corpo agradece: beba água! 💦',
  'Pausa rápida para se hidratar.',
];

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let webReminderTimer: ReturnType<typeof setInterval> | null = null;

function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

export function buildReminderMinutes(preferences: Preferences) {
  const start = parseTimeToMinutes(preferences.reminder_start_time);
  const end = parseTimeToMinutes(preferences.reminder_end_time);
  const step = preferences.reminder_interval_minutes;
  const times: number[] = [];

  for (let minute = start; minute <= end; minute += step) times.push(minute);
  return times.slice(0, MAX_SCHEDULED_REMINDERS);
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Lembretes de hidratação',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (window.Notification.permission === 'granted') return true;
    const result = await window.Notification.requestPermission();
    return result === 'granted';
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelReminders() {
  if (Platform.OS === 'web') {
    if (webReminderTimer) {
      clearInterval(webReminderTimer);
      webReminderTimer = null;
    }
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function scheduleReminderAt(totalMinutes: number, index: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Drink To You',
      body: REMINDER_MESSAGES[index % REMINDER_MESSAGES.length],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: Math.floor(totalMinutes / MINUTES_PER_HOUR),
      minute: totalMinutes % MINUTES_PER_HOUR,
      channelId: CHANNEL_ID,
    },
  });
}

function scheduleWebReminders(preferences: Preferences) {
  if (webReminderTimer) clearInterval(webReminderTimer);
  const intervalMs = preferences.reminder_interval_minutes * 60 * 1000;
  const startMin = parseTimeToMinutes(preferences.reminder_start_time);
  const endMin = parseTimeToMinutes(preferences.reminder_end_time);

  webReminderTimer = setInterval(() => {
    const now = new Date();
    const currentMin = now.getHours() * MINUTES_PER_HOUR + now.getMinutes();
    if (currentMin >= startMin && currentMin <= endMin && 'Notification' in window && window.Notification.permission === 'granted') {
      const msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
      new window.Notification('Drink To You', { body: msg, icon: '/icon.png' });
    }
  }, intervalMs);
}

/** Envia uma notificação imediata para o usuário testar se os alertas estão funcionando no aparelho. */
export async function sendTestNotification(): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (Platform.OS === 'web') {
    new window.Notification('Drink To You 💧', {
      body: 'Notificações ativas! Vamos manter sua hidratação em dia.',
      icon: '/icon.png',
    });
    return true;
  }

  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Drink To You 💧',
      body: 'Notificações ativas! Vamos manter sua hidratação em dia.',
    },
    trigger: null,
  });
  return true;
}

/** Reagenda todos os lembretes diários conforme as preferências. Retorna false se faltar permissão. */
export async function syncReminders(preferences: Preferences) {
  await cancelReminders();
  if (!preferences.reminders_enabled) return true;

  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (Platform.OS === 'web') {
    scheduleWebReminders(preferences);
    return true;
  }

  await ensureAndroidChannel();
  const times = buildReminderMinutes(preferences);
  for (const [index, minutes] of times.entries()) await scheduleReminderAt(minutes, index);
  return true;
}
