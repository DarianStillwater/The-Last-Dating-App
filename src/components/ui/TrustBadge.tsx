import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS, TRUST_CONFIG } from '../../constants';
import { TRUST_TIERS } from '../../theme/plantMetaphors';

interface TrustBadgeProps {
  vouchCount: number;
  reviewCount: number;
  size?: 'small' | 'medium';
  showLabel?: boolean;
  style?: ViewStyle;
}

const getTrustTier = (vouchCount: number, reviewCount: number) => {
  if (
    vouchCount >= TRUST_TIERS[3].minVouches &&
    reviewCount >= TRUST_TIERS[3].minReviews
  ) return TRUST_TIERS[3];
  if (
    vouchCount >= TRUST_TIERS[2].minVouches &&
    reviewCount >= TRUST_TIERS[2].minReviews
  ) return TRUST_TIERS[2];
  if (
    vouchCount >= TRUST_TIERS[1].minVouches &&
    reviewCount >= TRUST_TIERS[1].minReviews
  ) return TRUST_TIERS[1];
  return TRUST_TIERS[0];
};

const TIER_COLORS: Record<string, { color: string; bg: string }> = {
  'New Seedling': { color: COLORS.textSecondary, bg: COLORS.surfaceVariant },
  'Taking Root': { color: COLORS.primary, bg: COLORS.primary + '20' },
  'Growing Strong': { color: COLORS.primaryDark, bg: COLORS.primaryDark + '20' },
  'Deep Roots': { color: COLORS.success, bg: COLORS.success + '20' },
};

const TrustBadge: React.FC<TrustBadgeProps> = ({
  vouchCount,
  reviewCount,
  size = 'small',
  showLabel = false,
  style,
}) => {
  const tier = getTrustTier(vouchCount, reviewCount);
  const colors = TIER_COLORS[tier.label];
  const iconSize = size === 'small' ? 14 : 18;
  const badgeSize = size === 'small' ? 24 : 32;

  // Don't show badge for brand new users with no trust data
  if (vouchCount === 0 && reviewCount === 0) return null;

  if (showLabel) {
    return (
      <View style={[styles.labelBadge, { backgroundColor: colors.bg }, style]}>
        <Ionicons name={tier.icon as any} size={iconSize} color={colors.color} />
        <Text style={[styles.label, { color: colors.color }]}>{tier.label}</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.iconBadge,
        { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, backgroundColor: colors.bg },
        style,
      ]}
    >
      <Ionicons name={tier.icon as any} size={iconSize} color={colors.color} />
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

export default TrustBadge;
