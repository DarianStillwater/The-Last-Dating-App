import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { PLANT_COLORS } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LeafProps {
  delay: number;
  startX: number;
  size: number;
  duration: number;
}

const Leaf: React.FC<LeafProps> = ({ delay, startX, size, duration }) => {
  const translateY = useSharedValue(-size);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + size, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withTiming(30, { duration: duration * 0.4, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration: duration * 0.8, easing: Easing.linear }),
        -1,
        false
      )
    );
    opacity.value = withDelay(delay, withTiming(0.6, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.leaf,
        { left: startX, width: size, height: size * 0.6, borderRadius: size / 2 },
        animatedStyle,
      ]}
    />
  );
};

const FloatingLeaves: React.FC = () => (
  <>
    <Leaf delay={0} startX={30} size={14} duration={8000} />
    <Leaf delay={2000} startX={120} size={10} duration={10000} />
    <Leaf delay={4000} startX={220} size={12} duration={9000} />
    <Leaf delay={1000} startX={280} size={8} duration={11000} />
  </>
);

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    backgroundColor: PLANT_COLORS.primaryLight,
    opacity: 0.4,
  },
});

export default FloatingLeaves;
