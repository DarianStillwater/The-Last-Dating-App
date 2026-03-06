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
} from 'react-native-reanimated';
import { PLANT_COLORS } from '../theme';

interface PlantCompanionProps {
  growthStage: number; // 0-5
  animate?: boolean;
}

const WATER_COLOR = '#87CEEB';

const PlantCompanion: React.FC<PlantCompanionProps> = ({
  growthStage,
  animate = true,
}) => {
  const soilHeight = useSharedValue(0);
  const seed1Scale = useSharedValue(0);
  const seed2Scale = useSharedValue(0);
  const seed3Scale = useSharedValue(0);
  const drop1TranslateY = useSharedValue(-20);
  const drop1Opacity = useSharedValue(0);
  const drop2TranslateY = useSharedValue(-20);
  const drop2Opacity = useSharedValue(0);
  const drop3TranslateY = useSharedValue(-20);
  const drop3Opacity = useSharedValue(0);
  const sproutScale = useSharedValue(0);
  const sproutRotation = useSharedValue(0);
  const wiggleRotation = useSharedValue(0);

  useEffect(() => {
    // Stage 2+: Soil fills the planter box from bottom
    const soilTarget = growthStage >= 2 ? 20 : 0;
    soilHeight.value = animate
      ? withSpring(soilTarget, { damping: 14, stiffness: 80 })
      : soilTarget;

    // Stage 3+: Seeds appear on soil surface
    const seedTarget = growthStage >= 3 ? 1 : 0;
    seed1Scale.value = animate
      ? withDelay(150, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;
    seed2Scale.value = animate
      ? withDelay(250, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;
    seed3Scale.value = animate
      ? withDelay(350, withSpring(seedTarget, { damping: 8, stiffness: 120 }))
      : seedTarget;

    // Stage 4+: Water drops fall from above
    const dropShow = growthStage >= 4 ? 1 : 0;
    if (animate && growthStage >= 4) {
      // Drop 1
      drop1Opacity.value = withDelay(
        100,
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 200 })
        )
      );
      drop1TranslateY.value = withDelay(
        100,
        withTiming(18, { duration: 700 })
      );
      // Drop 2
      drop2Opacity.value = withDelay(
        300,
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 200 })
        )
      );
      drop2TranslateY.value = withDelay(
        300,
        withTiming(18, { duration: 700 })
      );
      // Drop 3
      drop3Opacity.value = withDelay(
        500,
        withSequence(
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 400 }),
          withTiming(0, { duration: 200 })
        )
      );
      drop3TranslateY.value = withDelay(
        500,
        withTiming(18, { duration: 700 })
      );
    } else {
      drop1Opacity.value = 0;
      drop2Opacity.value = 0;
      drop3Opacity.value = 0;
      drop1TranslateY.value = -20;
      drop2TranslateY.value = -20;
      drop3TranslateY.value = -20;
    }

    // Stage 5: Sprout peeks from soil
    const sproutTarget = growthStage >= 5 ? 1 : 0;
    sproutScale.value = animate
      ? withDelay(400, withSpring(sproutTarget, { damping: 6, stiffness: 150 }))
      : sproutTarget;

    if (animate && growthStage >= 5) {
      sproutRotation.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(-8, { duration: 120 }),
            withTiming(8, { duration: 120 }),
            withTiming(0, { duration: 120 })
          ),
          2,
          true
        )
      );
    } else {
      sproutRotation.value = 0;
    }

    // Wiggle celebration on stage change
    if (animate && growthStage > 0) {
      wiggleRotation.value = withDelay(
        100,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 80 }),
            withTiming(5, { duration: 80 }),
            withTiming(0, { duration: 80 })
          ),
          3,
          true
        )
      );
    }
  }, [growthStage, animate]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggleRotation.value}deg` }],
  }));

  const soilStyle = useAnimatedStyle(() => ({
    height: soilHeight.value,
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
      {/* Water drops falling from above (stage 4) */}
      <View style={styles.dropsArea}>
        <Animated.View style={[styles.waterDrop, styles.drop1, drop1Style]} />
        <Animated.View style={[styles.waterDrop, styles.drop2, drop2Style]} />
        <Animated.View style={[styles.waterDrop, styles.drop3, drop3Style]} />
      </View>

      {/* Planter box */}
      <View style={styles.planterWrapper}>
        {/* Rim (wider, darker top edge) */}
        <View style={styles.planterRim} />

        {/* Box body */}
        <View style={styles.planterBody}>
          {/* Soil filling from bottom */}
          <Animated.View style={[styles.soil, soilStyle]}>
            {/* Seeds on soil surface (stage 3) */}
            <View style={styles.seedRow}>
              <Animated.View style={[styles.seed, seed1Style]} />
              <Animated.View style={[styles.seed, seed2Style]} />
              <Animated.View style={[styles.seed, seed3Style]} />
            </View>

            {/* Sprout peeking from center (stage 5) */}
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
  drop1: {
    left: 8,
    top: 4,
  },
  drop2: {
    left: 18,
    top: 0,
  },
  drop3: {
    left: 28,
    top: 6,
  },
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
    backgroundColor: '#A1887F',
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
