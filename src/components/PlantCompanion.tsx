import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
  SharedValue,
} from 'react-native-reanimated';
import { PLANT_COLORS } from '../theme';

interface PlantCompanionProps {
  growthStage: number; // 1-6
  animate?: boolean;
}

const WATER_COLOR = '#87CEEB';
const FERTILIZER_COLOR = '#FFB74D';

const PlantCompanion: React.FC<PlantCompanionProps> = ({
  growthStage,
  animate = true,
}) => {
  // Stage 1: Pot appears (wiggle)
  const potScale = useSharedValue(0);

  // Stage 2: Soil rises
  const soilHeight = useSharedValue(0);

  // Stage 3: Fertilizer particles fall
  const fert1Opacity = useSharedValue(0);
  const fert1TranslateY = useSharedValue(-16);
  const fert2Opacity = useSharedValue(0);
  const fert2TranslateY = useSharedValue(-16);
  const fert3Opacity = useSharedValue(0);
  const fert3TranslateY = useSharedValue(-16);
  const fert4Opacity = useSharedValue(0);
  const fert4TranslateY = useSharedValue(-16);
  // Soil darkens after fertilizer (persistent)
  const soilDarken = useSharedValue(0);

  // Stage 4: Seeds appear
  const seed1Scale = useSharedValue(0);
  const seed2Scale = useSharedValue(0);
  const seed3Scale = useSharedValue(0);

  // Stage 5: Water drops fall
  const drop1TranslateY = useSharedValue(-20);
  const drop1Opacity = useSharedValue(0);
  const drop2TranslateY = useSharedValue(-20);
  const drop2Opacity = useSharedValue(0);
  const drop3TranslateY = useSharedValue(-20);
  const drop3Opacity = useSharedValue(0);

  // Stage 6: Sprout emerges
  const sproutScale = useSharedValue(0);
  const sproutRotation = useSharedValue(0);

  // Celebration wiggle on any step change
  const wiggleRotation = useSharedValue(0);

  useEffect(() => {
    // Stage 1+: Pot pops in
    const potTarget = growthStage >= 1 ? 1 : 0;
    potScale.value = animate
      ? withSpring(potTarget, { damping: 8, stiffness: 120 })
      : potTarget;

    // Stage 2+: Soil fills the planter box
    const soilTarget = growthStage >= 2 ? 20 : 0;
    soilHeight.value = animate
      ? withSpring(soilTarget, { damping: 14, stiffness: 80 })
      : soilTarget;

    // Stage 3: Fertilizer particles sprinkle down then soil darkens
    if (animate && growthStage >= 3) {
      const makeFertAnim = (delay: number, opacity: SharedValue<number>, translateY: SharedValue<number>) => {
        opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(1, { duration: 80 }),
            withTiming(1, { duration: 300 }),
            withTiming(0, { duration: 200 }),
          ),
        );
        translateY.value = withDelay(delay, withTiming(14, { duration: 580 }));
      };
      makeFertAnim(100, fert1Opacity, fert1TranslateY);
      makeFertAnim(200, fert2Opacity, fert2TranslateY);
      makeFertAnim(320, fert3Opacity, fert3TranslateY);
      makeFertAnim(420, fert4Opacity, fert4TranslateY);
      // Darken soil after particles land
      soilDarken.value = withDelay(700, withTiming(1, { duration: 400 }));
    } else if (growthStage < 3) {
      fert1Opacity.value = 0;
      fert2Opacity.value = 0;
      fert3Opacity.value = 0;
      fert4Opacity.value = 0;
      fert1TranslateY.value = -16;
      fert2TranslateY.value = -16;
      fert3TranslateY.value = -16;
      fert4TranslateY.value = -16;
      soilDarken.value = 0;
    } else {
      // Already past stage 3, just show darkened soil
      soilDarken.value = 1;
    }

    // Stage 4+: Seeds appear on soil
    const seedTarget = growthStage >= 4 ? 1 : 0;
    seed1Scale.value = animate
      ? withDelay(150, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;
    seed2Scale.value = animate
      ? withDelay(250, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;
    seed3Scale.value = animate
      ? withDelay(350, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;

    // Stage 5: Water drops
    if (animate && growthStage >= 5) {
      const makeDropAnim = (delay: number, opacity: SharedValue<number>, translateY: SharedValue<number>) => {
        opacity.value = withDelay(
          delay,
          withSequence(
            withTiming(1, { duration: 100 }),
            withTiming(1, { duration: 400 }),
            withTiming(0, { duration: 200 }),
          ),
        );
        translateY.value = withDelay(delay, withTiming(18, { duration: 700 }));
      };
      makeDropAnim(100, drop1Opacity, drop1TranslateY);
      makeDropAnim(300, drop2Opacity, drop2TranslateY);
      makeDropAnim(500, drop3Opacity, drop3TranslateY);
    } else if (growthStage < 5) {
      drop1Opacity.value = 0;
      drop2Opacity.value = 0;
      drop3Opacity.value = 0;
      drop1TranslateY.value = -20;
      drop2TranslateY.value = -20;
      drop3TranslateY.value = -20;
    }

    // Stage 6: Sprout emerges
    const sproutTarget = growthStage >= 6 ? 1 : 0;
    sproutScale.value = animate
      ? withDelay(400, withSpring(sproutTarget, { damping: 6, stiffness: 150 }))
      : sproutTarget;

    if (animate && growthStage >= 6) {
      sproutRotation.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 120 }),
            withTiming(8, { duration: 120 }),
            withTiming(0, { duration: 120 }),
          ),
          2,
          true,
        ),
      );
    } else {
      sproutRotation.value = 0;
    }

    // Wiggle celebration on step change
    if (animate && growthStage > 0) {
      wiggleRotation.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 80 }),
            withTiming(5, { duration: 80 }),
            withTiming(0, { duration: 80 }),
          ),
          3,
          true,
        ),
      );
    }
  }, [growthStage, animate]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: potScale.value },
      { rotate: `${wiggleRotation.value}deg` },
    ],
  }));

  const soilStyle = useAnimatedStyle(() => ({
    height: soilHeight.value,
    backgroundColor: soilDarken.value > 0
      ? `rgba(${Math.round(161 - 40 * soilDarken.value)}, ${Math.round(136 - 30 * soilDarken.value)}, ${Math.round(127 - 20 * soilDarken.value)}, 1)`
      : '#A1887F',
  }));

  const seed1Style = useAnimatedStyle(() => ({
    transform: [{ scale: seed1Scale.value }],
  }));
  const seed2Style = useAnimatedStyle(() => ({
    transform: [{ scale: seed2Scale.value }],
  }));
  const seed3Style = useAnimatedStyle(() => ({
    transform: [{ scale: seed3Scale.value }],
  }));

  const fert1Style = useAnimatedStyle(() => ({
    opacity: fert1Opacity.value,
    transform: [{ translateY: fert1TranslateY.value }],
  }));
  const fert2Style = useAnimatedStyle(() => ({
    opacity: fert2Opacity.value,
    transform: [{ translateY: fert2TranslateY.value }],
  }));
  const fert3Style = useAnimatedStyle(() => ({
    opacity: fert3Opacity.value,
    transform: [{ translateY: fert3TranslateY.value }],
  }));
  const fert4Style = useAnimatedStyle(() => ({
    opacity: fert4Opacity.value,
    transform: [{ translateY: fert4TranslateY.value }],
  }));

  const drop1Style = useAnimatedStyle(() => ({
    opacity: drop1Opacity.value,
    transform: [{ translateY: drop1TranslateY.value }],
  }));
  const drop2Style = useAnimatedStyle(() => ({
    opacity: drop2Opacity.value,
    transform: [{ translateY: drop2TranslateY.value }],
  }));
  const drop3Style = useAnimatedStyle(() => ({
    opacity: drop3Opacity.value,
    transform: [{ translateY: drop3TranslateY.value }],
  }));

  const sproutStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sproutScale.value },
      { rotate: `${sproutRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Fertilizer particles falling (stage 3) */}
      <View style={styles.particlesArea}>
        <Animated.View style={[styles.fertParticle, styles.fert1, fert1Style]} />
        <Animated.View style={[styles.fertParticle, styles.fert2, fert2Style]} />
        <Animated.View style={[styles.fertParticle, styles.fert3, fert3Style]} />
        <Animated.View style={[styles.fertParticle, styles.fert4, fert4Style]} />
      </View>

      {/* Water drops falling (stage 5) */}
      <View style={styles.dropsArea}>
        <Animated.View style={[styles.waterDrop, styles.drop1, drop1Style]} />
        <Animated.View style={[styles.waterDrop, styles.drop2, drop2Style]} />
        <Animated.View style={[styles.waterDrop, styles.drop3, drop3Style]} />
      </View>

      {/* Planter box */}
      <View style={styles.planterWrapper}>
        <View style={styles.planterRim} />
        <View style={styles.planterBody}>
          {/* Soil filling from bottom (stage 2+) */}
          <Animated.View style={[styles.soil, soilStyle]}>
            {/* Seeds on soil surface (stage 4+) */}
            <View style={styles.seedRow}>
              <Animated.View style={[styles.seed, seed1Style]} />
              <Animated.View style={[styles.seed, seed2Style]} />
              <Animated.View style={[styles.seed, seed3Style]} />
            </View>

            {/* Sprout peeking from center (stage 6) */}
            <Animated.View style={[styles.sproutContainer, sproutStyle]}>
              <View style={styles.sproutStem} />
              <View style={styles.sproutLeaf} />
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  particlesArea: {
    position: 'absolute',
    top: 4,
    width: 40,
    height: 36,
    alignItems: 'center',
  },
  fertParticle: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: FERTILIZER_COLOR,
  },
  fert1: { left: 6, top: 2 },
  fert2: { left: 16, top: 0 },
  fert3: { left: 26, top: 4 },
  fert4: { left: 12, top: 6 },
  dropsArea: {
    position: 'absolute',
    top: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
  },
  waterDrop: {
    position: 'absolute',
    width: 6,
    height: 9,
    borderRadius: 3,
    backgroundColor: WATER_COLOR,
  },
  drop1: { left: 8, top: 4 },
  drop2: { left: 18, top: 0 },
  drop3: { left: 28, top: 6 },
  planterWrapper: {
    alignItems: 'center',
  },
  planterRim: {
    width: 44,
    height: 6,
    backgroundColor: '#5D4037',
    borderRadius: 2,
  },
  planterBody: {
    width: 40,
    height: 28,
    backgroundColor: '#8D6E63',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  soil: {
    width: '100%',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  seedRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingTop: 2,
  },
  seed: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4E342E',
  },
  sproutContainer: {
    position: 'absolute',
    top: -10,
    alignItems: 'center',
  },
  sproutStem: {
    width: 2,
    height: 8,
    backgroundColor: PLANT_COLORS.primaryDark,
    borderRadius: 1,
  },
  sproutLeaf: {
    position: 'absolute',
    top: 0,
    left: 1,
    width: 6,
    height: 4,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 2,
  },
});

export default PlantCompanion;
