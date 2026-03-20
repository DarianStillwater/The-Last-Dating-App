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
  const [debugLog, setDebugLog] = useState<string[]>(['mount']);
  const progress = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<LottieView>(null);

  const log = (msg: string) => {
    setDebugLog((prev) => [...prev, `${Date.now() % 100000}: ${msg}`]);
  };

  useEffect(() => {
    onReady?.();
    log('useEffect fired');

    // Approach 1: Animated.Value → progress prop
    log('starting Animated.timing');
    Animated.timing(progress, {
      toValue: 1,
      duration: LOTTIE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      log(`timing finished: ${finished}`);
    });

    // Listen to progress value
    const listenerId = progress.addListener(({ value }) => {
      if (value === 0) log('progress=0');
      else if (value < 0.01) log(`progress started: ${value.toFixed(4)}`);
      else if (Math.abs(value - 0.25) < 0.01) log('progress~0.25');
      else if (Math.abs(value - 0.5) < 0.01) log('progress~0.5');
      else if (Math.abs(value - 0.75) < 0.01) log('progress~0.75');
      else if (value > 0.99) log(`progress done: ${value.toFixed(4)}`);
    });

    // Approach 2 (fallback): also try ref.play after delay
    const playTimer = setTimeout(() => {
      log('calling ref.play(0,99)');
      try {
        lottieRef.current?.play(0, 99);
        log('ref.play called ok');
      } catch (e: any) {
        log(`ref.play error: ${e.message}`);
      }
    }, 500);

    const titleTimer = setTimeout(() => setShowTitle(true), LOTTIE_DURATION + 500);
    const fadeTimer = setTimeout(() => setFading(true), LOTTIE_DURATION + 8000); // extra time for debugging
    const completeTimer = setTimeout(() => onComplete(), LOTTIE_DURATION + 8400);

    return () => {
      progress.removeListener(listenerId);
      clearTimeout(playTimer);
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
        progress={progress as any}
        autoPlay={false}
        loop={false}
        speed={0.8}
        style={styles.lottie}
        onAnimationFinish={() => log('onAnimationFinish')}
        onLayout={() => log('lottie onLayout')}
      />

      {/* Debug overlay */}
      <View style={styles.debugContainer}>
        {debugLog.map((msg, i) => (
          <Text key={i} style={styles.debugText}>{msg}</Text>
        ))}
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
  debugContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
    maxHeight: 200,
  },
  debugText: {
    fontSize: 11,
    color: '#0f0',
    fontFamily: 'monospace',
    lineHeight: 14,
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
