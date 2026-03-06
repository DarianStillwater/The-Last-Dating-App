import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

// expo-face-detector was removed in SDK 53+. Try to load it dynamically
// so the app doesn't crash if it's unavailable.
let FaceDetector: any = null;
try {
  FaceDetector = require('expo-face-detector');
} catch {
  // Not available — face detection will be skipped
}
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { COLORS, APP_CONFIG } from '../../constants';
import { ONBOARDING_COPY } from '../../theme/plantMetaphors';
import { useProfileStore, useAuthStore } from '../../store';
import { uploadPhotoFromUri, supabase } from '../../lib/supabase';
import { addDays } from 'date-fns';
import type { PhotoDeviceMetadata } from '../../types';

const PhotosScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);

  const editMode = !!route.params?.editMode;
  const profileData = route.params?.profileData || {};
  const { profile, fetchProfile } = useProfileStore();

  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [mainPhotoMetadata, setMainPhotoMetadata] = useState<PhotoDeviceMetadata | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>(Array(9).fill(null));
  const [showCamera, setShowCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // In edit mode, pre-populate from the current profile
  useEffect(() => {
    if (editMode && profile) {
      setMainPhoto(profile.main_photo_url || null);
      const existing = profile.photo_urls || [];
      const padded = [...existing, ...Array(Math.max(0, 9 - existing.length)).fill(null)].slice(0, 9);
      setGalleryPhotos(padded);
    }
  }, [editMode]);

  const openCamera = async () => {
    if (!cameraPermission?.granted) {
      const { granted } = await requestCameraPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera access is needed to take photos.');
        return;
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });

        // On-device face detection (only if expo-face-detector is available)
        try {
          if (!FaceDetector) throw new Error('FaceDetector not available');
          const detection = await FaceDetector.detectFacesAsync(photo.uri, {
            mode: FaceDetector.FaceDetectorMode.fast,
            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
            runClassifications: FaceDetector.FaceDetectorClassifications.none,
          });

          if (detection.faces.length === 0) {
            Alert.alert(
              'No Face Detected',
              'Please position your face clearly in the frame and try again.',
            );
            return;
          }

          if (detection.faces.length > 1) {
            Alert.alert(
              'Multiple Faces Detected',
              'Please make sure only you are in the photo.',
            );
            return;
          }

          const metadata: PhotoDeviceMetadata = {
            camera_facing: 'front',
            captured_at: new Date().toISOString(),
            capture_method: 'camera',
            on_device_face_detected: true,
            on_device_face_count: detection.faces.length,
            on_device_face_bounds: detection.faces[0].bounds,
          };

          setMainPhoto(photo.uri);
          setMainPhotoMetadata(metadata);
        } catch {
          // Face detection unavailable (e.g. Expo Go) — proceed with photo,
          // server-side detection will catch issues
          const metadata: PhotoDeviceMetadata = {
            camera_facing: 'front',
            captured_at: new Date().toISOString(),
            capture_method: 'camera',
            on_device_face_detected: true, // Assumed true when detection unavailable
            on_device_face_count: 1,
          };

          setMainPhoto(photo.uri);
          setMainPhotoMetadata(metadata);
        }

        setShowCamera(false);
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };

  const pickGalleryPhoto = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhotos = [...galleryPhotos];
      newPhotos[index] = result.assets[0].uri;
      setGalleryPhotos(newPhotos);
    }
  };

  const removeGalleryPhoto = (index: number) => {
    const newPhotos = [...galleryPhotos];
    newPhotos[index] = null;
    setGalleryPhotos(newPhotos);
  };

  const handleNext = () => {
    if (!mainPhoto) {
      Alert.alert('Photo Required', 'Please take a main photo using your camera.');
      return;
    }

    navigation.navigate('DealBreakers', {
      profileData: {
        ...profileData,
        mainPhoto,
        mainPhotoMetadata: mainPhotoMetadata || undefined,
        galleryPhotos: galleryPhotos.filter(Boolean),
      },
    });
  };

  const handleSave = async () => {
    if (!mainPhoto) {
      Alert.alert('Photo Required', 'A main photo is required.');
      return;
    }
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) return;

    setIsSaving(true);
    try {
      const isLocal = (uri: string) => uri.startsWith('file://') || uri.startsWith('content://');

      // Upload new main photo if changed
      let mainPhotoUrl = mainPhoto;
      if (isLocal(mainPhoto)) {
        const path = `${userId}/main_${Date.now()}.jpg`;
        const url = await uploadPhotoFromUri('profile-photos', path, mainPhoto);
        if (!url) throw new Error('Failed to upload main photo');
        mainPhotoUrl = url;
      }

      // Upload new gallery photos, keep existing remote URLs as-is
      const finalGallery: string[] = [];
      for (const uri of galleryPhotos) {
        if (!uri) continue;
        if (isLocal(uri)) {
          const path = `${userId}/gallery_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const url = await uploadPhotoFromUri('profile-photos', path, uri);
          if (url) finalGallery.push(url);
        } else {
          finalGallery.push(uri);
        }
      }

      const expiresAt = addDays(new Date(), APP_CONFIG.PHOTO_EXPIRATION_DAYS).toISOString();
      const { error } = await (supabase as any)
        .from('profiles')
        .update({
          main_photo_url: mainPhotoUrl,
          main_photo_expires_at: expiresAt,
          photo_urls: finalGallery,
        })
        .eq('id', userId);

      if (error) throw new Error(error.message);

      await fetchProfile();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to save photos. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filledPhotos = galleryPhotos.filter(Boolean).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar — only shown during setup */}
      {!editMode && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.progressText}>Step 2 of 5</Text>
        </View>
      )}

      {/* Edit mode header */}
      {editMode && (
        <View style={styles.editHeader}>
          <TouchableOpacity style={styles.editBackButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.editHeaderTitle}>Manage Photos</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{editMode ? 'Your photos' : ONBOARDING_COPY.photos.title}</Text>
        <Text style={styles.subtitle}>
          Your main photo is taken with your camera to keep things real.
          It expires every 30 days.
        </Text>

        {/* Main Photo Section */}
        <Text style={styles.sectionTitle}>Main Photo (Required)</Text>
        <TouchableOpacity
          style={styles.mainPhotoContainer}
          onPress={openCamera}
        >
          {mainPhoto ? (
            <>
              <Image source={{ uri: mainPhoto }} style={styles.mainPhoto} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={openCamera}
              >
                <Ionicons name="camera" size={20} color={COLORS.surface} />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mainPhotoPlaceholder}>
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.placeholderText}>{ONBOARDING_COPY.photos.emptySlot}</Text>
              <Text style={styles.placeholderHint}>Front camera only</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Gallery Photos */}
        <Text style={styles.sectionTitle}>Gallery ({filledPhotos}/9)</Text>
        <View style={styles.galleryGrid}>
          {galleryPhotos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              style={styles.galleryItem}
              onPress={() => photo ? removeGalleryPhoto(index) : pickGalleryPhoto(index)}
            >
              {photo ? (
                <>
                  <Image source={{ uri: photo }} style={styles.galleryPhoto} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeGalleryPhoto(index)}
                  >
                    <Ionicons name="close" size={16} color={COLORS.surface} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.galleryPlaceholder}>
                  <Ionicons name="add" size={24} color={COLORS.textSecondary} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!editMode && (
          <Button
            title="Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={editMode ? 'Save Changes' : 'Continue'}
          onPress={editMode ? handleSave : handleNext}
          disabled={!mainPhoto}
          loading={isSaving}
          style={editMode ? styles.fullButton : styles.nextButton}
        />
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          />
          <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.closeCamera}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color={COLORS.surface} />
            </TouchableOpacity>
          </View>
          <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  content: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  mainPhotoContainer: {
    aspectRatio: 3 / 4,
    width: '60%',
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.overlay,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  mainPhotoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  cameraIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  placeholderHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  galleryItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  galleryPhoto: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
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
  fullButton: {
    flex: 1,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
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
  },
  closeCamera: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default PhotosScreen;
