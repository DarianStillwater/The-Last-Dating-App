import { playHaptic } from './haptics';
import { playSound, initSounds, cleanupSounds } from './sounds';
import type { FeedbackAction, FeedbackConfig } from './types';

export type { FeedbackAction, HapticType, SoundName } from './types';

const FEEDBACK_MAP: Record<FeedbackAction, FeedbackConfig> = {
  swipeRight: { haptic: 'medium', sound: 'bloom' },
  swipeLeft: { haptic: 'light', sound: 'pass' },
  match: { haptic: 'success', sound: 'match' },
  messageSend: { haptic: 'light', sound: 'send' },
  messageReceive: { haptic: 'light', sound: 'receive' },
  vote: { haptic: 'medium', sound: 'vote' },
  save: { haptic: 'success', sound: 'success' },
  onboardingStep: { haptic: 'light', sound: 'step' },
  photoUpload: { haptic: 'success', sound: 'success' },
  error: { haptic: 'error', sound: 'error' },
};

export const triggerFeedback = async (action: FeedbackAction): Promise<void> => {
  const config = FEEDBACK_MAP[action];
  if (!config) return;
  await Promise.all([playHaptic(config.haptic), playSound(config.sound)]);
};

export const initFeedback = initSounds;
export const cleanupFeedback = cleanupSounds;
export { playHaptic, playSound };
