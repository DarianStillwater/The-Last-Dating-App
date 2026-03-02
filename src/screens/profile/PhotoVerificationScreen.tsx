import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { COLORS, MODERATION_REJECTION_REASONS } from '../../constants';
import { usePhotoVerificationStore } from '../../store';
import type { PhotoDeviceMetadata, PhotoVerificationResponse } from '../../types';

type VerificationState = 'uploading' | 'verifying' | 'approved' | 'rejected' | 'needs_review' | 'error';

const PhotoVerificationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { photoUri, isMain, deviceMetadata, profileData } = route.params as {
    photoUri: string;
    isMain: boolean;
    deviceMetadata: PhotoDeviceMetadata;
    profileData?: Record<string, unknown>;
  };

  const { uploadAndVerifyPhoto, isUploading, isVerifying, error } = usePhotoVerificationStore();

  const [state, setState] = useState<VerificationState>('uploading');
  const [result, setResult] = useState<PhotoVerificationResponse | null>(null);

  useEffect(() => {
    runVerification();
  }, []);

  useEffect(() => {
    if (isUploading) setState('uploading');
    else if (isVerifying) setState('verifying');
  }, [isUploading, isVerifying]);

  const runVerification = async () => {
    const { result: verifyResult, error: verifyError } = await uploadAndVerifyPhoto(
      photoUri,
      isMain,
      deviceMetadata,
    );

    if (verifyError && !verifyResult) {
      setState('error');
      return;
    }

    if (verifyResult) {
      setResult(verifyResult);
      setState(verifyResult.status === 'approved' ? 'approved'
        : verifyResult.status === 'needs_review' ? 'needs_review'
        : 'rejected');
    }
  };

  const handleContinue = () => {
    if (profileData) {
      // During profile setup — go to DealBreakers
      navigation.navigate('DealBreakers', { profileData });
    } else {
      // From settings — go back
      navigation.goBack();
    }
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  const getRejectionMessage = () => {
    const reason = result?.rejection_reason || error || '';
    return MODERATION_REJECTION_REASONS[reason] || reason || 'Your photo could not be verified. Please try again.';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      {/* Photo preview */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: photoUri }} style={styles.photo} />
        {(state === 'uploading' || state === 'verifying') && (
          <View style={styles.photoOverlay}>
            <ActivityIndicator size="large" color="#FFF" />
          </View>
        )}
      </View>

      {/* Status section */}
      <View style={styles.statusContainer}>
        {state === 'uploading' && (
          <>
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.statusTitle}>Uploading your photo...</Text>
            <Text style={styles.statusSubtitle}>This will only take a moment.</Text>
          </>
        )}

        {state === 'verifying' && (
          <>
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.statusTitle}>Verifying your photo...</Text>
            <Text style={styles.statusSubtitle}>
              We're checking that everything looks good.
            </Text>
          </>
        )}

        {state === 'approved' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.statusTitle}>Photo verified!</Text>
            <Text style={styles.statusSubtitle}>
              Your photo has been approved. It will be visible for 30 days.
            </Text>
          </>
        )}

        {state === 'rejected' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.error + '20' }]}>
              <Ionicons name="close-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.statusTitle}>Photo not accepted</Text>
            <Text style={styles.statusSubtitle}>{getRejectionMessage()}</Text>
          </>
        )}

        {state === 'needs_review' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.warning + '20' }]}>
              <Ionicons name="time" size={48} color={COLORS.warning} />
            </View>
            <Text style={styles.statusTitle}>Under review</Text>
            <Text style={styles.statusSubtitle}>
              Your photo is being reviewed by our team. This usually takes less than 24 hours.
              You can continue using the app in the meantime.
            </Text>
          </>
        )}

        {state === 'error' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.error + '20' }]}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            </View>
            <Text style={styles.statusTitle}>Something went wrong</Text>
            <Text style={styles.statusSubtitle}>
              {error || 'We couldn\'t verify your photo. Please try again.'}
            </Text>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        {state === 'approved' && (
          <Button title="Continue" onPress={handleContinue} style={styles.button} />
        )}

        {state === 'needs_review' && (
          <Button title="Continue" onPress={handleContinue} style={styles.button} />
        )}

        {(state === 'rejected' || state === 'error') && (
          <Button title="Try Again" onPress={handleRetry} style={styles.button} />
        )}
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
  photoContainer: {
    width: '60%',
    aspectRatio: 3 / 4,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  footer: {
    paddingTop: 16,
  },
  button: {
    width: '100%',
  },
});

export default PhotoVerificationScreen;
