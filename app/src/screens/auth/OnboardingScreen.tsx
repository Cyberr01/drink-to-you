import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import { AuthLayout } from '../../components/common/AuthLayout';
import { BrandHeader } from '../../components/common/BrandHeader';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { preferencesService } from '../../services/preferencesService';

const GOAL_OPTIONS_ML = [1500, 2000, 2500, 3000];
const MIN_GOAL_ML = 500;
const MAX_GOAL_ML = 10000;

export function OnboardingScreen() {
  const { user, completeOnboarding } = useAuth();
  const { colors } = useAppTheme();
  const [goal, setGoal] = useState('2000');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleStart() {
    const goalMl = Number(goal);
    if (!Number.isInteger(goalMl) || goalMl < MIN_GOAL_ML || goalMl > MAX_GOAL_ML) {
      setError(`Escolha uma meta entre ${MIN_GOAL_ML} e ${MAX_GOAL_ML} ml.`);
      return;
    }
    setIsSaving(true);
    try {
      const current = await preferencesService.get();
      await preferencesService.update({ ...current, daily_goal_ml: goalMl });
      await completeOnboarding();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
      setIsSaving(false);
    }
  }

  return (
    <AuthLayout>
      <BrandHeader subtitle={`Bem-vindo(a), ${user?.name.split(' ')[0] ?? ''}!`} />
      <Text style={[styles.title, { color: colors.navy }]}>Qual será sua meta diária?</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Escolha um valor que faça sentido para você. Você pode mudar quando quiser nas
        Configurações. É uma preferência pessoal, não uma recomendação médica.
      </Text>
      <View style={styles.chips}>
        {GOAL_OPTIONS_ML.map((option) => (
          <Chip
            key={option}
            selected={Number(goal) === option}
            showSelectedCheck
            onPress={() => setGoal(String(option))}
          >
            {option} ml
          </Chip>
        ))}
      </View>
      <TextInput
        label="Meta personalizada (ml)"
        mode="outlined"
        keyboardType="number-pad"
        value={goal}
        onChangeText={setGoal}
      />
      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>
      <Button mode="contained" onPress={handleStart} loading={isSaving} disabled={isSaving} contentStyle={styles.buttonContent}>
        Começar
      </Button>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  description: { textAlign: 'center', marginTop: 8, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16 },
  buttonContent: { paddingVertical: 6 },
});
