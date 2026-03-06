import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  ReduceMotion,
  ReducedMotionConfig,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Ellipse,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { PLANT_COLORS } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const SOIL_Y = SCREEN_HEIGHT * 0.55;

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  // Seed drop
  const seedTranslateY = useSharedValue(-40);
  const seedOpacity = useSharedValue(1);

  // Stem grow (clip height)
  const stemClipHeight = useSharedValue(0);

  // Leaves
  const leftLeafScale = useSharedValue(0);
  const leftLeafRotate = useSharedValue(30);
  const rightLeafScale = useSharedValue(0);
  const rightLeafRotate = useSharedValue(-30);

  // Flower petals (5 individual scales)
  const petal0Scale = useSharedValue(0);
  const petal1Scale = useSharedValue(0);
  const petal2Scale = useSharedValue(0);
  const petal3Scale = useSharedValue(0);
  const petal4Scale = useSharedValue(0);
  const flowerCenterScale = useSharedValue(0);

  // Sparkles (5)
  const sparkle0Scale = useSharedValue(0);
  const sparkle0Opacity = useSharedValue(0);
  const sparkle1Scale = useSharedValue(0);
  const sparkle1Opacity = useSharedValue(0);
  const sparkle2Scale = useSharedValue(0);
  const sparkle2Opacity = useSharedValue(0);
  const sparkle3Scale = useSharedValue(0);
  const sparkle3Opacity = useSharedValue(0);
  const sparkle4Scale = useSharedValue(0);
  const sparkle4Opacity = useSharedValue(0);

  // Title + scene
  const titleOpacity = useSharedValue(0);
  const sceneOpacity = useSharedValue(1);

  useEffect(() => {
    onReady?.();

    // 0.0-0.4s: Seed drops into soil
    seedTranslateY.value = withDelay(
      0,
      withSpring(0, { damping: 14, stiffness: 120 })
    );
    seedOpacity.value = withDelay(400, withTiming(0, { duration: 100 }));

    // 0.5-1.0s: Stem grows upward
    stemClipHeight.value = withDelay(
      500,
      withTiming(120, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // 1.0-1.5s: Leaves unfurl
    leftLeafScale.value = withDelay(1000, withSpring(1, { damping: 10, stiffness: 100 }));
    leftLeafRotate.value = withDelay(1000, withSpring(0, { damping: 8, stiffness: 80 }));
    rightLeafScale.value = withDelay(1100, withSpring(1, { damping: 10, stiffness: 100 }));
    rightLeafRotate.value = withDelay(1100, withSpring(0, { damping: 8, stiffness: 80 }));

    // 1.5-2.2s: Flower petals bloom (staggered 100ms each)
    const petalScales = [petal0Scale, petal1Scale, petal2Scale, petal3Scale, petal4Scale];
    petalScales.forEach((petal, i) => {
      petal.value = withDelay(
        1500 + i * 100,
        withSpring(1, { damping: 8, stiffness: 120 })
      );
    });
    // Yellow center last
    flowerCenterScale.value = withDelay(
      2000,
      withSpring(1, { damping: 10, stiffness: 100 })
    );

    // 2.2-2.5s: Sparkles pop
    const sparkleScales = [sparkle0Scale, sparkle1Scale, sparkle2Scale, sparkle3Scale, sparkle4Scale];
    const sparkleOpacities = [sparkle0Opacity, sparkle1Opacity, sparkle2Opacity, sparkle3Opacity, sparkle4Opacity];
    sparkleScales.forEach((s, i) => {
      s.value = withDelay(
        2200 + i * 60,
        withSpring(1, { damping: 6, stiffness: 150 })
      );
      sparkleOpacities[i].value = withDelay(
        2200 + i * 60,
        withTiming(1, { duration: 100 })
      );
      // Fade sparkles out
      sparkleOpacities[i].value = withDelay(
        2400 + i * 60,
        withTiming(0, { duration: 200 })
      );
    });

    // 2.5s: Title fades in
    titleOpacity.value = withDelay(2500, withTiming(1, { duration: 300 }));

    // 3.5s: Scene fades out
    sceneOpacity.value = withDelay(
      3500,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // 3.9s: onComplete fires
    const timer = setTimeout(() => {
      onComplete();
    }, 3900);

    return () => clearTimeout(timer);
  }, []);

  // --- Animated styles ---

  const containerStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
  }));

  const seedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: seedTranslateY.value }],
    opacity: seedOpacity.value,
  }));

  const stemClipStyle = useAnimatedStyle(() => ({
    height: stemClipHeight.value,
  }));

  const leftLeafStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: leftLeafScale.value },
      { rotate: `${leftLeafRotate.value}deg` },
    ],
  }));

  const rightLeafStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: rightLeafScale.value },
      { rotate: `${rightLeafRotate.value}deg` },
    ],
  }));

  const petalStyles = [
    useAnimatedStyle(() => ({ transform: [{ scale: petal0Scale.value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: petal1Scale.value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: petal2Scale.value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: petal3Scale.value }] })),
    useAnimatedStyle(() => ({ transform: [{ scale: petal4Scale.value }] })),
  ];

  const flowerCenterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flowerCenterScale.value }],
  }));

  const sparkleStyles = [
    useAnimatedStyle(() => ({
      transform: [{ scale: sparkle0Scale.value }],
      opacity: sparkle0Opacity.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: sparkle1Scale.value }],
      opacity: sparkle1Opacity.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: sparkle2Scale.value }],
      opacity: sparkle2Opacity.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: sparkle3Scale.value }],
      opacity: sparkle3Opacity.value,
    })),
    useAnimatedStyle(() => ({
      transform: [{ scale: sparkle4Scale.value }],
      opacity: sparkle4Opacity.value,
    })),
  ];

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  // Sparkle positions relative to flower center
  const sparklePositions = [
    { top: -18, left: -22 },
    { top: -24, left: 18 },
    { top: 4, left: 28 },
    { top: 18, left: -16 },
    { top: -6, left: -30 },
  ];

  // Petal rotations: 0, 72, 144, 216, 288 degrees
  const petalRotations = [0, 72, 144, 216, 288];

  return (
    <>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Soil mound */}
        <View style={styles.soilContainer}>
          <Svg viewBox="0 0 160 50" width={160} height={50}>
            <Defs>
              <SvgLinearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#6D4C41" />
                <Stop offset="1" stopColor="#4E342E" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M 0,50 Q 10,8 80,5 Q 150,8 160,50 Z"
              fill="url(#soilGrad)"
            />
          </Svg>
        </View>

        {/* Seed - drops from above into soil */}
        <Animated.View style={[styles.seedContainer, seedStyle]}>
          <Svg viewBox="0 0 16 22" width={16} height={22}>
            <Path
              d="M 8,0 C 3,0 0,5 0,11 C 0,18 3,22 8,22 C 13,22 16,18 16,11 C 16,5 13,0 8,0 Z"
              fill="#795548"
              stroke="#5D4037"
              strokeWidth={0.5}
            />
          </Svg>
        </Animated.View>

        {/* Plant area - positioned above soil */}
        <View style={styles.plantArea}>
          {/* Stem - animated via clip height */}
          <Animated.View style={[styles.stemClip, stemClipStyle]}>
            <View style={styles.stemInner}>
              <Svg viewBox="0 0 20 120" width={20} height={120}>
                <Path
                  d="M 8,120 C 8,90 7,60 9,30 C 10,15 10,5 10,0 L 12,0 C 12,5 12,15 13,30 C 15,60 14,90 14,120 Z"
                  fill="#2D6A4F"
                />
              </Svg>
            </View>
          </Animated.View>

          {/* Left leaf */}
          <Animated.View style={[styles.leafContainer, styles.leftLeafPos, leftLeafStyle]}>
            <Svg viewBox="0 0 40 22" width={40} height={22}>
              <Path
                d="M 2,11 Q 6,2 20,1 Q 34,2 38,11 Q 34,20 20,21 Q 6,20 2,11 Z"
                fill="#74C69D"
                stroke="#2D6A4F"
                strokeWidth={1}
              />
              <Path
                d="M 4,11 Q 20,9 36,11"
                stroke="#2D6A4F"
                strokeWidth={0.7}
                fill="none"
                opacity={0.5}
              />
            </Svg>
          </Animated.View>

          {/* Right leaf */}
          <Animated.View style={[styles.leafContainer, styles.rightLeafPos, rightLeafStyle]}>
            <Svg viewBox="0 0 40 22" width={40} height={22}>
              <Path
                d="M 2,11 Q 6,2 20,1 Q 34,2 38,11 Q 34,20 20,21 Q 6,20 2,11 Z"
                fill="#74C69D"
                stroke="#2D6A4F"
                strokeWidth={1}
              />
              <Path
                d="M 4,11 Q 20,9 36,11"
                stroke="#2D6A4F"
                strokeWidth={0.7}
                fill="none"
                opacity={0.5}
              />
            </Svg>
          </Animated.View>

          {/* Flower at top */}
          <View style={styles.flowerContainer}>
            {/* 5 petals, each in its own Animated.View */}
            {petalRotations.map((rotation, index) => (
              <Animated.View
                key={`petal-${index}`}
                style={[styles.petalWrapper, petalStyles[index]]}
              >
                <Svg viewBox="0 0 44 44" width={44} height={44}>
                  <Ellipse
                    cx={22}
                    cy={12}
                    rx={8}
                    ry={11}
                    fill="#F4ACB7"
                    stroke="#E08C98"
                    strokeWidth={0.5}
                    transform={`rotate(${rotation}, 22, 22)`}
                  />
                </Svg>
              </Animated.View>
            ))}

            {/* Yellow center circle */}
            <Animated.View style={[styles.flowerCenterWrapper, flowerCenterStyle]}>
              <Svg viewBox="0 0 44 44" width={44} height={44}>
                <Circle
                  cx={22}
                  cy={22}
                  r={6}
                  fill="#FFD166"
                  stroke="#E08C98"
                  strokeWidth={0.5}
                />
              </Svg>
            </Animated.View>

            {/* Sparkles around flower */}
            {sparklePositions.map((pos, index) => (
              <Animated.View
                key={`sparkle-${index}`}
                style={[
                  styles.sparkleWrapper,
                  { top: pos.top, left: pos.left },
                  sparkleStyles[index],
                ]}
              >
                <Svg viewBox="0 0 10 10" width={10} height={10}>
                  <Path
                    d="M 5,0 L 6,4 L 10,5 L 6,6 L 5,10 L 4,6 L 0,5 L 4,4 Z"
                    fill="#FFD166"
                  />
                </Svg>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Title + tagline */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.appName}>The Last Dating App</Text>
          <Text style={styles.tagline}>Where real connections grow naturally</Text>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PLANT_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  soilContainer: {
    position: 'absolute',
    top: SOIL_Y,
    alignItems: 'center',
  },
  seedContainer: {
    position: 'absolute',
    top: SOIL_Y - 14,
    alignItems: 'center',
  },
  plantArea: {
    position: 'absolute',
    top: SOIL_Y - 120,
    alignItems: 'center',
    width: 100,
    height: 120,
    justifyContent: 'flex-end',
  },
  stemClip: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    overflow: 'hidden',
    alignItems: 'center',
  },
  stemInner: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 120,
  },
  leafContainer: {
    position: 'absolute',
    bottom: 55,
  },
  leftLeafPos: {
    right: 48,
    transformOrigin: 'right center',
  },
  rightLeafPos: {
    left: 48,
    transformOrigin: 'left center',
  },
  flowerContainer: {
    position: 'absolute',
    top: -22,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petalWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  flowerCenterWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
  },
  sparkleWrapper: {
    position: 'absolute',
  },
  titleContainer: {
    position: 'absolute',
    top: SOIL_Y + 60,
    alignItems: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: PLANT_COLORS.surface,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
  },
});

export default AnimatedSplash;
