import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import type { VoiceMessage } from '../types';

interface VoiceMessageBubbleProps {
  voiceMessage: VoiceMessage;
  isMine: boolean;
  onListened?: (id: string) => void;
}

const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  voiceMessage,
  isMine,
  onListened,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlay = async () => {
    try {
      if (isPlaying && soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.playAsync();
        setIsPlaying(true);
        return;
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: voiceMessage.audio_url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            if (status.durationMillis) {
              setProgress(status.positionMillis / status.durationMillis);
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setProgress(0);
              soundRef.current = null;
            }
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);

      if (!isMine && !voiceMessage.listened_at && onListened) {
        onListened(voiceMessage.id);
      }
    } catch (error) {
      console.error('Error playing voice message:', error);
      setIsPlaying(false);
    }
  };

  return (
    <View style={[styles.container, isMine ? styles.mine : styles.theirs]}>
      <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={20}
          color={isMine ? COLORS.background : COLORS.primary}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.waveformTrack}>
          <View style={[styles.waveformProgress, { width: `${progress * 100}%` }, isMine && styles.waveformProgressMine]} />
        </View>
        <Text style={[styles.duration, isMine && styles.durationMine]}>
          {formatDuration(voiceMessage.duration_seconds)}
        </Text>
      </View>

      <Ionicons
        name="mic"
        size={14}
        color={isMine ? COLORS.background + '80' : COLORS.textSecondary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    maxWidth: '75%',
    marginVertical: 2,
  },
  mine: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    marginLeft: '25%',
  },
  theirs: {
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
    marginRight: '25%',
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveformContainer: {
    flex: 1,
    gap: 2,
  },
  waveformTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  waveformProgress: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  waveformProgressMine: {
    backgroundColor: COLORS.background,
  },
  duration: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  durationMine: {
    color: COLORS.background + '90',
  },
});

export default VoiceMessageBubble;
