import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { addDays } from 'date-fns';

import Button from '../../components/ui/Button';
import { COLORS, APP_CONFIG } from '../../constants';
import { usePhotoVerificationStore, useAuthStore, useProfileStore } from '../../store';
import { uploadPhotoFromUri, supabase } from '../../lib/supabase';
import type { PhotoDeviceMetadata } from '../../types';

type VerificationState = 'camera' | 'uploading' | 'done' | 'error';

const PhotoVerificationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);

  // Params are optional — screen can be navigated to with or without them
  const params = route.params as {
    photoUri?: string;
    isMain?: boolean;
    deviceMetadata?: PhotoDeviceMetadata;
    profileData?: Record<string, unknown>;
  } | undefined;

  const hasIncomingPhoto = !!params?.photoUri;

  const { uploadAndVerifyPhoto, error } = usePhotoVerificationStore();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [state, setState] = useState<VerificationState>(hasIncomingPhoto ? 'uploading' : 'camera');
  const [capturedUri, setCapturedUri] = useState<string | null>(params?.photoUri || null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If opened with an existing photo URI, verify immediately
  useEffect(() => {
    if (hasIncomingPhoto) {
      runVerification(params!.photoUri!, params?.deviceMetadata);
    }
  }, []);

  // Request camera permission if needed
  useEffect(() => {
    if (state === 'camera' && !cameraPermission?.granted) {
      requestCameraPermission();
    }
  }, [state]);

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      setCapturedUri(photo.uri);
      setState('uploading');
      await uploadNewMainPhoto(photo.uri);
    } catch {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadNewMainPhoto = async (uri: string) => {
    try {
      const userId = useAuthStore.getState().session?.user?.id;
      if (!userId) {
        setErrorMessage('Not authenticated.');
        setState('error');
        return;
      }

      const url = await uploadPhotoFromUri(
        'profile-photos',
        `${userId}/main_${Date.now()}.jpg`,
        uri,
      );

      if (!url) {
        setErrorMessage('Failed to upload photo. Please try again.');
        setState('error');
        return;
      }

      const expiresAt = addDays(new Date(), APP_CONFIG.PHOTO_EXPIRATION_DAYS).toISOString();
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({ main_photo_url: url, main_photo_expires_at: expiresAt })
        .eq('id', userId);

      if (updateError) {
        setErrorMessage(updateError.message);
        setState('error');
        return;
      }

      // Refresh the local profile store so photo expiration check reflects the new photo
      await useProfileStore.getState().fetchProfile();

      setState('done');

      // Fire off verification silently in the background
      const metadata: PhotoDeviceMetadata = {
        camera_facing: 'front',
        captured_at: new Date().toISOString(),
        capture_method: 'camera',
        on_device_face_detected: true,
        on_device_face_count: 1,
      };
      uploadAndVerifyPhoto(uri, true, metadata).catch(() => {});
    } catch (e: any) {
      setErrorMessage(e?.message || 'Something went wrong.');
      setState('error');
    }
  };

  // Legacy: verify a photo that was passed as a param (not used during setup anymore)
  const runVerification = async (uri: string, deviceMetadata?: PhotoDeviceMetadata) => {
    const metadata = deviceMetadata || {
      camera_facing: 'front' as const,
      captured_at: new Date().toISOString(),
      capture_method: 'camera' as const,
      on_device_face_detected: true,
      on_device_face_count: 1,
    };

    await uploadAndVerifyPhoto(uri, params?.isMain ?? true, metadata);
    setState('done');
  };

  const handleContinue = () => {
    if (params?.profileData) {
      navigation.navigate('DealBreakers', { profileData: params.profileData });
    } else {
      navigation.goBack();
    }
  };

  // Camera view — when navigated without a photo
  if (state === 'camera') {
    if (!cameraPermission?.granted) {
      return (
        <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
          <Ionicons name="camera-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.statusTitle}>Camera Permission Required</Text>
          <Text style={styles.statusSubtitle}>Please enable camera access to update your photo.</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: 24 }} />
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="front" />
        <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.surface} />
          </TouchableOpacity>
          <Text style={styles.cameraTitle}>Take a new selfie</Text>
        </View>
        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}>
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      {/* Photo preview */}
      {capturedUri && (
        <View style={styles.photoContainer}>
          <Image source={{ uri: capturedUri }} style={styles.photo} />
          {state === 'uploading' && (
            <View style={styles.photoOverlay}>
              <ActivityIndicator size="large" color={COLORS.surface} />
            </View>
          )}
        </View>
      )}

      {/* Status */}
      <View style={styles.statusContainer}>
        {state === 'uploading' && (
          <>
            <ActivityIndicator size="small" color={COLORS.primary} style={styles.spinner} />
            <Text style={styles.statusTitle}>Saving your photo...</Text>
            <Text style={styles.statusSubtitle}>This will only take a moment.</Text>
          </>
        )}

        {state === 'done' && (
          <>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.statusTitle}>Photo updated!</Text>
            <Text style={styles.statusSubtitle}>
              Your photo has been saved and will be visible for 30 days.
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
              {errorMessage || error || "We couldn't save your photo. Please try again."}
            </Text>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        {state === 'done' && (
          <Button title="Continue" onPress={handleContinue} style={styles.button} />
        )}
        {state === 'error' && (
          <Button title="Try Again" onPress={() => setState('camera')} style={styles.button} />
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: COLORS.text,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
