import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PLANT_COLORS } from '../../theme';

type PlantState = 'empty' | 'wilted' | 'searching' | 'full';

interface EmptyStatePlantProps {
  state: PlantState;
  title: string;
  subtitle: string;
}

const PLANT_CONFIG: Record<PlantState, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  empty: { icon: 'flower-outline', color: PLANT_COLORS.textLight },
  wilted: { icon: 'rainy-outline', color: PLANT_COLORS.warning },
  searching: { icon: 'leaf-outline', color: PLANT_COLORS.primary },
  full: { icon: 'flower', color: PLANT_COLORS.secondary },
};

const EmptyStatePlant: React.FC<EmptyStatePlantProps> = ({ state, title, subtitle }) => {
  const config = PLANT_CONFIG[state];

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
        <Ionicons name={config.icon} size={48} color={config.color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PLANT_COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: PLANT_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default EmptyStatePlant;
