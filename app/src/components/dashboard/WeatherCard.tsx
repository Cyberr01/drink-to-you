import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { Weather } from '../../services/weatherService';
import { radius, spacing } from '../../theme/layout';

const HOT_TEMPERATURE_C = 30;

interface WeatherCardProps {
  weather: Weather | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function WeatherCard({ weather, isLoading, error, onRetry }: WeatherCardProps) {
  const { colors } = useAppTheme();
  const cardStyle = [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }];

  if (isLoading) {
    return (
      <View style={[cardStyle, styles.centered]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.muted, marginLeft: spacing.sm }}>Buscando o clima…</Text>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={[cardStyle, styles.centered]}>
        <MaterialCommunityIcons name="cloud-off-outline" size={22} color={colors.muted} />
        <Text style={{ color: colors.muted, marginLeft: spacing.sm, flex: 1 }}>
          {error ?? 'Clima indisponível.'}
        </Text>
        <Text style={{ color: colors.primary, fontWeight: '700' }} onPress={onRetry}>
          Tentar de novo
        </Text>
      </View>
    );
  }

  const isHot = weather.temperature >= HOT_TEMPERATURE_C;

  return (
    <View style={cardStyle}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name={weather.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={44}
          color={colors.accent}
        />
        <View style={styles.info}>
          <Text style={[styles.temperature, { color: colors.navy }]}>{weather.temperature}°C</Text>
          <Text style={{ color: colors.muted }}>
            {weather.description} · {weather.city}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Sensação {weather.feelsLike}°</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Umidade {weather.humidity}%</Text>
        </View>
      </View>
      <Text style={[styles.tip, { color: colors.text, backgroundColor: colors.surfaceAlt }]}>
        {isHot
          ? '☀️ Dia quente: lembre-se de se hidratar com frequência.'
          : '💧 Mantenha a hidratação ao longo do dia.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  centered: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.md },
  temperature: { fontSize: 28, fontWeight: '800' },
  details: { alignItems: 'flex-end' },
  tip: {
    marginTop: spacing.md,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    fontSize: 13,
  },
});
