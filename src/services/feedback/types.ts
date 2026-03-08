export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export type SoundName =
  | 'bloom'
  | 'pass'
  | 'match'
  | 'send'
  | 'receive'
  | 'vote'
  | 'success'
  | 'error'
  | 'step';

export type FeedbackAction =
  | 'swipeRight'
  | 'swipeLeft'
  | 'match'
  | 'messageSend'
  | 'messageReceive'
  | 'vote'
  | 'save'
  | 'onboardingStep'
  | 'photoUpload'
  | 'error';

export interface FeedbackConfig {
  haptic: HapticType;
  sound: SoundName;
}
