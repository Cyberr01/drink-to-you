import * as Haptics from 'expo-haptics';

async function safely(action: () => Promise<void>) {
  try {
    await action();
  } catch {
    // Dispositivos sem suporte a vibração simplesmente ignoram o feedback.
  }
}

export const feedback = {
  tap: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
