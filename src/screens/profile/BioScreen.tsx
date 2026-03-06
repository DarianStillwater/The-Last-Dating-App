import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import { COLORS, APP_CONFIG } from '../../constants';
import { ONBOARDING_COPY } from '../../theme/plantMetaphors';

const BioScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { profileData, dealBreakers } = route.params || {};

  const [bio, setBio] = useState('');
  const [thingsToKnow, setThingsToKnow] = useState('');

  const handleNext = () => {
    navigation.navigate('Preview', {
      profileData: {
        ...profileData,
        bio: bio.trim() || null,
        things_to_know: thingsToKnow.trim() || null,
      },
      dealBreakers,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
        <Text style={styles.progressText}>Step 4 of 5</Text>
      </View>

      <View style={styles.contentArea}>
        <Text style={styles.title}>Tell your story</Text>
        <Text style={styles.subtitle}>
          Be authentic and mention specific interests — it helps people connect with you.
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
            placeholder={ONBOARDING_COPY.bio.placeholder}
            placeholderTextColor={COLORS.textLight}
            value={bio}
            onChangeText={(text) => setBio(text.slice(0, APP_CONFIG.MAX_BIO_LENGTH))}
            multiline
            numberOfLines={4}
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
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Preview Profile"
          onPress={handleNext}
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
  contentArea: {
    flex: 1,
    paddingHorizontal: 24,
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
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
    minHeight: 120,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  smallerTextArea: {
    minHeight: 80,
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
