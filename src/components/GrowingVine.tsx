import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { PLANT_COLORS } from '../theme';

interface GrowingVineProps {
  progress: number; // 0 to 1
  totalSteps: number;
  currentStep: number;
}

const GrowingVine: React.FC<GrowingVineProps> = ({
  progress,
  totalSteps,
  currentStep,
}) => {
  const vineWidth = useSharedValue(0);

  useEffect(() => {
    vineWidth.value = withTiming(progress * 100, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [progress]);

  const vineStyle = useAnimatedStyle(() => ({
    width: `${vineWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <Animated.View style={[styles.vine, vineStyle]} />
      </View>
      <View style={styles.nodes}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.node,
              i < currentStep && styles.nodeComplete,
              i === currentStep && styles.nodeCurrent,
            ]}
          >
            {i < currentStep && <View style={styles.nodeLeaf} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  track: {
    height: 6,
    backgroundColor: PLANT_COLORS.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
  },
  vine: {
    height: '100%',
    backgroundColor: PLANT_COLORS.primary,
    borderRadius: 3,
  },
  nodes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
    paddingHorizontal: 4,
  },
  node: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PLANT_COLORS.surfaceVariant,
    borderWidth: 2,
    borderColor: PLANT_COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeComplete: {
    backgroundColor: PLANT_COLORS.primary,
  },
  nodeCurrent: {
    backgroundColor: PLANT_COLORS.primaryLight,
    borderColor: PLANT_COLORS.primary,
  },
  nodeLeaf: {
    width: 6,
    height: 4,
    backgroundColor: PLANT_COLORS.surface,
    borderRadius: 3,
  },
});

export default GrowingVine;
