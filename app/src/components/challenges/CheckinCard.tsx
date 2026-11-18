import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { PhotoSource } from '../../services/photoService';
import { radius, spacing } from '../../theme/layout';
import { MyCheckinStatus } from '../../types';
import { formatMl } from '../../utils/format';

const CAPTION_MAX_LENGTH = 160;

interface CheckinCardProps {
  status: MyCheckinStatus;
  dailyGoalMl: number;
  photoPreview: string | null;
  caption: string;
  error: string | null;
  isSubmitting: boolean;
  onChangeCaption: (text: string) => void;
  onPickPhoto: (source: PhotoSource) => void;
  onSubmit: () => void;
}

/** Cartão do check-in diário com os requisitos anti-burla, foto, legenda e envio. */
export function CheckinCard(props: CheckinCardProps) {
  const { colors } = useAppTheme();
  const { status } = props;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.navy }]}>Seu Check-in de Hoje (+1 ponto)</Text>
      {status.checked_in_today ? <CheckinDoneBanner /> : <CheckinRequirements {...props} />}
    </View>
  );
}

function CheckinDoneBanner() {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.doneBanner, { backgroundColor: `${colors.success}1A` }]}>
      <MaterialCommunityIcons name="check-decagram" size={26} color={colors.success} />
      <Text style={[styles.doneText, { color: colors.success }]}>
        Check-in de hoje confirmado! Seu ponto já está no ranking.
      </Text>
    </View>
  );
}

function CheckinRequirements({ status, dailyGoalMl, photoPreview, ...formProps }: CheckinCardProps) {
  const { colors } = useAppTheme();
  const consumedText = `${formatMl(status.consumed_ml)} / ${formatMl(dailyGoalMl)}`;
  const entriesText = `${status.entries_count}/${status.required_entries}`;

  return (
    <>
      <RequirementRow done={status.goal_reached} text={`1. Atingir a meta da sala hoje (${consumedText})`} />
      <RequirementRow
        done={status.enough_entries}
        text={`2. Registrar ao menos ${status.required_entries} consumos separados hoje (${entriesText})`}
      />
      <RequirementRow done={!!photoPreview} text="3. Anexar foto da garrafa ou copo d’água como comprovação" />

      {status.can_checkin ? (
        <CheckinForm photoPreview={photoPreview} {...formProps} />
      ) : (
        <Text style={[styles.lockedHint, { color: colors.muted }]}>
          Complete os itens 1 e 2 na aba Início ao longo do dia para liberar o botão da câmera!
        </Text>
      )}
    </>
  );
}

type CheckinFormProps = Omit<CheckinCardProps, 'status' | 'dailyGoalMl'>;

function CheckinForm({
  photoPreview,
  caption,
  error,
  isSubmitting,
  onChangeCaption,
  onPickPhoto,
  onSubmit,
}: CheckinFormProps) {
  return (
    <View style={styles.form}>
      <View style={styles.photoButtons}>
        <Button mode="outlined" icon="camera" onPress={() => onPickPhoto('camera')} style={styles.flex}>
          Câmera
        </Button>
        <Button mode="outlined" icon="image-outline" onPress={() => onPickPhoto('gallery')} style={styles.flex}>
          Galeria
        </Button>
      </View>

      {photoPreview ? <Image source={{ uri: photoPreview }} style={styles.preview} /> : null}

      <TextInput
        label="Legenda do check-in (opcional)"
        placeholder="Ex.: Meta paga antes das 18h! 💧"
        mode="outlined"
        value={caption}
        onChangeText={onChangeCaption}
        maxLength={CAPTION_MAX_LENGTH}
        style={styles.caption}
      />

      <HelperText type="error" visible={!!error}>
        {error}
      </HelperText>

      <Button mode="contained" icon="check-bold" onPress={onSubmit} loading={isSubmitting} disabled={isSubmitting}>
        Confirmar Check-in (+1 Ponto)
      </Button>
    </View>
  );
}

function RequirementRow({ done, text }: { done: boolean; text: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.requirementRow}>
      <MaterialCommunityIcons
        name={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
        size={20}
        color={done ? colors.success : colors.muted}
      />
      <Text style={[styles.requirementText, { color: done ? colors.text : colors.muted }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  doneText: { fontWeight: '700', flex: 1, fontSize: 13 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  requirementText: { fontSize: 13, flex: 1 },
  lockedHint: { fontSize: 12, marginTop: spacing.sm },
  form: { marginTop: spacing.md },
  photoButtons: { flexDirection: 'row', gap: spacing.sm },
  preview: { width: '100%', height: 220, borderRadius: radius.md, marginTop: spacing.sm },
  caption: { marginTop: spacing.sm },
});
