import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withSequence,
  withTiming,
  ReduceMotion,
  ReducedMotionConfig,
} from 'react-native-reanimated';
import { PLANT_COLORS } from '../theme';

interface SproutPopProps {
  visible: boolean;
  onComplete?: () => void;
}

const SproutPop: React.FC<SproutPopProps> = ({ visible, onComplete }) => {
  const stemScale = useSharedValue(0);
  const leftLeafScale = useSharedValue(0);
  const rightLeafScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      stemScale.value = 0;
      leftLeafScale.value = 0;
      rightLeafScale.value = 0;
      containerOpacity.value = 0;
      return;
    }

    containerOpacity.value = withTiming(1, { duration: 100 });

    stemScale.value = withSpring(1, { damping: 6, stiffness: 150 });

    leftLeafScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 120 }));
    rightLeafScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 120 }));

    // Fade out and complete
    const timer = setTimeout(() => {
      containerOpacity.value = withTiming(0, { duration: 200 });
    }, 800);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 1050);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const stemStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: stemScale.value }, { scaleX: stemScale.value }],
  }));

  const leftLeafStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leftLeafScale.value }, { rotate: '-30deg' }],
  }));

  const rightLeafStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rightLeafScale.value }, { rotate: '30deg' }],
  }));

  if (!visible) return null;

  return (
    <>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Stem */}
        <Animated.View style={[styles.stem, stemStyle]} />

        {/* Left leaf */}
        <Animated.View style={[styles.leaf, styles.leftLeaf, leftLeafStyle]} />

        {/* Right leaf */}
        <Animated.View style={[styles.leaf, styles.rightLeaf, rightLeafStyle]} />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stem: {
    width: 4,
    height: 30,
    backgroundColor: PLANT_COLORS.primaryDark,
    borderRadius: 2,
  },
  leaf: {
    position: 'absolute',
    width: 16,
    height: 10,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderRadius: 8,
    bottom: 18,
  },
  leftLeaf: {
    right: 27,
    transformOrigin: 'right center',
  },
  rightLeaf: {
    left: 27,
    transformOrigin: 'left center',
  },
});

export default SproutPop;
