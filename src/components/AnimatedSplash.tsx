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
  const [done, setDone] = useState(false);
  const [status, setStatus] = useState('mounting');
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    onReady?.();
    setStatus('starting animation');

    // Drive Lottie via progress prop with RN Animated
    Animated.timing(progress, {
      toValue: 1,
      duration: LOTTIE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(() => {
      setStatus('animation complete');
      setShowTitle(true);
    });

    const completeTimer = setTimeout(() => {
      setDone(true);
      onComplete();
    }, LOTTIE_DURATION + 3000);

    return () => clearTimeout(completeTimer);
  }, []);

  if (done) return null;

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/sprout-growth.json')}
        progress={progress as any}
        autoPlay={false}
        loop={false}
        style={styles.lottie}
      />

      <View style={styles.debugBox}>
        <Text style={styles.debugText}>{status}</Text>
      </View>

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
  debugBox: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 12,
  },
  debugText: {
    fontSize: 14,
    color: '#0f0',
    fontWeight: 'bold',
  },
  titleContainer: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.2,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 4,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default AnimatedSplash;
