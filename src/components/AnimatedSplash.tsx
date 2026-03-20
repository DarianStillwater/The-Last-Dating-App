import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import LottieView from 'lottie-react-native';
import { PLANT_COLORS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOTTIE_DURATION = 4200; // 100 frames at 30fps, 0.8x speed

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [fading, setFading] = useState(false);
  const lottieRef = useRef<LottieView>(null);
  const hasStarted = useRef(false);

  // Use onLayout to know when the LottieView is actually mounted,
  // then play via ref. This is the most reliable approach for Android prod builds.
  const handleLottieLayout = useCallback(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Small delay to ensure native view is fully ready
    setTimeout(() => {
      lottieRef.current?.play(0, 99);
    }, 100);
  }, []);

  useEffect(() => {
    onReady?.();

    // Show title after Lottie completes
    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, LOTTIE_DURATION + 200); // +200 for the play delay

    // Start fade out after title has been visible
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, LOTTIE_DURATION + 2700);

    // Complete
    const completeTimer = setTimeout(() => {
      onComplete();
    }, LOTTIE_DURATION + 3100);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  if (fading) return null;

  return (
    <View style={styles.container}>
      <LottieView
        ref={lottieRef}
        source={require('../../assets/animations/sprout-growth.json')}
        autoPlay={false}
        loop={false}
        speed={0.8}
        style={styles.lottie}
        onLayout={handleLottieLayout}
        renderMode="AUTOMATIC"
      />

      {showTitle && (
        <View style={styles.titleContainer}>
          <Text style={styles.appName}>THE LAST DATING APP</Text>
          <Text style={styles.tagline}>Where real connections grow naturally</Text>
        </View>
      )}
    </View>
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
