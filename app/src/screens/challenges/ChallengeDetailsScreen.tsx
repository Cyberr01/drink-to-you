import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Snackbar,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { RootStackParamList } from '../../navigation/types';
import { challengeService } from '../../services/challengeService';
import { feedback } from '../../services/feedback';
import { pickCheckinPhoto } from '../../services/photoService';
import { radius, spacing } from '../../theme/layout';
import {
  ChallengeCheckinItem,
  ChallengeDetailsResponse,
  ChallengeRankingItem,
} from '../../types';
import { formatMl, formatTime } from '../../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetails'>;

export function ChallengeDetailsScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const { colors } = useAppTheme();
  const { user } = useAuth();

  const [data, setData] = useState<ChallengeDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'ranking' | 'feed'>('ranking');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await challengeService.details(challengeId));
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefresh() {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }

  async function handlePickPhoto(source: 'camera' | 'gallery') {
    setCheckinError(null);
    try {
      const picked = await pickCheckinPhoto(source);
      if (picked) setPhotoPreview(picked);
    } catch (caught) {
      setCheckinError(caught instanceof Error ? caught.message : 'Erro ao selecionar foto.');
    }
  }

  async function handleSubmitCheckin() {
    if (!photoPreview) {
      setCheckinError('Tire ou escolha uma foto do seu copo/garrafa para comprovar.');
      return;
    }
    setIsSubmitting(true);
    setCheckinError(null);
    try {
      await challengeService.createCheckin(challengeId, photoPreview, caption.trim());
      feedback.success();
      setPhotoPreview(null);
      setCaption('');
      setSnackbar('Check-in validado! +1 ponto no ranking 🏆');
      await load();
      setActiveTab('feed');
    } catch (caught) {
      feedback.warning();
      setCheckinError(caught instanceof Error ? caught.message : 'Erro no check-in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleShareCode() {
    if (!data) return;
    const message = `Entre no nosso desafio "${data.challenge.name}" no Drink To You! Código: ${data.challenge.code} — https://drink-to-you-api.onrender.com`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(data.challenge.code);
      setSnackbar(`Código ${data.challenge.code} copiado! 📋`);
      return;
    }
    await Share.share({ message });
  }

  async function handleToggleReaction(checkinId: number) {
    try {
      feedback.tap();
      await challengeService.toggleReaction(challengeId, checkinId);
      await load();
    } catch {
      // Ignora falha silenciosa de reação
    }
  }

  function confirmLeave() {
    const proceed = async () => {
      try {
        await challengeService.leave(challengeId);
        navigation.goBack();
      } catch (caught) {
        setSnackbar(caught instanceof Error ? caught.message : 'Erro ao sair.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja realmente sair desta sala de desafio?')) proceed();
      return;
    }
    Alert.alert('Sair do desafio', 'Deseja realmente sair desta sala de desafio?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: proceed },
    ]);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={[styles.safe, styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          icon="alert-circle-outline"
          title="Sala indisponível"
          description={error ?? undefined}
          actionLabel="Voltar"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const { challenge, my_today: myToday, ranking, checkins } = data;
  const isDuo = challenge.members_count === 2;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero com Chama Coletiva */}
          <LinearGradient
            colors={['#102B46', '#176B9B', '#20B9CF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroRow}>
              <View style={styles.flex}>
                <Text style={styles.heroTitle}>{challenge.name}</Text>
                <Text style={styles.heroMeta}>
                  Meta: {formatMl(challenge.daily_goal_ml)}/dia · {challenge.start_date} até{' '}
                  {challenge.end_date}
                </Text>
              </View>
              <Pressable onPress={handleShareCode} style={styles.codePill}>
                <MaterialCommunityIcons name="share-variant" size={14} color="#fff" />
                <Text style={styles.codeText}>{challenge.code}</Text>
              </Pressable>
            </View>

            {challenge.description ? (
              <Text style={styles.heroDesc}>{challenge.description}</Text>
            ) : null}

            <View style={styles.flameBox}>
              <MaterialCommunityIcons name="fire" size={38} color="#FF9800" />
              <View style={styles.flex}>
                <Text style={styles.flameTitle}>
                  {challenge.collective_streak}{' '}
                  {challenge.collective_streak === 1 ? 'dia' : 'dias'} de Chama{' '}
                  {isDuo ? 'da Dupla!' : 'Coletiva!'}
                </Text>
                <Text style={styles.flameSub}>
                  Sobe +1 a cada dia em que todos os {challenge.members_count} participantes batem a
                  meta e fazem check-in!
                </Text>
              </View>
            </View>

            {challenge.prize ? (
              <View style={styles.prizeBanner}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color="#FFD54F" />
                <Text style={styles.prizeText}>
                  Prêmio combinado: {challenge.prize} (acordo entre participantes)
                </Text>
              </View>
            ) : null}
          </LinearGradient>

          {/* Card de Check-in Diário Anti-Burla */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.navy }]}>
              Seu Check-in de Hoje (+1 ponto)
            </Text>

            {myToday.checked_in_today ? (
              <View style={[styles.doneBanner, { backgroundColor: `${colors.success}1A` }]}>
                <MaterialCommunityIcons name="check-decagram" size={26} color={colors.success} />
                <Text style={[styles.doneText, { color: colors.success }]}>
                  Check-in de hoje confirmado! Seu ponto já está no ranking.
                </Text>
              </View>
            ) : (
              <>
                <RequirementRow
                  done={myToday.goal_reached}
                  text={`1. Atingir a meta da sala hoje (${formatMl(myToday.consumed_ml)} / ${formatMl(challenge.daily_goal_ml)})`}
                />
                <RequirementRow
                  done={myToday.enough_entries}
                  text={`2. Registrar ao menos ${myToday.required_entries} consumos separados hoje (${myToday.entries_count}/${myToday.required_entries})`}
                />
                <RequirementRow
                  done={!!photoPreview}
                  text="3. Anexar foto da garrafa ou copo d’água como comprovação"
                />

                {myToday.can_checkin ? (
                  <View style={styles.checkinActions}>
                    <View style={styles.photoBtnRow}>
                      <Button
                        mode="outlined"
                        icon="camera"
                        onPress={() => handlePickPhoto('camera')}
                        style={styles.flex}
                      >
                        Câmera
                      </Button>
                      <Button
                        mode="outlined"
                        icon="image-outline"
                        onPress={() => handlePickPhoto('gallery')}
                        style={styles.flex}
                      >
                        Galeria
                      </Button>
                    </View>

                    {photoPreview ? (
                      <Image source={{ uri: photoPreview }} style={styles.previewImg} />
                    ) : null}

                    <TextInput
                      label="Legenda do check-in (opcional)"
                      placeholder="Ex.: Meta paga antes das 18h! 💧"
                      mode="outlined"
                      value={caption}
                      onChangeText={setCaption}
                      maxLength={160}
                      style={styles.captionInput}
                    />

                    <HelperText type="error" visible={!!checkinError}>
                      {checkinError}
                    </HelperText>

                    <Button
                      mode="contained"
                      icon="check-bold"
                      onPress={handleSubmitCheckin}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Confirmar Check-in (+1 Ponto)
                    </Button>
                  </View>
                ) : (
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: spacing.sm }}>
                    Complete os itens 1 e 2 na aba Início ao longo do dia para liberar o botão da
                    câmera!
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Abas Ranking x Mural */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setActiveTab('ranking')}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'ranking' ? colors.primary : colors.surface,
                  borderColor: activeTab === 'ranking' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'ranking' ? '#fff' : colors.text,
                  fontWeight: '800',
                }}
              >
                🏆 Ranking ({ranking.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('feed')}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === 'feed' ? colors.primary : colors.surface,
                  borderColor: activeTab === 'feed' ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: activeTab === 'feed' ? '#fff' : colors.text,
                  fontWeight: '800',
                }}
              >
                📸 Mural ({checkins.length})
              </Text>
            </Pressable>
          </View>

          {activeTab === 'ranking' ? (
            ranking.map((member) => (
              <RankingRow
                key={member.user_id}
                item={member}
                isMe={member.user_id === user?.id}
              />
            ))
          ) : checkins.length === 0 ? (
            <StateMessage
              icon="camera-outline"
              title="Nenhum check-in no mural ainda"
              description="Seja o primeiro da sala a bater a meta e postar a foto da sua garrafa!"
            />
          ) : (
            checkins.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onReact={() => handleToggleReaction(item.id)}
              />
            ))
          )}

          <Button
            mode="outlined"
            textColor={colors.danger}
            icon="exit-to-app"
            onPress={confirmLeave}
            style={styles.leaveBtn}
          >
            Sair desta sala de desafio
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
      </Snackbar>
    </SafeAreaView>
  );
}

function RequirementRow({ done, text }: { done: boolean; text: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.reqRow}>
      <MaterialCommunityIcons
        name={done ? 'check-circle' : 'checkbox-blank-circle-outline'}
        size={20}
        color={done ? colors.success : colors.muted}
      />
      <Text style={{ color: done ? colors.text : colors.muted, fontSize: 13, flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

function RankingRow({ item, isMe }: { item: ChallengeRankingItem; isMe: boolean }) {
  const { colors } = useAppTheme();
  const medal =
    item.position === 1
      ? '🥇'
      : item.position === 2
        ? '🥈'
        : item.position === 3
          ? '🥉'
          : `${item.position}º`;

  return (
    <View
      style={[
        styles.rankCard,
        {
          backgroundColor: colors.surface,
          borderColor: isMe ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={styles.medal}>{medal}</Text>
      <View style={styles.flex}>
        <Text style={[styles.rankName, { color: colors.navy }]}>
          {item.name} {isMe ? '(Você)' : ''}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          🔥 {item.streak_days}d seguidos · {(item.total_verified_ml / 1000).toFixed(1)}L
          comprovados
        </Text>
      </View>
      <View style={styles.pointsCol}>
        <Text style={[styles.pointsNum, { color: colors.primary }]}>{item.points} pts</Text>
        <Text
          style={{
            fontSize: 11,
            color: item.checked_in_today ? colors.success : colors.muted,
            fontWeight: '700',
          }}
        >
          {item.checked_in_today ? '✓ Hoje' : 'Pendente'}
        </Text>
      </View>
    </View>
  );
}

function FeedCard({
  item,
  onReact,
}: {
  item: ChallengeCheckinItem;
  onReact: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.feedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.feedHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>
            {item.user_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={{ color: colors.navy, fontWeight: '800' }}>{item.user_name}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {item.checkin_date} às {formatTime(item.created_at)} · {formatMl(item.consumed_ml)}
          </Text>
        </View>
        <View style={[styles.pointTag, { backgroundColor: `${colors.success}20` }]}>
          <Text style={{ color: colors.success, fontWeight: '800', fontSize: 12 }}>+1 pt</Text>
        </View>
      </View>

      <Image source={{ uri: item.photo_data }} style={styles.feedImage} resizeMode="cover" />

      {item.caption ? (
        <Text style={[styles.feedCaption, { color: colors.text }]}>{item.caption}</Text>
      ) : null}

      <Pressable
        onPress={onReact}
        style={[
          styles.reactBtn,
          {
            backgroundColor: item.reacted_by_me ? `${colors.accent}24` : colors.surfaceAlt,
          },
        ]}
      >
        <Text
          style={{
            color: item.reacted_by_me ? colors.primary : colors.muted,
            fontWeight: '700',
            fontSize: 13,
          }}
        >
          💧 Incentivar {item.reactions_count > 0 ? `(${item.reactions_count})` : ''}
        </Text>
      </Pressable>
    </View>
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
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heroTitle: { color: '#fff', fontSize: 21, fontWeight: '800' },
  heroMeta: { color: '#ffffffdd', fontSize: 12, marginTop: 2 },
  heroDesc: { color: '#ffffffea', fontSize: 13, marginTop: spacing.sm },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff28',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  codeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  flameBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#00000028',
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  flameTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  flameSub: { color: '#ffffffcc', fontSize: 12 },
  prizeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  prizeText: { color: '#FFE082', fontSize: 12, fontWeight: '700', flex: 1 },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: spacing.sm },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  doneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  doneText: { fontWeight: '700', flex: 1, fontSize: 13 },
  checkinActions: { marginTop: spacing.md },
  photoBtnRow: { flexDirection: 'row', gap: spacing.sm },
  previewImg: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  captionInput: { marginTop: spacing.sm },
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  medal: { fontSize: 22, width: 34, textAlign: 'center', fontWeight: '800' },
  rankName: { fontSize: 15, fontWeight: '800' },
  pointsCol: { alignItems: 'flex-end' },
  pointsNum: { fontSize: 17, fontWeight: '800' },
  feedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  feedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  feedImage: {
    width: '100%',
    height: 240,
    borderRadius: radius.md,
    backgroundColor: '#102B46',
  },
  feedCaption: { marginTop: spacing.sm, fontSize: 14 },
  reactBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  leaveBtn: { marginTop: spacing.lg },
});
