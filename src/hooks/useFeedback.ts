import { useCallback } from 'react';
import { triggerFeedback, playHaptic, playSound } from '../services/feedback';
import type { FeedbackAction, HapticType, SoundName } from '../services/feedback';

export const useFeedback = () => {
  const trigger = useCallback((action: FeedbackAction) => {
    triggerFeedback(action);
  }, []);

  const haptic = useCallback((type: HapticType) => {
    playHaptic(type);
  }, []);

  const sound = useCallback((name: SoundName) => {
    playSound(name);
  }, []);

  return { triggerFeedback: trigger, playHaptic: haptic, playSound: sound };
};
