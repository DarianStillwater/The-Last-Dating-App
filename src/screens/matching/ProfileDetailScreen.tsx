import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, Dimensions, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from '../../lib/supabase';
import VerificationBadge from '../../components/ui/VerificationBadge';
import {
  COLORS,
  calculateAge,
  cmToFeetInches,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  OFFSPRING_OPTIONS,
  SMOKER_OPTIONS,
  ALCOHOL_OPTIONS,
  DRUGS_OPTIONS,
  DIET_OPTIONS,
  INCOME_OPTIONS,
  GENDER_OPTIONS,
} from '../../constants';
import type { UserProfile } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 400;

const ProfileDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList<string>>(null);

  useEffect(() => {
    fetchProfile();
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

  const renderDetailRow = (label: string, value: string | undefined | null): React.ReactNode => {
    if (!value) return null;
    return (
      <View style={styles.detailRow} key={label}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  const renderPhotoItem = ({ item }: { item: string }) => {
    return (
      <View style={styles.photoContainer}>
        <Image source={{ uri: item }} style={styles.photo} resizeMode="cover" />
      </View>
    );
  };

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

  const genderLabel = GENDER_OPTIONS.find((o) => o.value === profile.gender)?.label;
  const ethnicityLabel = ETHNICITY_OPTIONS.find((o) => o.value === profile.ethnicity)?.label;
  const religionLabel = RELIGION_OPTIONS.find((o) => o.value === profile.religion)?.label;
  const offspringLabel = OFFSPRING_OPTIONS.find((o) => o.value === profile.offspring)?.label;
  const smokerLabel = SMOKER_OPTIONS.find((o) => o.value === profile.smoker)?.label;
  const alcoholLabel = ALCOHOL_OPTIONS.find((o) => o.value === profile.alcohol)?.label;
  const drugsLabel = DRUGS_OPTIONS.find((o) => o.value === profile.drugs)?.label;
  const dietLabel = DIET_OPTIONS.find((o) => o.value === profile.diet)?.label;
  const incomeLabel = profile.income
    ? INCOME_OPTIONS.find((o) => o.value === profile.income)?.label
    : undefined;

  const locationText =
    profile.location_city && profile.location_state
      ? `${profile.location_city}, ${profile.location_state}`
      : profile.location_city || profile.location_state || undefined;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          {/* Page Indicators */}
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

        {/* Profile Info Section */}
        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.first_name}</Text>
            <Text style={styles.age}>, {age}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="resize-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{heightDisplay}</Text>
          </View>
          <View style={styles.infoRow}>
            <VerificationBadge
              status={profile.photo_verification_status}
              size="small"
              showLabel
            />
          </View>
          {locationText && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{locationText}</Text>
            </View>
          )}
        </View>

        {/* About Section */}
        {profile.bio ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Details Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          {renderDetailRow('Gender', genderLabel)}
          {renderDetailRow('Ethnicity', ethnicityLabel)}
          {renderDetailRow('Religion', religionLabel)}
          {renderDetailRow('Children', offspringLabel)}
          {renderDetailRow('Smoking', smokerLabel)}
          {renderDetailRow('Drinking', alcoholLabel)}
          {renderDetailRow('Drugs', drugsLabel)}
          {renderDetailRow('Diet', dietLabel)}
          {renderDetailRow('Occupation', profile.occupation)}
          {renderDetailRow('Income', incomeLabel)}
        </View>

        {/* Things to Know Section */}
        {profile.things_to_know ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Things to Know</Text>
            <Text style={styles.bioText}>{profile.things_to_know}</Text>
          </View>
        ) : null}

        {/* Bottom spacer for safe area */}
        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>

      {/* Close Button (overlay) */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 12,
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default ProfileDetailScreen;
