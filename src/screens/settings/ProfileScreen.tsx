import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore, useProfileStore, usePhotoVerificationStore } from '../../store';
import { COLORS, calculateAge, cmToFeetInches } from '../../constants';
import VerificationBadge from '../../components/ui/VerificationBadge';
import type { ProfileVerificationStatus } from '../../types';

const ProfileScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const { checkPhotoExpiration } = usePhotoVerificationStore();

  const currentUser = profile || user;

  if (!currentUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const age = calculateAge(currentUser.birth_date);
  const height = cmToFeetInches(currentUser.height_cm);
  const verificationStatus: ProfileVerificationStatus = currentUser.photo_verification_status || 'unverified';
  const { isExpired, daysRemaining, showReminder } = checkPhotoExpiration();

  const MenuItem = ({ icon, label, onPress, showBadge, danger }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={20} color={danger ? COLORS.error : COLORS.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      <View style={styles.menuRight}>
        {showBadge && <View style={styles.badge} />}
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Planter</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Photo expiration banner */}
      {(isExpired || showReminder) && (
        <TouchableOpacity
          style={[styles.expirationBanner, isExpired ? styles.bannerExpired : styles.bannerReminder]}
          onPress={() => navigation.navigate('PhotoVerification')}
        >
          <Ionicons
            name={isExpired ? 'warning' : 'time-outline'}
            size={18}
            color={isExpired ? COLORS.error : COLORS.warning}
          />
          <Text style={[styles.bannerText, { color: isExpired ? COLORS.error : COLORS.warning }]}>
            {isExpired
              ? 'Photo expired. Take a new selfie.'
              : `Photo expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={isExpired ? COLORS.error : COLORS.warning} />
        </TouchableOpacity>
      )}

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.photoContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('EditPhotos', { editMode: true })}>
            <Image
              source={{ uri: currentUser.main_photo_url }}
              style={styles.mainPhoto}
            />
          </TouchableOpacity>
          <VerificationBadge
            status={verificationStatus}
            size="medium"
            style={styles.verificationBadge}
          />
        </View>

        <Text style={styles.profileName}>{currentUser.first_name}, {age}</Text>
        <Text style={styles.profileDetails}>
          {height} • {currentUser.location_city || 'Location not set'}
        </Text>

        {currentUser.bio && (
          <Text style={styles.bio} numberOfLines={2}>{currentUser.bio}</Text>
        )}

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentUser.match_count || 0}</Text>
          <Text style={styles.statLabel}>Connections</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {currentUser.response_rate ? `${Math.round(currentUser.response_rate * 100)}%` : '--'}
          </Text>
          <Text style={styles.statLabel}>Growth Rate</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{currentUser.photo_urls?.length || 0}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <MenuItem
          icon="person-outline"
          label="Edit Profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuItem
          icon="images-outline"
          label="Manage Photos"
          onPress={() => navigation.navigate('EditPhotos', { editMode: true })}
        />
        <MenuItem
          icon="options-outline"
          label="Deal Breakers"
          onPress={() => navigation.navigate('EditDealBreakers', { editMode: true })}
        />
        <MenuItem
          icon="settings-outline"
          label="Settings"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  mainPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  profileDetails: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight + '20',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 12,
  },
  menuSection: {
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuIconDanger: {
    backgroundColor: COLORS.error + '15',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  menuLabelDanger: {
    color: COLORS.error,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  expirationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerExpired: {
    backgroundColor: COLORS.error + '15',
  },
  bannerReminder: {
    backgroundColor: COLORS.warning + '15',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  verificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
});

export default ProfileScreen;
