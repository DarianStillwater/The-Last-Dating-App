import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PLANT_COLORS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  const [debugInfo, setDebugInfo] = useState('mounting...');
  const [done, setDone] = useState(false);

  useEffect(() => {
    onReady?.();
    setDebugInfo('ready');

    // Try to load Lottie and report
    let lottieStatus = 'not tested';
    try {
      const LottieView = require('lottie-react-native').default;
      lottieStatus = LottieView ? 'module loaded' : 'module is null';
    } catch (e: any) {
      lottieStatus = `import error: ${e.message}`;
    }

    setDebugInfo(`lottie: ${lottieStatus}`);

    const timer = setTimeout(() => {
      setDone(true);
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (done) return null;

  return (
    <View style={styles.container}>
      <View style={styles.debugBox}>
        <Text style={styles.debugText}>Splash Debug</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.appName}>THE LAST DATING APP</Text>
        <Text style={styles.tagline}>Where real connections grow naturally</Text>
      </View>
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
  debugBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 40,
  },
  debugText: {
    fontSize: 16,
    color: '#0f0',
    fontWeight: 'bold',
    textAlign: 'center',
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
