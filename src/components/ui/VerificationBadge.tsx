import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../constants';
import type { ProfileVerificationStatus } from '../../types';

interface VerificationBadgeProps {
  status: ProfileVerificationStatus;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  style?: ViewStyle;
}

const CONFIG: Record<ProfileVerificationStatus, {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
}> = {
  verified: {
    icon: 'shield-checkmark',
    color: COLORS.success,
    bg: COLORS.success + '20',
    label: 'Verified',
  },
  pending: {
    icon: 'time',
    color: COLORS.warning,
    bg: COLORS.warning + '20',
    label: 'Pending',
  },
  expired: {
    icon: 'warning',
    color: COLORS.error,
    bg: COLORS.error + '20',
    label: 'Expired',
  },
  rejected: {
    icon: 'close-circle',
    color: COLORS.error,
    bg: COLORS.error + '20',
    label: 'Rejected',
  },
  unverified: {
    icon: 'shield-outline',
    color: COLORS.textSecondary,
    bg: COLORS.surfaceVariant,
    label: 'Unverified',
  },
};

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  status,
  size = 'small',
  showLabel = false,
  style,
}) => {
  const config = CONFIG[status];
  const iconSize = size === 'small' ? 14 : 18;
  const badgeSize = size === 'small' ? 24 : 32;

  if (showLabel) {
    return (
      <View style={[styles.labelBadge, { backgroundColor: config.bg }, style]}>
        <Ionicons name={config.icon} size={iconSize} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.iconBadge,
        { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, backgroundColor: config.bg },
        style,
      ]}
    >
      <Ionicons name={config.icon} size={iconSize} color={config.color} />
    </View>
  );
};

const styles = StyleSheet.create({
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default VerificationBadge;
