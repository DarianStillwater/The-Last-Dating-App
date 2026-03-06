import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import { COLORS } from '../../constants';
import { ONBOARDING_COPY } from '../../theme/plantMetaphors';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark, COLORS.text]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        {/* Logo and Tagline */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="leaf" size={48} color={COLORS.surface} />
          </View>
          <Text style={styles.title}>The Last</Text>
          <Text style={styles.subtitle}>Dating App</Text>
          <Text style={styles.tagline}>
            {ONBOARDING_COPY.welcome.tagline}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {ONBOARDING_COPY.welcome.features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color={COLORS.secondary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + 32 }]}>
        <Button
          title="Start Planting"
          onPress={() => navigation.navigate('SignUp')}
          variant="primary"
          size="large"
          fullWidth
          style={styles.createButton}
          textStyle={styles.createButtonText}
        />
        
        <Button
          title="I already have an account"
          onPress={() => navigation.navigate('SignIn')}
          variant="ghost"
          size="medium"
          fullWidth
          textStyle={styles.signInText}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(240, 255, 244, 0.05)', // plant-themed translucent
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    top: height * 0.3,
    left: -80,
  },
  circle3: {
    width: 150,
    height: 150,
    bottom: 100,
    right: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(240, 255, 244, 0.15)', // plant-themed translucent
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 42,
    fontWeight: '800',
    color: COLORS.surface,
    letterSpacing: -1,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(240, 255, 244, 0.8)', // plant-themed translucent
    textAlign: 'center',
    lineHeight: 26,
  },
  features: {
    gap: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 255, 244, 0.1)', // plant-themed translucent
    borderRadius: 16,
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(240, 255, 244, 0.1)', // plant-themed translucent
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.surface,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: 'rgba(240, 255, 244, 0.7)', // plant-themed translucent
  },
  actions: {
    paddingHorizontal: 32,
    gap: 12,
  },
  createButton: {
    backgroundColor: COLORS.surface,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  createButtonText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  signInText: {
    color: COLORS.surface,
  },
});

export default WelcomeScreen;
