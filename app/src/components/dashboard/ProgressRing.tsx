import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../hooks/useAppTheme';
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

export function ProgressRing({ progress, consumedMl, goalMl, size = 230 }: ProgressRingProps) {
  const { colors } = useAppTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }} accessibilityLabel={`${Math.round(progress * 100)}% da meta`}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.accent} />
            <Stop offset="1" stopColor={colors.primary} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
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
        <Text style={[styles.percent, { color: colors.navy }]}>{Math.round(progress * 100)}%</Text>
        <Text style={[styles.amount, { color: colors.text }]}>{formatMl(consumedMl)}</Text>
        <Text style={[styles.goal, { color: colors.muted }]}>de {formatMl(goalMl)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 44, fontWeight: '800', lineHeight: 52 },
  amount: { fontSize: 18, fontWeight: '700' },
  goal: { fontSize: 14 },
});
