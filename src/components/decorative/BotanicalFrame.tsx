import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PLANT_COLORS } from '../../theme';

interface BotanicalFrameProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const BotanicalFrame: React.FC<BotanicalFrameProps> = ({ children, style }) => (
  <View style={[styles.frame, style]}>
    <View style={[styles.corner, styles.topLeft]} />
    <View style={[styles.corner, styles.topRight]} />
    <View style={[styles.corner, styles.bottomLeft]} />
    <View style={[styles.corner, styles.bottomRight]} />
    {children}
  </View>
);

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1.5,
    borderColor: PLANT_COLORS.border,
    borderRadius: 20,
    padding: 4,
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderRadius: 6,
  },
  topLeft: {
    top: -4,
    left: 20,
    transform: [{ rotate: '-15deg' }],
  },
  topRight: {
    top: -4,
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  bottomLeft: {
    bottom: -4,
    left: 20,
    transform: [{ rotate: '15deg' }],
  },
  bottomRight: {
    bottom: -4,
    right: 20,
    transform: [{ rotate: '-15deg' }],
  },
});

export default BotanicalFrame;
