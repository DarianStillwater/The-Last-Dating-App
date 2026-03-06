import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Rect, Ellipse } from 'react-native-svg';
import { PLANT_COLORS } from '../theme';

interface PlantCompanionProps {
  growthStage: number; // 1-6
  animate?: boolean;
}

const W = 80;
const H = 100;

// Planter dimensions
const PLANTER_TOP = 58;
const PLANTER_RIM_H = 5;
const PLANTER_BODY_TOP = PLANTER_TOP + PLANTER_RIM_H; // 63
const PLANTER_BODY_H = 34;
const PLANTER_W_TOP = 52;
const PLANTER_W_BOT = 42;
const PLANTER_INSET = (PLANTER_W_TOP - PLANTER_W_BOT) / 2; // 5

const PlantCompanion: React.FC<PlantCompanionProps> = ({
  growthStage,
  animate = true,
}) => {
  // Soil
  const soilHeight = useSharedValue(0);
  // Fertilizer
  const fertGroupY = useSharedValue(-30);
  const fertGroupOpacity = useSharedValue(0);
  const fertLandedOpacity = useSharedValue(0);
  // Seed packet & seeds
  const packetOpacity = useSharedValue(0);
  const packetRotation = useSharedValue(0);
  const seedGroupY = useSharedValue(-20);
  const seedGroupOpacity = useSharedValue(0);
  const seedsLandedOpacity = useSharedValue(0);
  // Watering can
  const canOpacity = useSharedValue(0);
  const canRotation = useSharedValue(0);
  const streamOpacity = useSharedValue(0);
  const soilWatered = useSharedValue(0);
  // Sprout
  const sproutScale = useSharedValue(0);
  const sproutSway = useSharedValue(0);
  // Wiggle
  const wiggle = useSharedValue(0);

  useEffect(() => {
    // Step 2+: Soil rises from bottom
    const soilTarget = growthStage >= 2 ? 24 : 0;
    soilHeight.value = animate
      ? withSpring(soilTarget, { damping: 14, stiffness: 80 })
      : soilTarget;

    // Step 3: Fertilizer granules fall into planter
    if (growthStage >= 3) {
      if (animate && growthStage === 3) {
        fertGroupY.value = -30;
        fertGroupOpacity.value = withDelay(
          200,
          withSequence(
            withTiming(1, { duration: 100 }),
            withDelay(500, withTiming(0, { duration: 200 })),
          ),
        );
        fertGroupY.value = withDelay(
          200,
          withTiming(0, { duration: 600 }),
        );
        fertLandedOpacity.value = withDelay(
          700,
          withTiming(1, { duration: 200 }),
        );
      } else {
        fertGroupOpacity.value = 0;
        fertGroupY.value = 0;
        fertLandedOpacity.value = 1;
      }
    } else {
      fertGroupOpacity.value = 0;
      fertLandedOpacity.value = 0;
    }

    // Step 4: Seed packet tips over, seeds fall out
    if (growthStage >= 4) {
      if (animate && growthStage === 4) {
        seedGroupY.value = -20;
        seedGroupOpacity.value = 0;
        packetRotation.value = 0;
        packetOpacity.value = withDelay(
          100,
          withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(800, withTiming(0, { duration: 300 })),
          ),
        );
        packetRotation.value = withDelay(
          300,
          withTiming(-50, { duration: 500 }),
        );
        seedGroupOpacity.value = withDelay(
          500,
          withSequence(
            withTiming(1, { duration: 100 }),
            withDelay(400, withTiming(0, { duration: 200 })),
          ),
        );
        seedGroupY.value = withDelay(
          500,
          withTiming(0, { duration: 500 }),
        );
        seedsLandedOpacity.value = withDelay(
          900,
          withTiming(1, { duration: 200 }),
        );
      } else {
        packetOpacity.value = 0;
        packetRotation.value = 0;
        seedGroupOpacity.value = 0;
        seedsLandedOpacity.value = 1;
      }
    } else {
      packetOpacity.value = 0;
      packetRotation.value = 0;
      seedGroupOpacity.value = 0;
      seedsLandedOpacity.value = 0;
    }

    // Step 5: Watering can appears, tips to pour
    if (growthStage >= 5) {
      if (animate && growthStage === 5) {
        canRotation.value = 0;
        canOpacity.value = withDelay(
          100,
          withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(1200, withTiming(0, { duration: 300 })),
          ),
        );
        // Tip the can to pour
        canRotation.value = withDelay(
          300,
          withTiming(-25, { duration: 400 }),
        );
        streamOpacity.value = withDelay(
          600,
          withSequence(
            withTiming(1, { duration: 200 }),
            withDelay(500, withTiming(0, { duration: 300 })),
          ),
        );
        soilWatered.value = withDelay(
          800,
          withTiming(1, { duration: 400 }),
        );
      } else {
        canOpacity.value = 0;
        canRotation.value = 0;
        streamOpacity.value = 0;
        soilWatered.value = 1;
      }
    } else {
      canOpacity.value = 0;
      canRotation.value = 0;
      streamOpacity.value = 0;
      soilWatered.value = 0;
    }

    // Step 6: Sprout
    const sproutTarget = growthStage >= 6 ? 1 : 0;
    sproutScale.value = animate
      ? withDelay(
          300,
          withSpring(sproutTarget, { damping: 6, stiffness: 150 }),
        )
      : sproutTarget;

    if (animate && growthStage >= 6) {
      sproutSway.value = withDelay(
        600,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 300 }),
            withTiming(6, { duration: 300 }),
            withTiming(0, { duration: 200 }),
          ),
          2,
          true,
        ),
      );
    } else {
      sproutSway.value = 0;
    }

    // Wiggle on every step change
    if (animate && growthStage > 0) {
      wiggle.value = withDelay(
        50,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 60 }),
            withTiming(4, { duration: 60 }),
            withTiming(0, { duration: 60 }),
          ),
          3,
          true,
        ),
      );
    }
  }, [growthStage, animate]);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${wiggle.value}deg` }],
  }));

  const soilStyle = useAnimatedStyle(() => ({
    height: soilHeight.value,
    opacity: soilHeight.value > 0 ? 1 : 0,
  }));

  const soilOverlayStyle = useAnimatedStyle(() => ({
    opacity: soilWatered.value * 0.25,
    height: soilHeight.value,
  }));

  const fertFallingStyle = useAnimatedStyle(() => ({
    opacity: fertGroupOpacity.value,
    transform: [{ translateY: fertGroupY.value }],
  }));

  const fertLandedStyle = useAnimatedStyle(() => ({
    opacity: fertLandedOpacity.value,
  }));

  // Packet is 22x28; pivot at top-center (11,0) vs default center (11,14) → offset (0,-14)
  const packetStyle = useAnimatedStyle(() => ({
    opacity: packetOpacity.value,
    transform: [
      { translateY: -14 },
      { rotate: `${packetRotation.value}deg` },
      { translateY: 14 },
    ],
  }));

  const seedFallingStyle = useAnimatedStyle(() => ({
    opacity: seedGroupOpacity.value,
    transform: [{ translateY: seedGroupY.value }],
  }));

  const seedsLandedStyle = useAnimatedStyle(() => ({
    opacity: seedsLandedOpacity.value,
  }));

  const canSlideStyle = useAnimatedStyle(() => ({
    opacity: canOpacity.value,
  }));

  // Inner: tip rotation, pivot at right-center (36,14) vs default (18,14) → offset (18,0)
  const canTipStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 18 },
      { rotate: `${canRotation.value}deg` },
      { translateX: -18 },
    ],
  }));

  const streamStyle = useAnimatedStyle(() => ({
    opacity: streamOpacity.value,
  }));

  const sproutStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: sproutScale.value },
      { rotate: `${sproutSway.value}deg` },
    ],
  }));

  // Planter path calculations
  const cx = W / 2;
  const rimLeft = cx - PLANTER_W_TOP / 2;
  const rimRight = cx + PLANTER_W_TOP / 2;
  const botLeft = cx - PLANTER_W_BOT / 2;
  const botRight = cx + PLANTER_W_BOT / 2;
  const planterPath = `M ${rimLeft} ${PLANTER_BODY_TOP} L ${rimRight} ${PLANTER_BODY_TOP} L ${botRight} ${PLANTER_BODY_TOP + PLANTER_BODY_H} L ${botLeft} ${PLANTER_BODY_TOP + PLANTER_BODY_H} Z`;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Static SVG: planter box */}
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Planter rim */}
        <Rect
          x={rimLeft - 2}
          y={PLANTER_TOP}
          width={PLANTER_W_TOP + 4}
          height={PLANTER_RIM_H}
          rx={2}
          fill="#5D4037"
        />
        {/* Planter body */}
        <Path d={planterPath} fill="#8D6E63" />
        {/* Wood grain */}
        <Path
          d={`M ${rimLeft + 4} ${PLANTER_BODY_TOP + 8} L ${rimRight - 4} ${PLANTER_BODY_TOP + 8}`}
          stroke="#795548"
          strokeWidth={0.5}
          opacity={0.4}
        />
        <Path
          d={`M ${rimLeft + 6} ${PLANTER_BODY_TOP + 18} L ${rimRight - 6} ${PLANTER_BODY_TOP + 18}`}
          stroke="#795548"
          strokeWidth={0.5}
          opacity={0.4}
        />
      </Svg>

      {/* Soil — trapezoidal, fills from bottom up */}
      <Animated.View style={[styles.soilContainer, soilStyle]}>
        <Svg
          width={PLANTER_W_TOP}
          height={PLANTER_BODY_H}
          viewBox={`0 0 ${PLANTER_W_TOP} ${PLANTER_BODY_H}`}
          style={styles.soilSvg}
        >
          {/* Trapezoidal soil matching planter walls */}
          <Path
            d={`M 0 0 L ${PLANTER_W_TOP} 0 L ${PLANTER_W_TOP - PLANTER_INSET} ${PLANTER_BODY_H} L ${PLANTER_INSET} ${PLANTER_BODY_H} Z`}
            fill="#6D4C41"
          />
          {/* Surface bumps at top */}
          <Ellipse cx={12} cy={2} rx={4} ry={1.5} fill="#795548" />
          <Ellipse cx={30} cy={2} rx={5} ry={2} fill="#795548" />
          <Ellipse cx={45} cy={2} rx={3} ry={1.5} fill="#795548" />
          {/* Speckles */}
          <Circle cx={8} cy={5} r={1.5} fill="#4E342E" />
          <Circle cx={22} cy={7} r={1} fill="#3E2723" />
          <Circle cx={36} cy={4} r={1.5} fill="#4E342E" />
          <Circle cx={44} cy={8} r={1} fill="#3E2723" />
        </Svg>
      </Animated.View>

      {/* Watered overlay */}
      <Animated.View style={[styles.soilOverlay, soilOverlayStyle]} />

      {/* Fertilizer — falling group */}
      <Animated.View style={[styles.fertFalling, fertFallingStyle]}>
        <Svg width={44} height={16} viewBox="0 0 44 16">
          <Circle cx={5} cy={3} r={2.5} fill="#4CAF50" />
          <Circle cx={15} cy={6} r={2} fill="#E0E0E0" />
          <Circle cx={24} cy={2} r={2.5} fill="#A1887F" />
          <Circle cx={33} cy={5} r={2} fill="#4CAF50" />
          <Circle cx={40} cy={8} r={2.5} fill="#E0E0E0" />
          <Circle cx={20} cy={12} r={2} fill="#8D6E63" />
        </Svg>
      </Animated.View>

      {/* Fertilizer — landed on soil */}
      <Animated.View style={[styles.fertLanded, fertLandedStyle]}>
        <Svg width={40} height={8} viewBox="0 0 40 8">
          <Circle cx={5} cy={3} r={1.5} fill="#4CAF50" />
          <Circle cx={14} cy={4} r={1.5} fill="#E0E0E0" />
          <Circle cx={22} cy={3} r={1.5} fill="#A1887F" />
          <Circle cx={30} cy={4} r={1.5} fill="#4CAF50" />
          <Circle cx={37} cy={3} r={1} fill="#E0E0E0" />
        </Svg>
      </Animated.View>

      {/* Seed packet */}
      <Animated.View style={[styles.packetArea, packetStyle]}>
        <Svg width={22} height={28} viewBox="0 0 22 28">
          <Rect
            x={1}
            y={5}
            width={20}
            height={21}
            rx={2}
            fill={PLANT_COLORS.primary}
          />
          <Path d="M 1 5 L 11 0 L 21 5 Z" fill={PLANT_COLORS.primaryDark} />
          <Path
            d="M 11 13 C 11 10 13 8 13 8 C 13 8 15 10 15 13 C 15 16 13 17 13 17 C 13 17 11 16 11 13 Z"
            fill="#FFF"
            opacity={0.8}
          />
          <Path
            d="M 7 16 C 7 13 9 11 9 11 C 9 11 11 13 11 16 C 11 19 9 20 9 20 C 9 20 7 19 7 16 Z"
            fill="#FFF"
            opacity={0.6}
          />
        </Svg>
      </Animated.View>

      {/* Seeds — falling group */}
      <Animated.View style={[styles.seedsFalling, seedFallingStyle]}>
        <Svg width={30} height={14} viewBox="0 0 30 14">
          <Path
            d="M 5 10 C 5 7 7 4 7 4 C 7 4 9 7 9 10 C 9 12 7 13 7 13 C 7 13 5 12 5 10 Z"
            fill="#5D4037"
          />
          <Path
            d="M 13 8 C 13 5 15 2 15 2 C 15 2 17 5 17 8 C 17 10 15 11 15 11 C 15 11 13 10 13 8 Z"
            fill="#4E342E"
          />
          <Path
            d="M 21 10 C 21 7 23 4 23 4 C 23 4 25 7 25 10 C 25 12 23 13 23 13 C 23 13 21 12 21 10 Z"
            fill="#5D4037"
          />
        </Svg>
      </Animated.View>

      {/* Seeds — landed on soil */}
      <Animated.View style={[styles.seedsLanded, seedsLandedStyle]}>
        <Svg width={40} height={10} viewBox="0 0 40 10">
          <Path
            d="M 6 7 C 6 4 8 2 8 2 C 8 2 10 4 10 7 C 10 9 8 10 8 10 C 8 10 6 9 6 7 Z"
            fill="#5D4037"
          />
          <Path
            d="M 17 6 C 17 3 19 1 19 1 C 19 1 21 3 21 6 C 21 8 19 9 19 9 C 19 9 17 8 17 6 Z"
            fill="#4E342E"
          />
          <Path
            d="M 28 7 C 28 4 30 2 30 2 C 30 2 32 4 32 7 C 32 9 30 10 30 10 C 30 10 28 9 28 7 Z"
            fill="#5D4037"
          />
        </Svg>
      </Animated.View>

      {/* Watering can (right side, spout points left into planter) */}
      <Animated.View style={[styles.canArea, canSlideStyle]}>
      <Animated.View style={canTipStyle}>
        <Svg width={36} height={28} viewBox="0 0 36 28">
          {/* Can body */}
          <Rect x={10} y={8} width={18} height={16} rx={3} fill="#78909C" />
          {/* Handle (right side, away from planter) */}
          <Path
            d="M 28 10 C 34 10 34 20 28 20"
            stroke="#546E7A"
            strokeWidth={2.5}
            fill="none"
          />
          {/* Spout (pointing left, toward planter) */}
          <Path d="M 10 12 L 2 4 L 6 2 L 12 10" fill="#78909C" />
          {/* Spout holes */}
          <Circle cx={3} cy={3} r={0.8} fill="#B0BEC5" />
          <Circle cx={5} cy={2} r={0.8} fill="#B0BEC5" />
          {/* Top opening */}
          <Ellipse cx={19} cy={8} rx={7} ry={2} fill="#90A4AE" />
        </Svg>
      </Animated.View>
      </Animated.View>

      {/* Water stream (from tipped spout down into planter) */}
      <Animated.View style={[styles.streamArea, streamStyle]}>
        <Svg width={14} height={18} viewBox="0 0 14 18">
          <Path
            d="M 7 0 C 6 4 5 8 4 12 C 3.5 14 3 16 3 18"
            stroke="#64B5F6"
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
            opacity={0.8}
          />
          <Path
            d="M 9 1 C 8 5 7 9 6 13"
            stroke="#90CAF9"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            opacity={0.5}
          />
          {/* Splash drops */}
          <Circle cx={3} cy={17} r={1.5} fill="#64B5F6" opacity={0.6} />
          <Circle cx={8} cy={16} r={1} fill="#90CAF9" opacity={0.5} />
        </Svg>
      </Animated.View>

      {/* Sprout */}
      <Animated.View style={[styles.sproutArea, sproutStyle]}>
        <Svg width={24} height={28} viewBox="0 0 24 28">
          <Path
            d="M 12 28 C 12 20 12 14 12 10"
            stroke={PLANT_COLORS.primaryDark}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 12 14 C 8 12 4 8 4 6 C 6 6 10 10 12 14 Z"
            fill={PLANT_COLORS.primaryLight}
          />
          <Path
            d="M 12 10 C 16 8 20 4 20 2 C 18 2 14 6 12 10 Z"
            fill={PLANT_COLORS.primary}
          />
          <Path
            d="M 12 14 C 9 11 6 8 5 7"
            stroke={PLANT_COLORS.primaryDark}
            strokeWidth={0.5}
            fill="none"
            opacity={0.4}
          />
          <Path
            d="M 12 10 C 15 7 18 4 19 3"
            stroke={PLANT_COLORS.primaryDark}
            strokeWidth={0.5}
            fill="none"
            opacity={0.4}
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: W,
    height: H,
  },
  soilContainer: {
    position: 'absolute',
    bottom: H - PLANTER_BODY_TOP - PLANTER_BODY_H, // 3
    left: (W - PLANTER_W_TOP) / 2, // 14
    width: PLANTER_W_TOP,
    overflow: 'hidden',
  },
  soilSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  soilOverlay: {
    position: 'absolute',
    bottom: H - PLANTER_BODY_TOP - PLANTER_BODY_H,
    left: (W - PLANTER_W_TOP) / 2,
    width: PLANTER_W_TOP,
    backgroundColor: '#3E2723',
    overflow: 'hidden',
  },
  fertFalling: {
    position: 'absolute',
    top: PLANTER_TOP - 16,
    left: (W - 44) / 2,
  },
  fertLanded: {
    position: 'absolute',
    top: PLANTER_BODY_TOP + 2,
    left: (W - 40) / 2,
  },
  packetArea: {
    position: 'absolute',
    top: PLANTER_TOP - 30,
    right: 6,
  },
  seedsFalling: {
    position: 'absolute',
    top: PLANTER_TOP - 14,
    left: (W - 30) / 2,
  },
  seedsLanded: {
    position: 'absolute',
    top: PLANTER_BODY_TOP + 1,
    left: (W - 40) / 2,
  },
  canArea: {
    position: 'absolute',
    top: PLANTER_TOP - 30,
    right: -2,
  },
  streamArea: {
    position: 'absolute',
    top: 44,
    left: 40,
  },
  sproutArea: {
    position: 'absolute',
    top: PLANTER_TOP - 22,
    left: (W - 24) / 2,
  },
});

export default PlantCompanion;
