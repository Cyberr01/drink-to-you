import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius, spacing } from '../../theme/layout';
import { ChallengeCheckinItem } from '../../types';
import { formatMl, formatTime } from '../../utils/format';

interface FeedCardProps {
  item: ChallengeCheckinItem;
  onReact: () => void;
}

/** Publicação do mural: autor, foto do check-in, legenda e botão “Incentivar”. */
export function FeedCard({ item, onReact }: FeedCardProps) {
  const { colors } = useAppTheme();
  const reactionCount = item.reactions_count > 0 ? `(${item.reactions_count})` : '';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}>
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>
            {item.user_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.author, { color: colors.navy }]}>{item.user_name}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>
            {item.checkin_date} às {formatTime(item.created_at)} · {formatMl(item.consumed_ml)}
          </Text>
        </View>
        <View style={[styles.pointTag, { backgroundColor: `${colors.success}20` }]}>
          <Text style={[styles.pointText, { color: colors.success }]}>+1 pt</Text>
        </View>
      </View>

      <Image source={{ uri: item.photo_data }} style={styles.photo} resizeMode="cover" />

      {item.caption ? <Text style={[styles.caption, { color: colors.text }]}>{item.caption}</Text> : null}

      <Pressable
        onPress={onReact}
        style={[
          styles.reactButton,
          { backgroundColor: item.reacted_by_me ? `${colors.accent}24` : colors.surfaceAlt },
        ]}
      >
        <Text style={[styles.reactText, { color: item.reacted_by_me ? colors.primary : colors.muted }]}>
          💧 Incentivar {reactionCount}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontWeight: '800' },
  author: { fontWeight: '800' },
  meta: { fontSize: 12 },
  pointTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  pointText: { fontWeight: '800', fontSize: 12 },
  photo: { width: '100%', height: 240, borderRadius: radius.md, backgroundColor: '#102B46' },
  caption: { marginTop: spacing.sm, fontSize: 14 },
  reactButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  reactText: { fontWeight: '700', fontSize: 13 },
});
