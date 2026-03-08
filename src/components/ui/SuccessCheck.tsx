import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface SuccessCheckProps {
  visible: boolean;
  onDone?: () => void;
}

const SuccessCheck: React.FC<SuccessCheckProps> = ({ visible, onDone }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = 1;
      scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      // Fade out after 1.2s
      opacity.value = withDelay(
        1200,
        withTiming(0, { duration: 300 }, (finished) => {
          if (finished && onDone) runOnJS(onDone)();
        }),
      );
    } else {
      scale.value = 0;
      opacity.value = 0;
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Ionicons name="checkmark-circle" size={64} color={COLORS.primary} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default SuccessCheck;
