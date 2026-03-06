import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PLANT_COLORS } from '../../theme';

type Corner = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';

interface LeafCornerProps {
  corner: Corner;
}

const POSITIONS: Record<Corner, { top?: number; bottom?: number; left?: number; right?: number; rotate: string }> = {
  topLeft: { top: 8, left: 8, rotate: '225deg' },
  topRight: { top: 8, right: 8, rotate: '315deg' },
  bottomLeft: { bottom: 8, left: 8, rotate: '135deg' },
  bottomRight: { bottom: 8, right: 8, rotate: '45deg' },
};

const LeafCorner: React.FC<LeafCornerProps> = ({ corner }) => {
  const pos = POSITIONS[corner];
  return (
    <View
      style={[
        styles.leaf,
        { top: pos.top, bottom: pos.bottom, left: pos.left, right: pos.right },
        { transform: [{ rotate: pos.rotate }] },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    width: 14,
    height: 8,
    backgroundColor: PLANT_COLORS.primaryLight,
    borderRadius: 7,
    opacity: 0.5,
  },
});

export default LeafCorner;
