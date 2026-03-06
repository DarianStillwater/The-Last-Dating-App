import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import { useTrustStore } from '../../store';
import VerificationBadge from '../../components/ui/VerificationBadge';
import TrustBadge from '../../components/ui/TrustBadge';
import {
  COLORS,
  TRUST_CONFIG,
  calculateAge,
  cmToFeetInches,
} from '../../constants';
import type { UserProfile, ReviewSummary, SocialLink } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 320;

const ProfileDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [vouchCount, setVouchCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const { fetchUserTrust } = useTrustStore();

  const flatListRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    fetchProfile();
    fetchUserTrust(userId).then((data) => {
      setVouchCount(data.vouchCount);
      setReviewCount(data.reviewSummary?.total_reviews || 0);
      setSocialLinks(data.socialLinks);
    });
  }, [userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setProfile(data as UserProfile);
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAllPhotos = (): string[] => {
    if (!profile) return [];
    const photos: string[] = [];
    if (profile.main_photo_url) {
      photos.push(profile.main_photo_url);
    }
    if (profile.photo_urls && profile.photo_urls.length > 0) {
      for (const url of profile.photo_urls) {
        if (url !== profile.main_photo_url) {
          photos.push(url);
        }
      }
    }
    return photos;
  };

  const onPhotoScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setActivePhotoIndex(index);
  };

  const renderPhotoItem = ({ item }: { item: string }) => (
    <View style={styles.photoContainer}>
      <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photos = getAllPhotos();
  const age = calculateAge(profile.birth_date);
  const heightDisplay = cmToFeetInches(profile.height_cm);

  const locationText =
    profile.location_city && profile.location_state
      ? `${profile.location_city}, ${profile.location_state}`
      : profile.location_city || profile.location_state || undefined;

  return (
    <View style={styles.container}>
      {/* Photo Carousel */}
      <View style={styles.carouselContainer}>
        {photos.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={photos}
            renderItem={renderPhotoItem}
            keyExtractor={(item, index) => `photo-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
          />
        ) : (
          <View style={styles.noPhotoContainer}>
            <Ionicons name="person-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.noPhotoText}>No photos available</Text>
          </View>
        )}

        {photos.length > 1 && (
          <View style={styles.pageIndicatorContainer}>
            {photos.map((_, index) => (
              <View
                key={`dot-${index}`}
                style={[
                  styles.pageIndicatorDot,
                  index === activePhotoIndex
                    ? styles.pageIndicatorDotActive
                    : styles.pageIndicatorDotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Profile Info */}
      <View style={styles.infoArea}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.first_name}</Text>
          <Text style={styles.age}>, {age}</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.infoChip}>
            <Ionicons name="resize-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.infoChipText}>{heightDisplay}</Text>
          </View>
          {locationText && (
            <View style={styles.infoChip}>
              <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.infoChipText}>{locationText}</Text>
            </View>
          )}
          <VerificationBadge
            status={profile.photo_verification_status}
            size="small"
            showLabel
          />
          <TrustBadge
            vouchCount={vouchCount}
            reviewCount={reviewCount}
            size="small"
            showLabel
          />
          {profile.phone_verified && (
            <View style={styles.infoChip}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.infoChipText}>Phone</Text>
            </View>
          )}
          {socialLinks.filter(l => l.verified).map((link) => (
            <View key={link.provider} style={styles.infoChip}>
              <Ionicons
                name={link.provider === 'instagram' ? 'logo-instagram' : 'logo-linkedin'}
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.infoChipText}>{link.provider === 'instagram' ? 'IG' : 'LinkedIn'}</Text>
            </View>
          ))}
        </View>

        {profile.bio ? (
          <Text style={styles.bioText} numberOfLines={3}>{profile.bio}</Text>
        ) : null}

        <TouchableOpacity
          style={styles.seeMoreButton}
          onPress={() => navigation.navigate('ProfileDetails', { userId: profile.id })}
        >
          <Text style={styles.seeMoreText}>See More Details</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.closeButton, { top: insets.top + 8 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Ionicons name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: COLORS.surfaceVariant,
  },
  photoContainer: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  noPhotoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPhotoText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  pageIndicatorDotActive: {
    backgroundColor: COLORS.surface,
  },
  pageIndicatorDotInactive: {
    backgroundColor: COLORS.surface,
    opacity: 0.5,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
  infoArea: {
    flex: 1,
    padding: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  age: {
    fontSize: 28,
    fontWeight: '300',
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  infoChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 'auto',
  },
  seeMoreText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ProfileDetailScreen;
