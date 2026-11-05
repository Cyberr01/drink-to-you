import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList } from '../../navigation/types';
import { feedback } from '../../services/feedback';
import { waterService } from '../../services/waterService';
import { radius, spacing } from '../../theme/layout';
import { WaterEntry } from '../../types';
import { formatFullDate, formatMl, formatTime } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'EntryDetails'>;

const MAX_AMOUNT_ML = 5000;

export function EntryDetailsScreen({ route, navigation }: Props) {
  const { entryId } = route.params;
  const { colors } = useAppTheme();
  const [entry, setEntry] = useState<WaterEntry | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEntry() {
      try {
        const loaded = await waterService.get(entryId);
        setEntry(loaded);
        setAmount(String(loaded.amount_ml));
        setNote(loaded.note ?? '');
      } catch (caught) {
        setLoadError(caught instanceof Error ? caught.message : 'Erro inesperado.');
      } finally {
        setIsLoading(false);
      }
    }
    loadEntry();
  }, [entryId]);

  async function handleSave() {
    const amountMl = Number(amount);
    if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > MAX_AMOUNT_ML) {
      setError(`Informe um valor entre 1 e ${MAX_AMOUNT_ML} ml.`);
      return;
    }
    setIsSaving(true);
    try {
      await waterService.update(entryId, { amount_ml: amountMl, note: note.trim() || null });
      feedback.success();
      navigation.goBack();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    feedback.warning();
    Alert.alert('Excluir registro', 'Tem certeza que deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    try {
      await waterService.remove(entryId);
      navigation.goBack();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (loadError || !entry) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          icon="alert-circle-outline"
          title="Registro não encontrado"
          description={loadError ?? undefined}
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <Text style={styles.heroAmount}>{formatMl(entry.amount_ml)}</Text>
          <Text style={styles.heroDate}>{formatFullDate(entry.created_at)}</Text>
          <Text style={styles.heroDate}>às {formatTime(entry.created_at)}</Text>
        </View>

        <Text style={[styles.section, { color: colors.navy }]}>Editar registro</Text>
        <TextInput
          label="Quantidade (ml)"
          mode="outlined"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput
          label="Observação"
          mode="outlined"
          value={note}
          onChangeText={setNote}
          maxLength={200}
          style={styles.field}
        />
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button mode="contained" onPress={handleSave} loading={isSaving} disabled={isSaving} contentStyle={styles.buttonContent}>
          Salvar alterações
        </Button>
        <Button
          mode="outlined"
          textColor={colors.danger}
          onPress={confirmDelete}
          icon="delete-outline"
          style={styles.delete}
          contentStyle={styles.buttonContent}
        >
          Excluir registro
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  hero: { borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center' },
  heroAmount: { color: '#fff', fontSize: 40, fontWeight: '800' },
  heroDate: { color: '#ffffffcc', fontSize: 14 },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.lg, marginBottom: spacing.sm },
  field: { marginTop: spacing.sm },
  buttonContent: { paddingVertical: 6 },
  delete: { marginTop: spacing.sm },
});
