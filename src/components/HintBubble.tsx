import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { COMPANION_HINTS } from '../theme/plantMetaphors';
import { COLORS } from '../constants';
import { HintKey } from '../types';
import { useHint } from '../hooks/useHint';
import PlantCompanion from './PlantCompanion';

interface HintBubbleProps {
  hintKey: HintKey;
}

const HintBubble: React.FC<HintBubbleProps> = ({ hintKey }) => {
  const { visible, dismiss } = useHint(hintKey);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(20, { duration: 300 });
    }
  }, [visible]);

  const bubbleAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const hint = COMPANION_HINTS[hintKey];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.bubbleWrapper, bubbleAnimStyle]}>
        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss hint"
        >
          <View style={styles.bubble}>
            <Text style={styles.message}>{hint.message}</Text>
          </View>
          <View style={styles.tail} />
        </TouchableOpacity>
      </Animated.View>
      <View style={styles.companionWrapper}>
        <PlantCompanion growthStage={3} animate={visible} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  bubbleWrapper: {
    marginBottom: 4,
  },
  bubble: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    maxWidth: 260,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  message: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  tail: {
    width: 0,
    height: 0,
    alignSelf: 'flex-end',
    marginRight: 20,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.border,
  },
  companionWrapper: {
    transform: [{ scale: 0.75 }],
    marginTop: -10,
  },
});

export default HintBubble;
