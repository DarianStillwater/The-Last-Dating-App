import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import { useProfileStore } from '../../store';
import { COLORS, APP_CONFIG } from '../../constants';

const BioScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { createProfile, updateDealBreakers, uploadMainPhoto, uploadGalleryPhoto, isLoading } = useProfileStore();

  const { profileData, dealBreakers } = route.params || {};

  const [bio, setBio] = useState('');
  const [thingsToKnow, setThingsToKnow] = useState('');

  const handleFinish = async () => {
    try {
      // Upload main photo first
      const { url: mainPhotoUrl, error: photoError } = await uploadMainPhoto(profileData.mainPhoto);
      if (photoError) {
        Alert.alert('Error', 'Failed to upload main photo. Please try again.');
        return;
      }

      // Upload gallery photos
      const galleryUrls: string[] = [];
      for (let i = 0; i < profileData.galleryPhotos.length; i++) {
        const { url } = await uploadGalleryPhoto(profileData.galleryPhotos[i], i);
        if (url) galleryUrls.push(url);
      }

      // Create profile
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
        bio: bio.trim() || null,
        things_to_know: thingsToKnow.trim() || null,
        main_photo_url: mainPhotoUrl,
        photo_urls: galleryUrls,
      });

      if (profileError) {
        Alert.alert('Error', profileError);
        return;
      }

      // Save deal breakers
      await updateDealBreakers(dealBreakers);

      // Profile is complete - navigation will automatically switch to main app
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 4</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tell your story</Text>
        <Text style={styles.subtitle}>
          Help others get to know you. What makes you unique?
        </Text>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>About Me</Text>
            <Text style={styles.charCount}>
              {bio.length}/{APP_CONFIG.MAX_BIO_LENGTH}
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Share a bit about yourself, your interests, what you're looking for..."
            placeholderTextColor={COLORS.textLight}
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, APP_CONFIG.MAX_BIO_LENGTH))}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Things to know */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Things I want you to know</Text>
            <Text style={styles.charCount}>
              {thingsToKnow.length}/{APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH}
            </Text>
          </View>
          <TextInput
            style={[styles.textArea, styles.smallerTextArea]}
            placeholder="Anything important to mention upfront..."
            placeholderTextColor={COLORS.textLight}
            value={thingsToKnow}
            onChangeText={(text) => setThingsToKnow(text.slice(0, APP_CONFIG.MAX_THINGS_TO_KNOW_LENGTH))}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>💡 Tips for a great bio</Text>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Be authentic - show your real personality</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Mention specific interests and hobbies</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Share what you're looking for in a connection</Text>
          </View>
          <View style={styles.tip}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>Keep it positive and engaging</Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Complete Profile"
          onPress={handleFinish}
          loading={isLoading}
          style={styles.nextButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  textArea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 150,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  smallerTextArea: {
    minHeight: 100,
  },
  tipsContainer: {
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
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

export default BioScreen;
