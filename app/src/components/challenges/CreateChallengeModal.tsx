import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Modal, Switch, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { challengeService } from '../../services/challengeService';
import { feedback } from '../../services/feedback';
import { radius, spacing } from '../../theme/layout';
import { ChallengeSummary } from '../../types';
import { getErrorMessage } from '../../utils/errors';

const GOAL_PRESETS = [1500, 2000, 2500, 3000];
const DURATION_PRESETS = [7, 15, 30, 60];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDaysToToday(days: number) {
  return new Date(Date.now() + days * MS_PER_DAY).toLocaleDateString('en-CA');
}

interface CreateChallengeModalProps {
  visible: boolean;
  onDismiss: () => void;
  onCreated: (challenge: ChallengeSummary) => Promise<void> | void;
}

/** Modal de criação de uma nova sala de desafio com validação de meta e datas. */
export function CreateChallengeModal({ visible, onDismiss, onCreated }: CreateChallengeModalProps) {
  const { colors } = useAppTheme();

  const [name, setName] = useState('');
  const [goalMl, setGoalMl] = useState('2000');
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(() => addDaysToToday(0));
  const [endDate, setEndDate] = useState(() => addDaysToToday(30));
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [lockAfterStart, setLockAfterStart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  function applyDuration(days: number) {
    setDurationDays(days);
    const base = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) {
      setEndDate(addDaysToToday(days));
      return;
    }
    setEndDate(new Date(base.getTime() + days * MS_PER_DAY).toLocaleDateString('en-CA'));
  }

  function validateForm() {
    const parsedGoal = Number(goalMl);
    if (name.trim().length < 3) return 'Dê um nome com pelo menos 3 letras (ex.: Desafio 60 Dias).';
    if (!Number.isInteger(parsedGoal) || parsedGoal < 500 || parsedGoal > 10000) {
      return 'A meta da sala deve estar entre 500 e 10000 ml.';
    }
    if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) {
      return 'Use datas no formato AAAA-MM-DD.';
    }
    return null;
  }

  async function handleCreate() {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      const created = await challengeService.create({
        name: name.trim(),
        daily_goal_ml: Number(goalMl),
        start_date: startDate,
        end_date: endDate,
        prize: prize.trim() || null,
        description: description.trim() || null,
        lock_after_start: lockAfterStart,
      });
      feedback.success();
      setName('');
      setPrize('');
      setDescription('');
      await onCreated(created);
    } catch (caught) {
      setError(getErrorMessage(caught, 'Erro ao criar sala.'));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[
        styles.modal,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.title, { color: colors.navy }]}>Nova Sala de Desafio</Text>
          <TextInput
            label="Nome da sala"
            placeholder="Ex.: Desafio 60 Dias da Firma"
            mode="outlined"
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Meta diária da sala</Text>
          <View style={styles.chips}>
            {GOAL_PRESETS.map((preset) => (
              <Chip
                key={preset}
                selected={Number(goalMl) === preset}
                onPress={() => setGoalMl(String(preset))}
              >
                {preset} ml
              </Chip>
            ))}
          </View>
          <TextInput
            label="Meta personalizada (ml)"
            mode="outlined"
            keyboardType="number-pad"
            value={goalMl}
            onChangeText={setGoalMl}
            style={styles.topGap}
          />

          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Duração rápida</Text>
          <View style={styles.chips}>
            {DURATION_PRESETS.map((days) => (
              <Chip
                key={days}
                selected={durationDays === days}
                onPress={() => applyDuration(days)}
              >
                {days} dias
              </Chip>
            ))}
          </View>

          <View style={styles.dateRow}>
            <TextInput
              label="Início (AAAA-MM-DD)"
              mode="outlined"
              value={startDate}
              onChangeText={setStartDate}
              style={styles.flex}
            />
            <TextInput
              label="Fim (AAAA-MM-DD)"
              mode="outlined"
              value={endDate}
              onChangeText={setEndDate}
              style={styles.flex}
            />
          </View>

          <TextInput
            label="Prêmio combinado (opcional)"
            placeholder="Ex.: Último paga um açaí"
            mode="outlined"
            value={prize}
            onChangeText={setPrize}
            style={styles.topGap}
          />
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            A premiação é opcional e de responsabilidade exclusiva dos participantes.
          </Text>

          <TextInput
            label="Regras / Descrição (opcional)"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            style={styles.topGap}
          />

          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.switchTitle, { color: colors.text }]}>
                Fechar sala após o dia de início
              </Text>
              <Text style={[styles.switchHint, { color: colors.muted }]}>
                Impede entrada de novos membros depois que o desafio começa
              </Text>
            </View>
            <Switch value={lockAfterStart} onValueChange={setLockAfterStart} />
          </View>

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <View style={styles.actions}>
            <Button onPress={onDismiss} style={styles.flex}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={isCreating}
              disabled={isCreating}
              style={styles.flex}
            >
              Criar Sala
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modal: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxHeight: '88%',
    maxWidth: 520,
    width: '92%',
    alignSelf: 'center',
  },
  title: { fontSize: 19, fontWeight: '800', marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginTop: spacing.md, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topGap: { marginTop: spacing.sm + 2 },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm + 2 },
  disclaimer: { fontSize: 11, marginTop: 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  switchTitle: { fontWeight: '600', fontSize: 13 },
  switchHint: { fontSize: 11 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
