import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { PLANT_COLORS } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TOTAL_DURATION = 4200; // ms
const FRAME_INTERVAL = 33; // ~30fps
const TOTAL_STEPS = Math.ceil(TOTAL_DURATION / FRAME_INTERVAL);

interface AnimatedSplashProps {
  onComplete: () => void;
  onReady?: () => void;
}

const AnimatedSplash: React.FC<AnimatedSplashProps> = ({ onComplete, onReady }) => {
  const [progress, setProgress] = useState(0);
  const [showTitle, setShowTitle] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    onReady?.();

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const p = Math.min(step / TOTAL_STEPS, 1);
      setProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        setShowTitle(true);
      }
    }, FRAME_INTERVAL);

    const completeTimer = setTimeout(() => {
      setDone(true);
      onComplete();
    }, TOTAL_DURATION + 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(completeTimer);
    };
  }, []);

  if (done) return null;

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/sprout-growth.json')}
        progress={progress}
        autoPlay={false}
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
