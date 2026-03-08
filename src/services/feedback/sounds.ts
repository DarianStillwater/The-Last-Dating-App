import { Audio } from 'expo-av';
import type { SoundName } from './types';

const soundFiles: Record<SoundName, any> = {
  bloom: require('../../../assets/sounds/bloom.mp3'),
  pass: require('../../../assets/sounds/pass.mp3'),
  match: require('../../../assets/sounds/match.mp3'),
  send: require('../../../assets/sounds/send.mp3'),
  receive: require('../../../assets/sounds/receive.mp3'),
  vote: require('../../../assets/sounds/vote.mp3'),
  success: require('../../../assets/sounds/success.mp3'),
  error: require('../../../assets/sounds/error.mp3'),
  step: require('../../../assets/sounds/step.mp3'),
};

const loadedSounds = new Map<SoundName, Audio.Sound>();

export const initSounds = async (): Promise<void> => {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
    });

    const entries = Object.entries(soundFiles) as [SoundName, any][];
    await Promise.all(
      entries.map(async ([name, file]) => {
        const { sound } = await Audio.Sound.createAsync(file, { volume: 0.5 });
        loadedSounds.set(name, sound);
      }),
    );
  } catch {
    // Sound loading failed, features will no-op
  }
};

export const playSound = async (name: SoundName): Promise<void> => {
  try {
    const sound = loadedSounds.get(name);
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch {
    // Sound playback failed, silently ignore
  }
};

export const cleanupSounds = async (): Promise<void> => {
  const sounds = Array.from(loadedSounds.values());
  loadedSounds.clear();
  await Promise.all(sounds.map((s) => s.unloadAsync().catch(() => {})));
};
