import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
} from 'react-native';
import { ActivityIndicator, Button, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChallengeHero } from '../../components/challenges/ChallengeHero';
import { CheckinCard } from '../../components/challenges/CheckinCard';
import { FeedCard } from '../../components/challenges/FeedCard';
import { RankingRow } from '../../components/challenges/RankingRow';
import { SegmentedTabs, TabOption } from '../../components/common/SegmentedTabs';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useAuth } from '../../hooks/useAuth';
import { useChallengeDetails } from '../../hooks/useChallengeDetails';
import { RootStackParamList } from '../../navigation/types';
import { challengeService } from '../../services/challengeService';
import { feedback } from '../../services/feedback';
import { PhotoSource, pickCheckinPhoto } from '../../services/photoService';
import { spacing } from '../../theme/layout';
import { getErrorMessage } from '../../utils/errors';

type Props = NativeStackScreenProps<RootStackParamList, 'ChallengeDetails'>;
type DetailsTab = 'ranking' | 'feed';

export function ChallengeDetailsScreen({ route, navigation }: Props) {
  const { challengeId } = route.params;
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { data, isLoading, isRefreshing, error, reload, refresh } = useChallengeDetails(challengeId);

  const [activeTab, setActiveTab] = useState<DetailsTab>('ranking');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function handlePickPhoto(source: PhotoSource) {
    setCheckinError(null);
    try {
      const picked = await pickCheckinPhoto(source);
      if (picked) setPhotoPreview(picked);
    } catch (caught) {
      setCheckinError(getErrorMessage(caught, 'Erro ao selecionar foto.'));
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
      await reload();
      setActiveTab('feed');
    } catch (caught) {
      feedback.warning();
      setCheckinError(getErrorMessage(caught, 'Erro no check-in.'));
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
      await reload();
    } catch {
      // Falha silenciosa em reação rápida
    }
  }

  function confirmLeave() {
    const proceed = async () => {
      try {
        await challengeService.leave(challengeId);
        navigation.goBack();
      } catch (caught) {
        setSnackbar(getErrorMessage(caught, 'Erro ao sair.'));
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
  const tabOptions: TabOption<DetailsTab>[] = [
    { value: 'ranking', label: `🏆 Ranking (${ranking.length})` },
    { value: 'feed', label: `📸 Mural (${checkins.length})` },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          keyboardShouldPersistTaps="handled"
        >
          <ChallengeHero challenge={challenge} onShareCode={handleShareCode} />

          <CheckinCard
            status={myToday}
            dailyGoalMl={challenge.daily_goal_ml}
            photoPreview={photoPreview}
            caption={caption}
            error={checkinError}
            isSubmitting={isSubmitting}
            onChangeCaption={setCaption}
            onPickPhoto={handlePickPhoto}
            onSubmit={handleSubmitCheckin}
          />

          <SegmentedTabs options={tabOptions} selected={activeTab} onSelect={setActiveTab} />

          {activeTab === 'ranking' ? (
            ranking.map((member) => (
              <RankingRow key={member.user_id} item={member} isMe={member.user_id === user?.id} />
            ))
          ) : checkins.length === 0 ? (
            <StateMessage
              icon="camera-outline"
              title="Nenhum check-in no mural ainda"
              description="Seja o primeiro da sala a bater a meta e postar a foto da sua garrafa!"
            />
          ) : (
            checkins.map((item) => (
              <FeedCard key={item.id} item={item} onReact={() => handleToggleReaction(item.id)} />
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  leaveBtn: { marginTop: spacing.lg },
});
