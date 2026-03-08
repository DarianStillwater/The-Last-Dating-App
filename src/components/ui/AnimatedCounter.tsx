import React, { useEffect } from 'react';
import { TextStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedProps,
} from 'react-native-reanimated';
import { COLORS } from '../../constants';

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, style }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(1.3, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text style={[{ fontSize: 14, fontWeight: '700', color: COLORS.primary }, style, animatedStyle]}>
      {value}
    </Animated.Text>
  );
};

export default AnimatedCounter;
