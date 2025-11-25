import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import { COLORS } from '../../constants';

const PhotosScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);

  const profileData = route.params?.profileData || {};

  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<(string | null)[]>(Array(9).fill(null));
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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
        setMainPhoto(photo.uri);
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
        galleryPhotos: galleryPhotos.filter(Boolean),
      },
    });
  };

  const filledPhotos = galleryPhotos.filter(Boolean).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '50%' }]} />
        </View>
        <Text style={styles.progressText}>Step 2 of 4</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Add your photos</Text>
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
                <Ionicons name="camera" size={20} color="#FFF" />
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mainPhotoPlaceholder}>
              <View style={styles.cameraIconContainer}>
                <Ionicons name="camera" size={48} color={COLORS.primary} />
              </View>
              <Text style={styles.placeholderText}>Take a photo</Text>
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
                    <Ionicons name="close" size={16} color="#FFF" />
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
        <Button
          title="Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.backButton}
        />
        <Button
          title="Next: Deal Breakers"
          onPress={handleNext}
          disabled={!mainPhoto}
          style={styles.nextButton}
        />
      </View>

      {/* Camera Modal */}
      <Modal visible={showCamera} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
          >
            <View style={[styles.cameraOverlay, { paddingTop: insets.top }]}>
              <TouchableOpacity
                style={styles.closeCamera}
                onPress={() => setShowCamera(false)}
              >
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={[styles.cameraControls, { paddingBottom: insets.bottom + 32 }]}>
              <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  retakeText: {
    color: '#FFF',
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    backgroundColor: '#FFF',
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
