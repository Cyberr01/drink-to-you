const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function formatMl(value: number) {
  return `${value.toLocaleString('pt-BR')} ml`;
}

export function formatLongDate(date: Date = new Date()) {
  const text = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function localDayKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA');
}

export function formatDayTitle(dayKey: string) {
  const today = new Date().toLocaleDateString('en-CA');
  const yesterday = new Date(Date.now() - MS_PER_DAY).toLocaleDateString('en-CA');
  if (dayKey === today) return 'Hoje';
  if (dayKey === yesterday) return 'Ontem';

  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

export function weekdayInitial(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number);
  return WEEKDAYS_SHORT[new Date(year, month - 1, day).getDay()];
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function motivationalMessage(progress: number, remainingMl: number) {
  if (progress >= 1) return 'Meta do dia concluída! 🎉 Parabéns!';
  if (progress >= 0.75) return `Quase lá! Faltam só ${formatMl(remainingMl)}.`;
  if (progress >= 0.4) return 'Bom ritmo! Continue assim. 💪';
  if (progress > 0) return 'Ótimo começo! Cada gole conta.';
  return 'Que tal começar o dia com um copo d’água?';
}

export function firstName(fullName: string) {
  return fullName.trim().split(' ')[0];
}

export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
