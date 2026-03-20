import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useVenueStore } from '../../store';
import { COLORS } from '../../constants';
import type { DealRedemption } from '../../types';

const DealRedemptionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { redemptionId } = route.params;

  const { activeRedemption, isLoading, fetchRedemption } = useVenueStore();
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchRedemption(redemptionId);
  }, [redemptionId]);

  useEffect(() => {
    if (!activeRedemption?.expires_at) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(activeRedemption.expires_at).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeRedemption?.expires_at]);

  const redemption = activeRedemption;
  const deal = redemption?.deal;
  const venue = deal?.venue;
  const isRedeemed = redemption?.status === 'redeemed';
  const isInactive = isExpired || isRedeemed;

  if (isLoading || !redemption) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Date Voucher</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Status badge */}
        <View style={[styles.statusBadge, isInactive && styles.statusBadgeInactive]}>
          <Ionicons
            name={isRedeemed ? 'checkmark-circle' : isExpired ? 'time' : 'pricetag'}
            size={16}
            color={isInactive ? COLORS.textSecondary : COLORS.secondary}
          />
          <Text style={[styles.statusText, isInactive && styles.statusTextInactive]}>
            {isRedeemed ? 'Redeemed' : isExpired ? 'Expired' : 'Active'}
          </Text>
        </View>

        {/* Venue & Deal info */}
        {venue && <Text style={styles.venueName}>{venue.name}</Text>}
        {deal && <Text style={styles.dealTitle}>{deal.title}</Text>}
        {deal && <Text style={styles.dealDescription}>{deal.description}</Text>}

        {/* QR Code */}
        <View style={[styles.qrContainer, isInactive && styles.qrContainerInactive]}>
          <QRCode
            value={redemption.redemption_code}
            size={200}
            backgroundColor={COLORS.background}
            color={isInactive ? COLORS.textSecondary : COLORS.text}
          />
        </View>

        {/* Redemption code */}
        <Text style={styles.codeLabel}>Redemption Code</Text>
        <Text style={[styles.code, isInactive && styles.codeInactive]}>
          {redemption.redemption_code}
        </Text>

        {/* Countdown */}
        {!isRedeemed && (
          <View style={styles.timerContainer}>
            <Ionicons
              name="time-outline"
              size={18}
              color={isExpired ? COLORS.error : COLORS.secondary}
            />
            <Text style={[styles.timerText, isExpired && styles.timerExpired]}>
              {timeLeft}
            </Text>
          </View>
        )}

        {/* Terms */}
        {deal?.terms && (
          <Text style={styles.terms}>{deal.terms}</Text>
        )}

        <Text style={styles.instructions}>
          Show this QR code or tell the code to your server to redeem your deal.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.secondary + '15',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusBadgeInactive: {
    backgroundColor: COLORS.surfaceVariant,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  statusTextInactive: {
    color: COLORS.textSecondary,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dealTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  dealDescription: {
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    marginBottom: 20,
  },
  qrContainerInactive: {
    borderColor: COLORS.border,
    opacity: 0.5,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  code: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 4,
    marginBottom: 16,
  },
  codeInactive: {
    color: COLORS.textSecondary,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
    fontVariant: ['tabular-nums'],
  },
  timerExpired: {
    color: COLORS.error,
  },
  terms: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  instructions: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DealRedemptionScreen;
