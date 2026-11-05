import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  HelperText,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFetch } from '../../hooks/useFetch';
import { feedback } from '../../services/feedback';
import { sendTestNotification, syncReminders } from '../../services/notificationService';
import { preferencesService } from '../../services/preferencesService';
import { radius, spacing } from '../../theme/layout';
import { TIME_PATTERN } from '../../utils/format';

const INTERVAL_OPTIONS_MIN = [30, 60, 90, 120];
const MIN_GOAL_ML = 500;
const MAX_GOAL_ML = 10000;

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark, setDarkMode } = useAppTheme();
  const { data: preferences, isLoading, error, reload } = useFetch(preferencesService.get);

  const [goal, setGoal] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [interval, setInterval] = useState(60);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!preferences) return;
    setGoal(String(preferences.daily_goal_ml));
    setRemindersEnabled(preferences.reminders_enabled);
    setInterval(preferences.reminder_interval_minutes);
    setStartTime(preferences.reminder_start_time);
    setEndTime(preferences.reminder_end_time);
  }, [preferences]);

  function validate() {
    const goalMl = Number(goal);
    if (!Number.isInteger(goalMl) || goalMl < MIN_GOAL_ML || goalMl > MAX_GOAL_ML) {
      return `A meta deve estar entre ${MIN_GOAL_ML} e ${MAX_GOAL_ML} ml.`;
    }
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      return 'Use o formato HH:MM nos horários (ex.: 08:00).';
    }
    if (startTime >= endTime) return 'O horário inicial deve ser anterior ao final.';
    return null;
  }

  async function handleSave() {
    const validationError = validate();
    setFormError(validationError);
    if (validationError) return;

    setIsSaving(true);
    try {
      const saved = await preferencesService.update({
        daily_goal_ml: Number(goal),
        reminders_enabled: remindersEnabled,
        reminder_interval_minutes: interval,
        reminder_start_time: startTime,
        reminder_end_time: endTime,
      });
      const remindersGranted = await syncReminders(saved);
      feedback.success();
      setSnackbarMessage(
        remindersGranted
          ? 'Configurações salvas! ✅'
          : 'Salvo, mas as notificações estão sem permissão no aparelho.',
      );
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestNotification() {
    const sent = await sendTestNotification();
    if (sent) {
      feedback.tap();
      setSnackbarMessage('Notificação de teste enviada! 🔔');
    } else {
      setSnackbarMessage('Permita notificações nas configurações do aparelho/navegador.');
    }
  }

  function confirmSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente sair da conta?')) {
        signOut();
      }
      return;
    }
    Alert.alert('Sair da conta', 'Deseja realmente sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !preferences) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          icon="wifi-off"
          title="Não foi possível carregar"
          description={error ?? undefined}
          actionLabel="Tentar novamente"
          onAction={reload}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            keyboardHeight > 0 && { paddingBottom: keyboardHeight + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.navy }]}>Configurações</Text>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.userName, { color: colors.navy }]}>{user?.name}</Text>
            <Text style={{ color: colors.muted }}>{user?.email}</Text>
          </View>

          <Text style={[styles.section, { color: colors.navy }]}>Meta diária</Text>
          <TextInput
            label="Meta (ml)"
            mode="outlined"
            keyboardType="number-pad"
            value={goal}
            onChangeText={setGoal}
          />
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            A meta é uma preferência pessoal e não uma recomendação médica.
          </Text>

          <Text style={[styles.section, { color: colors.navy }]}>Lembretes</Text>
          <View
            style={[
              styles.card,
              styles.switchRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>Ativar lembretes</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Notificações para você se hidratar
              </Text>
            </View>
            <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} />
          </View>

          {remindersEnabled ? (
            <>
              <Text style={[styles.label, { color: colors.muted }]}>Intervalo</Text>
              <View style={styles.chips}>
                {INTERVAL_OPTIONS_MIN.map((option) => (
                  <Chip key={option} selected={interval === option} onPress={() => setInterval(option)}>
                    {option} min
                  </Chip>
                ))}
              </View>
              <View style={styles.timeRow}>
                <TextInput
                  label="Início"
                  mode="outlined"
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="08:00"
                  style={styles.flex}
                />
                <TextInput
                  label="Fim"
                  mode="outlined"
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="22:00"
                  style={styles.flex}
                />
              </View>
            </>
          ) : null}

          <Button
            mode="outlined"
            icon="bell-ring-outline"
            onPress={handleTestNotification}
            style={styles.testButton}
          >
            Testar notificação agora
          </Button>

          <Text style={[styles.section, { color: colors.navy }]}>Aparência</Text>
          <View
            style={[
              styles.card,
              styles.switchRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.switchTitle, styles.flex, { color: colors.text }]}>Modo escuro</Text>
            <Switch value={isDark} onValueChange={setDarkMode} />
          </View>

          <HelperText type="error" visible={!!formError}>
            {formError}
          </HelperText>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            contentStyle={styles.buttonContent}
          >
            Salvar configurações
          </Button>
          <Button
            mode="outlined"
            icon="logout"
            textColor={colors.danger}
            onPress={confirmSignOut}
            style={styles.logout}
            contentStyle={styles.buttonContent}
          >
            Sair da conta
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage(null)} duration={3000}>
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: spacing.md },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  userName: { fontSize: 18, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  disclaimer: { fontSize: 12, marginTop: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchTitle: { fontSize: 15, fontWeight: '600' },
  label: { marginTop: spacing.md, marginBottom: spacing.sm, fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  testButton: { marginTop: spacing.md },
  buttonContent: { paddingVertical: 6 },
  logout: { marginTop: spacing.sm },
});
