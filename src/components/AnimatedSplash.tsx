import React, { useEffect } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  ReduceMotion,
  ReducedMotionConfig,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { PLANT_COLORS } from '../theme';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Lottie animation: 100 frames at 30fps = 3.33s. At 0.8x speed = ~4.2s
const LOTTIE_DURATION = 4200;

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  // Drive Lottie progress from 0 → 1 via Reanimated
  const lottieProgress = useSharedValue(0);

  // Title + scene opacity
  const titleOpacity = useSharedValue(0);
  const sceneOpacity = useSharedValue(1);

  useEffect(() => {
    onReady?.();

    // Animate Lottie progress from 0 to 1
    lottieProgress.value = withTiming(1, {
      duration: LOTTIE_DURATION,
      easing: Easing.linear,
    });

    // Title fades in after Lottie completes
    titleOpacity.value = withDelay(
      LOTTIE_DURATION,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // Hold for 2.5s after title appears, then fade out
    sceneOpacity.value = withDelay(
      LOTTIE_DURATION + 2500,
      withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) })
    );

    // Complete after fade
    const timer = setTimeout(() => {
      onComplete();
    }, LOTTIE_DURATION + 2900);

    return () => clearTimeout(timer);
  }, []);

  const animatedLottieProps = useAnimatedProps(() => ({
    progress: lottieProgress.value,
  }));

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
        <AnimatedLottieView
          source={require('../../assets/animations/sprout-growth.json')}
          autoPlay={false}
          loop={false}
          style={styles.lottie}
          animatedProps={animatedLottieProps}
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
