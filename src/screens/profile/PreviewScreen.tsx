import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { useProfileStore } from '../../store';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHOTO_HEIGHT = 350;

const PreviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { createProfile, updateDealBreakers, uploadMainPhoto, uploadGalleryPhoto } = useProfileStore();

  const { profileData, dealBreakers } = route.params || {};
  const [isCreating, setIsCreating] = useState(false);

  const getLabel = (options: { value: string; label: string }[], value: string) =>
    options.find((o) => o.value === value)?.label || value;

  const handleCreateProfile = async () => {
    setIsCreating(true);
    try {
      const { url: mainPhotoUrl, error: photoError } = await uploadMainPhoto(profileData.mainPhoto);
      if (photoError) {
        Alert.alert('Error', 'Failed to upload main photo. Please try again.');
        setIsCreating(false);
        return;
      }

      const galleryUrls: string[] = [];
      for (let i = 0; i < (profileData.galleryPhotos || []).length; i++) {
        const { url } = await uploadGalleryPhoto(profileData.galleryPhotos[i], i);
        if (url) galleryUrls.push(url);
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
        photo_urls: galleryUrls,
      });

      if (profileError) {
        Alert.alert('Error', profileError);
        setIsCreating(false);
        return;
      }

      await updateDealBreakers(dealBreakers);
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsCreating(false);
    }
  };

  const age = calculateAge(profileData.birth_date);

  const renderDetailRow = (label: string, value?: string | null) => {
    if (!value) return null;
    return (
      <View style={styles.detailRow} key={label}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile Preview</Text>
        <Text style={styles.headerSubtitle}>This is how others will see you</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Photo */}
        {profileData.mainPhoto ? (
          <Image
            source={{ uri: profileData.mainPhoto }}
            style={styles.mainPhoto}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.mainPhoto, styles.photoPlaceholder]}>
            <Ionicons name="person" size={64} color={COLORS.textSecondary} />
          </View>
        )}

        {/* Name & Age */}
        <View style={styles.card}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profileData.first_name}</Text>
            <Text style={styles.age}>, {age}</Text>
          </View>
          <Text style={styles.height}>{cmToFeetInches(profileData.height_cm)}</Text>
        </View>

        {/* About */}
        {profileData.bio && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardText}>{profileData.bio}</Text>
          </View>
        )}

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Details</Text>
          {renderDetailRow('Gender', getLabel(GENDER_OPTIONS, profileData.gender))}
          {renderDetailRow('Ethnicity', getLabel(ETHNICITY_OPTIONS, profileData.ethnicity))}
          {renderDetailRow('Religion', getLabel(RELIGION_OPTIONS, profileData.religion))}
          {renderDetailRow('Children', getLabel(OFFSPRING_OPTIONS, profileData.offspring))}
          {renderDetailRow('Smoking', getLabel(SMOKER_OPTIONS, profileData.smoker))}
          {renderDetailRow('Drinking', getLabel(ALCOHOL_OPTIONS, profileData.alcohol))}
          {renderDetailRow('Drugs', getLabel(DRUGS_OPTIONS, profileData.drugs))}
          {renderDetailRow('Diet', getLabel(DIET_OPTIONS, profileData.diet))}
          {renderDetailRow('Occupation', profileData.occupation)}
          {renderDetailRow('Income', profileData.income ? getLabel(INCOME_OPTIONS, profileData.income) : null)}
        </View>

        {/* Things to Know */}
        {profileData.things_to_know && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Things to Know</Text>
            <Text style={styles.cardText}>{profileData.things_to_know}</Text>
          </View>
        )}

        {/* Gallery Preview */}
        {profileData.galleryPhotos && profileData.galleryPhotos.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gallery ({profileData.galleryPhotos.length} photos)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
              {profileData.galleryPhotos.map((uri: string, idx: number) => (
                <Image key={idx} source={{ uri }} style={styles.galleryThumb} resizeMode="cover" />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

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
          title="Looks Good!"
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
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  mainPhoto: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
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
  height: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
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
  galleryScroll: {
    marginTop: 8,
  },
  galleryThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 8,
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
