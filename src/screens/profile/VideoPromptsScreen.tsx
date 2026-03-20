import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useProfileStore } from '../../store';
import { COLORS, APP_CONFIG, VIDEO_PROMPT_OPTIONS } from '../../constants';
import Button from '../../components/ui/Button';
import type { VideoPrompt } from '../../types';

const VideoPromptsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { videoPrompts, isLoading, fetchVideoPrompts, uploadVideoPrompt, deleteVideoPrompt } = useProfileStore();

  const [selectedPromptKey, setSelectedPromptKey] = useState<string | null>(null);

  useEffect(() => {
    fetchVideoPrompts();
  }, []);

  const introVideo = videoPrompts.find((v) => !v.prompt_key);
  const promptVideos = videoPrompts.filter((v) => v.prompt_key);
  const canAddMore = videoPrompts.length < APP_CONFIG.MAX_VIDEO_PROMPTS;

  const handleRecord = async (promptKey?: string) => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: APP_CONFIG.VIDEO_MAX_DURATION_SECONDS,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const duration = Math.ceil((asset.duration || 0) / 1000);

    if (duration <= 0) {
      Alert.alert('Error', 'Could not determine video duration.');
      return;
    }

    const { error } = await uploadVideoPrompt(asset.uri, duration, promptKey);
    if (error) {
      Alert.alert('Upload Error', error);
    }
  };

  const handleDelete = (prompt: VideoPrompt) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVideoPrompt(prompt.id),
        },
      ]
    );
  };

  const renderVideoCard = (prompt: VideoPrompt) => (
    <View key={prompt.id} style={styles.videoCard}>
      <Video
        source={{ uri: prompt.video_url }}
        style={styles.videoPreview}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isMuted
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoLabel}>
          {prompt.prompt_key
            ? VIDEO_PROMPT_OPTIONS.find((o) => o.key === prompt.prompt_key)?.label || prompt.prompt_key
            : 'Intro Video'}
        </Text>
        <Text style={styles.videoDuration}>{prompt.duration_seconds}s</Text>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(prompt)}>
        <Ionicons name="trash-outline" size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Prompts</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Add up to {APP_CONFIG.MAX_VIDEO_PROMPTS} short videos to your profile
        </Text>

        {/* Intro video */}
        <Text style={styles.sectionTitle}>Intro Video</Text>
        {introVideo ? (
          renderVideoCard(introVideo)
        ) : canAddMore ? (
          <TouchableOpacity style={styles.addCard} onPress={() => handleRecord()}>
            <Ionicons name="videocam-outline" size={32} color={COLORS.primary} />
            <Text style={styles.addText}>Record your intro</Text>
          </TouchableOpacity>
        ) : null}

        {/* Prompt videos */}
        <Text style={styles.sectionTitle}>Prompt Answers</Text>
        {promptVideos.map(renderVideoCard)}

        {canAddMore && (
          <>
            <Text style={styles.pickPromptLabel}>Pick a prompt to answer:</Text>
            {VIDEO_PROMPT_OPTIONS
              .filter((opt) => !promptVideos.some((v) => v.prompt_key === opt.key))
              .map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.promptOption, selectedPromptKey === opt.key && styles.promptOptionSelected]}
                  onPress={() => setSelectedPromptKey(opt.key)}
                >
                  <Text style={[styles.promptOptionText, selectedPromptKey === opt.key && styles.promptOptionTextSelected]}>
                    {opt.label}
                  </Text>
                  {selectedPromptKey === opt.key && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}

            {selectedPromptKey && (
              <Button
                title="Record Answer"
                onPress={() => handleRecord(selectedPromptKey)}
                loading={isLoading}
                fullWidth
                style={{ marginTop: 12 }}
              />
            )}
          </>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Uploading video...</Text>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 10,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  videoPreview: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceVariant,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  videoDuration: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  deleteButton: {
    padding: 8,
  },
  addCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  addText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  pickPromptLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  promptOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  promptOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '15',
  },
  promptOptionText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  promptOptionTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  loadingOverlay: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});

export default VideoPromptsScreen;
