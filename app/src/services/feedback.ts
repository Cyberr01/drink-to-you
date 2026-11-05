import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function safely(action: () => Promise<void>, vibratePattern: number | number[] = 15) {
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(vibratePattern);
      }
      return;
    }
    await action();
  } catch {
    // Dispositivos sem suporte a vibração simplesmente ignoram o feedback.
  }
}

export const feedback = {
  tap: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 10),
  success: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [15, 40, 20]),
  warning: () =>
    safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), [30, 50, 30]),
};
