import React, { useEffect, useCallback, useRef } from 'react';
import { Text, StyleSheet, Dimensions, Animated as RNAnimated } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  ReduceMotion,
  ReducedMotionConfig,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { PLANT_COLORS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 100 frames at 30fps = 3.33s. At 0.8x speed = ~4.2s
const LOTTIE_DURATION = 4200;

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  // Drive Lottie via RN's built-in Animated (most reliable on Android prod builds)
  const lottieProgress = useRef(new RNAnimated.Value(0)).current;

  // Title + scene opacity via Reanimated
  const titleOpacity = useSharedValue(0);
  const sceneOpacity = useSharedValue(1);

  useEffect(() => {
    onReady?.();

    // Animate Lottie progress 0 → 1 using RN Animated
    RNAnimated.timing(lottieProgress, {
      toValue: 1,
      duration: LOTTIE_DURATION,
      easing: RNAnimated.Easing?.linear ?? ((t: number) => t),
      useNativeDriver: false, // progress prop can't use native driver
    }).start(() => {
      // Lottie done — fade in title
      titleOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });

      // Hold 2.5s, then fade out
      sceneOpacity.value = withDelay(
        2500,
        withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
      );

      setTimeout(() => {
        onComplete();
      }, 2900);
    });
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: sceneOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  return (
    <>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      <Animated.View style={[styles.container, containerStyle]}>
        <LottieView
          source={require('../../assets/animations/sprout-growth.json')}
          progress={lottieProgress}
          loop={false}
          style={styles.lottie}
        />

        {/* Title + tagline */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.appName}>THE LAST DATING APP</Text>
          <Text style={styles.tagline}>Where real connections grow naturally</Text>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PLANT_COLORS.splashBackground,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  lottie: {
    width: 280,
    height: 280,
  },
  titleContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '300',
    fontFamily: 'Nunito',
    letterSpacing: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    fontFamily: 'Caveat',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default AnimatedSplash;
