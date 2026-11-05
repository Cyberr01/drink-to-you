import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';

export function IosInstallBanner() {
  const { colors } = useAppTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const ua = window.navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const isStandalone =
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) ||
      window.matchMedia?.('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
      <MaterialCommunityIcons name="apple-ios" size={24} color={colors.primary} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.navy }]}>Instale no seu iPhone</Text>
        <Text style={{ color: colors.text, fontSize: 12 }}>
          Toque em <Text style={styles.bold}>Compartilhar</Text> no Safari e depois em{' '}
          <Text style={styles.bold}>“Adicionar à Tela de Início”</Text> para usar em tela cheia e receber alertas.
        </Text>
      </View>
      <Pressable onPress={() => setVisible(false)} hitSlop={8}>
        <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  bold: { fontWeight: '700' },
});
