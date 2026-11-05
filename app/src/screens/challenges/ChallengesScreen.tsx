import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  HelperText,
  Modal,
  Portal,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList } from '../../navigation/types';
import { challengeService } from '../../services/challengeService';
import { feedback } from '../../services/feedback';
import { radius, spacing } from '../../theme/layout';
import { ChallengeSummary } from '../../types';
import { formatMl } from '../../utils/format';

const GOAL_PRESETS = [1500, 2000, 2500, 3000];
const DURATION_PRESETS = [7, 15, 30, 60];

function addDaysToToday(days: number) {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-CA');
}

export function ChallengesScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [joinVisible, setJoinVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  const [createVisible, setCreateVisible] = useState(false);
  const [name, setName] = useState('');
  const [goalMl, setGoalMl] = useState('2000');
  const [durationDays, setDurationDays] = useState(30);
  const [startDate, setStartDate] = useState(() => addDaysToToday(0));
  const [endDate, setEndDate] = useState(() => addDaysToToday(30));
  const [prize, setPrize] = useState('');
  const [description, setDescription] = useState('');
  const [lockAfterStart, setLockAfterStart] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setChallenges(await challengeService.list());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  function applyDuration(days: number) {
    setDurationDays(days);
    const base = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) {
      setEndDate(addDaysToToday(days));
      return;
    }
    const target = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setEndDate(target.toLocaleDateString('en-CA'));
  }

  async function handleJoin() {
    if (joinCode.trim().length < 4) {
      setJoinError('Informe o código da sala (ex.: AGUA-DEMO).');
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const joined = await challengeService.join(joinCode.trim());
      feedback.success();
      setJoinVisible(false);
      setJoinCode('');
      await load();
      navigation.navigate('ChallengeDetails', { challengeId: joined.id });
    } catch (caught) {
      setJoinError(caught instanceof Error ? caught.message : 'Erro ao entrar na sala.');
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCreate() {
    const parsedGoal = Number(goalMl);
    if (name.trim().length < 3) {
      setCreateError('Dê um nome com pelo menos 3 letras (ex.: Desafio 60 Dias).');
      return;
    }
    if (!Number.isInteger(parsedGoal) || parsedGoal < 500 || parsedGoal > 10000) {
      setCreateError('A meta da sala deve estar entre 500 e 10000 ml.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setCreateError('Use datas no formato AAAA-MM-DD.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await challengeService.create({
        name: name.trim(),
        daily_goal_ml: parsedGoal,
        start_date: startDate,
        end_date: endDate,
        prize: prize.trim() || null,
        description: description.trim() || null,
        lock_after_start: lockAfterStart,
      });
      feedback.success();
      setCreateVisible(false);
      setName('');
      setPrize('');
      setDescription('');
      setSnackbar(`Sala criada! Código: ${created.code} 🎉`);
      await load();
      navigation.navigate('ChallengeDetails', { challengeId: created.id });
    } catch (caught) {
      setCreateError(caught instanceof Error ? caught.message : 'Erro ao criar sala.');
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <LinearGradient
          colors={['#102B46', '#176B9B', '#20B9CF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroHeader}>
            <MaterialCommunityIcons name="trophy" size={32} color="#FFD54F" />
            <View style={styles.flex}>
              <Text style={styles.heroTitle}>Desafios & Duplas</Text>
              <Text style={styles.heroSub}>
                Crie uma sala com colegas ou em dupla, faça check-in com foto e mantenha a chama acesa!
              </Text>
            </View>
          </View>

          <View style={styles.heroButtons}>
            <Button
              mode="contained"
              buttonColor="#fff"
              textColor="#102B46"
              icon="plus-circle-outline"
              onPress={() => setCreateVisible(true)}
              style={styles.flex}
            >
              Criar Sala
            </Button>
            <Button
              mode="outlined"
              textColor="#fff"
              icon="key-variant"
              onPress={() => setJoinVisible(true)}
              style={[styles.flex, styles.joinBtn]}
            >
              Usar Código
            </Button>
          </View>
        </LinearGradient>

        {error ? (
          <StateMessage
            icon="wifi-off"
            title="Erro ao carregar desafios"
            description={error}
            actionLabel="Tentar novamente"
            onAction={load}
          />
        ) : challenges.length === 0 ? (
          <StateMessage
            icon="account-group-outline"
            title="Você ainda não está em nenhum desafio"
            description="Crie uma sala para sua dupla ou equipe de trabalho, ou entre usando um código como AGUA-DEMO!"
            actionLabel="Entrar com código"
            onAction={() => setJoinVisible(true)}
          />
        ) : (
          <>
            <Text style={[styles.section, { color: colors.navy }]}>Minhas Salas</Text>
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onPress={() =>
                  navigation.navigate('ChallengeDetails', { challengeId: challenge.id })
                }
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* Dialog: Entrar com Código */}
      <Portal>
        <Dialog visible={joinVisible} onDismiss={() => setJoinVisible(false)}>
          <Dialog.Title>Entrar em Sala de Desafio</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Código do convite"
              placeholder="Ex.: AGUA-DEMO"
              mode="outlined"
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <HelperText type="error" visible={!!joinError}>
              {joinError}
            </HelperText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinVisible(false)}>Cancelar</Button>
            <Button onPress={handleJoin} loading={isJoining} disabled={isJoining}>
              Entrar
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Modal: Criar Sala */}
        <Modal
          visible={createVisible}
          onDismiss={() => setCreateVisible(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle, { color: colors.navy }]}>Nova Sala de Desafio</Text>
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
              <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
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
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                    Fechar sala após o dia de início
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    Impede entrada de novos membros depois que o desafio começa
                  </Text>
                </View>
                <Switch value={lockAfterStart} onValueChange={setLockAfterStart} />
              </View>

              <HelperText type="error" visible={!!createError}>
                {createError}
              </HelperText>

              <View style={styles.modalActions}>
                <Button onPress={() => setCreateVisible(false)} style={styles.flex}>
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
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

function ChallengeCard({
  challenge,
  onPress,
}: {
  challenge: ChallengeSummary;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();

  const statusInfo =
    challenge.status === 'active'
      ? { label: 'Em andamento', color: colors.success }
      : challenge.status === 'upcoming'
        ? { label: 'Em breve', color: colors.accent }
        : { label: 'Encerrado', color: colors.muted };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text style={[styles.cardTitle, { color: colors.navy }]}>{challenge.name}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            Código <Text style={{ fontWeight: '800', color: colors.primary }}>{challenge.code}</Text>{' '}
            · Meta {formatMl(challenge.daily_goal_ml)}/dia
          </Text>
        </View>
        <View style={[styles.flamePill, { backgroundColor: '#FF704320' }]}>
          <MaterialCommunityIcons name="fire" size={18} color="#FF7043" />
          <Text style={styles.flameText}>{challenge.collective_streak}d</Text>
        </View>
      </View>

      {challenge.prize ? (
        <View style={[styles.prizeRow, { backgroundColor: colors.surfaceAlt }]}>
          <MaterialCommunityIcons name="gift-outline" size={16} color={colors.primary} />
          <Text style={{ color: colors.text, fontSize: 12, flex: 1 }} numberOfLines={1}>
            Prêmio: {challenge.prize}
          </Text>
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={{ color: statusInfo.color, fontSize: 12, fontWeight: '700' }}>
          ● {statusInfo.label} ({challenge.members_count}{' '}
          {challenge.members_count === 2 ? 'em dupla' : 'membros'})
        </Text>
        <Text
          style={{
            color: challenge.checked_in_today ? colors.success : colors.primary,
            fontSize: 12,
            fontWeight: '800',
          }}
        >
          {challenge.checked_in_today
            ? `✓ Hoje pago (${challenge.my_points} pts)`
            : `${challenge.my_points} pts · Fazer check-in →`}
        </Text>
      </View>
    </Pressable>
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
  hero: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: '#ffffffdd', fontSize: 13, marginTop: 2 },
  heroButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  joinBtn: { borderColor: '#ffffffaa' },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.sm },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  flamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  flameText: { color: '#FF5722', fontWeight: '800', fontSize: 13 },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
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
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginTop: spacing.md, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  topGap: { marginTop: spacing.sm + 2 },
  dateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm + 2 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});
