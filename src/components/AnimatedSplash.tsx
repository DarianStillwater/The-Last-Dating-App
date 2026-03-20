import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import LottieView from 'lottie-react-native';
import { PLANT_COLORS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const LOTTIE_DURATION = 4200;

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [fading, setFading] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onReady?.();

    // Drive Lottie progress 0→1 via RN Animated
    Animated.timing(progress, {
      toValue: 1,
      duration: LOTTIE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const titleTimer = setTimeout(() => setShowTitle(true), LOTTIE_DURATION);
    const fadeTimer = setTimeout(() => setFading(true), LOTTIE_DURATION + 2500);
    const completeTimer = setTimeout(() => onComplete(), LOTTIE_DURATION + 2900);

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
        source={require('../../assets/animations/sprout-growth.json')}
        progress={progress as any}
        loop={false}
        style={styles.lottie}
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
