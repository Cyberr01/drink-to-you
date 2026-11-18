import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Portal, Snackbar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChallengeCard } from '../../components/challenges/ChallengeCard';
import { CreateChallengeModal } from '../../components/challenges/CreateChallengeModal';
import { JoinChallengeDialog } from '../../components/challenges/JoinChallengeDialog';
import { StateMessage } from '../../components/common/StateMessage';
import { useAppTheme } from '../../hooks/useAppTheme';
import { RootStackParamList } from '../../navigation/types';
import { challengeService } from '../../services/challengeService';
import { radius, spacing } from '../../theme/layout';
import { ChallengeSummary } from '../../types';
import { getErrorMessage } from '../../utils/errors';

const HERO_GRADIENT = ['#102B46', '#176B9B', '#20B9CF'] as const;

export function ChallengesScreen() {
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [joinVisible, setJoinVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setChallenges(await challengeService.list());
      setError(null);
    } catch (caught) {
      setError(getErrorMessage(caught));
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

  async function handleJoined(joined: ChallengeSummary) {
    setJoinVisible(false);
    await load();
    navigation.navigate('ChallengeDetails', { challengeId: joined.id });
  }

  async function handleCreated(created: ChallengeSummary) {
    setCreateVisible(false);
    setSnackbar(`Sala criada! Código: ${created.code} 🎉`);
    await load();
    navigation.navigate('ChallengeDetails', { challengeId: created.id });
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
        <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
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
                onPress={() => navigation.navigate('ChallengeDetails', { challengeId: challenge.id })}
              />
            ))}
          </>
        )}
      </ScrollView>

      <Portal>
        <JoinChallengeDialog
          visible={joinVisible}
          onDismiss={() => setJoinVisible(false)}
          onJoined={handleJoined}
        />
        <CreateChallengeModal
          visible={createVisible}
          onDismiss={() => setCreateVisible(false)}
          onCreated={handleCreated}
        />
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar}
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
  hero: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroSub: { color: '#ffffffdd', fontSize: 13, marginTop: 2 },
  heroButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  joinBtn: { borderColor: '#ffffffaa' },
  section: { fontSize: 17, fontWeight: '800', marginTop: spacing.sm, marginBottom: spacing.sm },
});
