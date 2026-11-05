import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { radius } from '../../theme/layout';
import { formatMl } from '../../utils/format';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const STROKE_WIDTH = 18;
const ANIMATION_MS = 900;

interface ProgressRingProps {
  progress: number;
  consumedMl: number;
  goalMl: number;
  size?: number;
}

export function ProgressRing({ progress, consumedMl, goalMl, size = 236 }: ProgressRingProps) {
  const { colors } = useAppTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const ringRadius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const goalReached = progress >= 1;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: Math.min(progress, 1),
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const rawPercent = goalMl > 0 ? Math.round((consumedMl / goalMl) * 100) : 0;

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityLabel={`${rawPercent}% da meta`}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={goalReached ? '#4CC790' : colors.accent} />
            <Stop offset="1" stopColor={goalReached ? colors.success : colors.primary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke={colors.surfaceAlt}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke="url(#ringGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.center}>
        {goalReached ? (
          <View style={[styles.badge, { backgroundColor: `${colors.success}22` }]}>
            <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>Meta batida!</Text>
          </View>
        ) : null}
        <Text
          style={[
            styles.percent,
            { color: goalReached ? colors.success : colors.navy },
          ]}
        >
          {rawPercent}%
        </Text>
        <Text style={[styles.amount, { color: colors.text }]}>{formatMl(consumedMl)}</Text>
        <Text style={[styles.goal, { color: colors.muted }]}>de {formatMl(goalMl)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  percent: { fontSize: 42, fontWeight: '800', lineHeight: 48 },
  amount: { fontSize: 17, fontWeight: '700' },
  goal: { fontSize: 13 },
});
