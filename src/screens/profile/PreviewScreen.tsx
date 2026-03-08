import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useProfileStore, usePhotoVerificationStore, useAuthStore, useCommunityDealBreakerStore } from '../../store';
import { uploadPhotoFromUri } from '../../lib/supabase';
import * as Location from 'expo-location';
import { addDays } from 'date-fns';
import {
  COLORS,
  APP_CONFIG,
  calculateAge,
  cmToFeetInches,
  ETHNICITY_OPTIONS,
  RELIGION_OPTIONS,
  GENDER_OPTIONS,
} from '../../constants';
import { ONBOARDING_COPY } from '../../theme/plantMetaphors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 220;

const PreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { createProfile, updateDealBreakers } = useProfileStore();

  const { profileData, dealBreakers, communityDealBreakerAnswers } = route.params || {};
  const [isCreating, setIsCreating] = useState(false);

  const getLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label || value;

  const handleCreateProfile = async () => {
    setIsCreating(true);
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) {
        Alert.alert('Error', 'Not authenticated. Please sign in again.');
        setIsCreating(false);
        return;
      }

      const mainPhotoUrl = await uploadPhotoFromUri(
        'profile-photos',
        `${userId}/main_${Date.now()}.jpg`,
        profileData.mainPhoto,
      );
      if (!mainPhotoUrl) {
        Alert.alert('Error', 'Failed to upload main photo. Please try again.');
        setIsCreating(false);
        return;
      }

      const galleryUrls: string[] = [];
      for (let i = 0; i < (profileData.galleryPhotos || []).length; i++) {
        const galUrl = await uploadPhotoFromUri(
          'profile-photos',
          `${userId}/gallery_${i}_${Date.now()}.jpg`,
          profileData.galleryPhotos[i],
        );
        if (galUrl) galleryUrls.push(galUrl);
      }

      const { error: profileError } = await createProfile({
        first_name: profileData.first_name,
        birth_date: profileData.birth_date,
        gender: profileData.gender,
        looking_for: profileData.looking_for,
        height_cm: profileData.height_cm,
        ethnicity: profileData.ethnicity,
        religion: profileData.religion,
        offspring: profileData.offspring,
        smoker: profileData.smoker,
        alcohol: profileData.alcohol,
        drugs: profileData.drugs,
        diet: profileData.diet,
        occupation: profileData.occupation,
        income: profileData.income,
        bio: profileData.bio,
        things_to_know: profileData.things_to_know,
        main_photo_url: mainPhotoUrl,
        main_photo_expires_at: addDays(new Date(), APP_CONFIG.PHOTO_EXPIRATION_DAYS).toISOString(),
        photo_urls: galleryUrls,
      });

      if (profileError) {
        Alert.alert('Error', profileError);
        setIsCreating(false);
        return;
      }

      await updateDealBreakers(dealBreakers);

      // Save community dealbreaker answers if any
      if (communityDealBreakerAnswers && communityDealBreakerAnswers.length > 0) {
        await useCommunityDealBreakerStore.getState().saveAnswersAndPreferences(communityDealBreakerAnswers);
      }

      if (profileData.mainPhoto && profileData.mainPhotoMetadata) {
        usePhotoVerificationStore.getState().uploadAndVerifyPhoto(
          profileData.mainPhoto,
          true,
          profileData.mainPhotoMetadata,
        ).catch(() => {});
      }

      Location.requestForegroundPermissionsAsync().then(async ({ status }) => {
        if (status !== 'granted') return;
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          useProfileStore.getState().updateLocation(
            loc.coords.latitude,
            loc.coords.longitude,
            geo?.city || undefined,
            geo?.region || undefined,
          );
        } catch {}
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsCreating(false);
    }
  };

  const age = calculateAge(profileData.birth_date);
  const genderLabel = getLabel(GENDER_OPTIONS, profileData.gender);
  const ethnicityLabel = getLabel(ETHNICITY_OPTIONS, profileData.ethnicity);
  const religionLabel = getLabel(RELIGION_OPTIONS, profileData.religion);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Step 5 of 5</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <Text style={styles.headerSubtitle}>This is how others will see you</Text>
      </View>

      <View style={styles.contentArea}>
        {/* Main Photo with overlay */}
        <View style={styles.photoWrapper}>
          {profileData.mainPhoto ? (
            <Image
              source={{ uri: profileData.mainPhoto }}
              style={styles.mainPhoto}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.mainPhoto, styles.photoPlaceholder]}>
              <Ionicons name="person" size={48} color={COLORS.textSecondary} />
            </View>
          )}
          <View style={styles.photoOverlay}>
            <Text style={styles.overlayName}>{profileData.first_name}, {age}</Text>
            <Text style={styles.overlayHeight}>{cmToFeetInches(profileData.height_cm)}</Text>
          </View>
        </View>

        {/* Bio snippet */}
        {profileData.bio ? (
          <View style={styles.bioCard}>
            <Text style={styles.bioText} numberOfLines={2}>{profileData.bio}</Text>
          </View>
        ) : null}

        {/* Key detail chips */}
        <View style={styles.detailChips}>
          <View style={styles.detailChip}>
            <Text style={styles.chipLabel}>{genderLabel}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.chipLabel}>{ethnicityLabel}</Text>
          </View>
          <View style={styles.detailChip}>
            <Text style={styles.chipLabel}>{religionLabel}</Text>
          </View>
        </View>

        {/* Gallery thumbnails */}
        {profileData.galleryPhotos && profileData.galleryPhotos.length > 0 && (
          <View style={styles.galleryRow}>
            {profileData.galleryPhotos.slice(0, 4).map((uri: string, idx: number) => (
              <Image key={idx} source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
            ))}
            {profileData.galleryPhotos.length > 4 && (
              <View style={[styles.galleryThumb, styles.morePhotos]}>
                <Text style={styles.morePhotosText}>+{profileData.galleryPhotos.length - 4}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
          disabled={isCreating}
        />
        <Button
          title={ONBOARDING_COPY.preview.button}
          onPress={handleCreateProfile}
          loading={isCreating}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  photoWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  mainPhoto: {
    width: '100%',
    height: PHOTO_HEIGHT,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  overlayHeight: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bioCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  detailChips: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  detailChip: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  galleryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  galleryThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  morePhotos: {
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

export default PreviewScreen;
