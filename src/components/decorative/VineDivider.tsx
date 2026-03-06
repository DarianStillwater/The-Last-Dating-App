import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PLANT_COLORS } from '../../theme';

interface VineDividerProps {
  width?: number | string;
}

const VineDivider: React.FC<VineDividerProps> = ({ width = '100%' }) => (
  <View style={[styles.container, { width: width as any }]}>
    <View style={styles.vine} />
    <View style={styles.leafLeft} />
    <View style={styles.leafCenter} />
    <View style={styles.leafRight} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  vine: {
    position: 'absolute',
    width: '80%',
    height: 1.5,
    backgroundColor: PLANT_COLORS.border,
    borderRadius: 1,
  },
  leafLeft: {
    position: 'absolute',
    left: '25%',
    width: 8,
    height: 5,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderRadius: 4,
    transform: [{ rotate: '-30deg' }],
  },
  leafCenter: {
    width: 10,
    height: 6,
    backgroundColor: PLANT_COLORS.primary,
    borderRadius: 5,
  },
  leafRight: {
    position: 'absolute',
    right: '25%',
    width: 8,
    height: 5,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderRadius: 4,
    transform: [{ rotate: '30deg' }],
  },
});

export default VineDivider;
