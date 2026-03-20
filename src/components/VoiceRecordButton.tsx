import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, APP_CONFIG } from '../constants';

interface VoiceRecordButtonProps {
  onRecordComplete: (uri: string, durationSeconds: number) => void;
  disabled?: boolean;
}

const VoiceRecordButton: React.FC<VoiceRecordButtonProps> = ({
  onRecordComplete,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    if (disabled) return;

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      intervalRef.current = setInterval(() => {
        setRecordingDuration((d) => {
          if (d >= APP_CONFIG.VOICE_MAX_DURATION_SECONDS - 1) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setIsRecording(false);
      await recordingRef.current.stopAndUnloadAsync();

      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const durationSeconds = Math.ceil((status.durationMillis || 0) / 1000);

      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri && durationSeconds > 0) {
        onRecordComplete(uri, durationSeconds);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      setIsRecording(false);
    }
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingText}>{formatDuration(recordingDuration)}</Text>
        </View>
      )}
      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        disabled={disabled}
        style={[styles.button, isRecording && styles.buttonRecording, disabled && styles.buttonDisabled]}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={22}
          color={isRecording ? COLORS.error : COLORS.primary}
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonRecording: {
    backgroundColor: COLORS.error + '15',
    borderColor: COLORS.error,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.error,
    fontVariant: ['tabular-nums'],
  },
});

export default VoiceRecordButton;
