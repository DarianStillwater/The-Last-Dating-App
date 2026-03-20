// App Configuration
export const APP_CONFIG = {
  MAX_MATCHES: 10,
  INITIAL_MESSAGE_LIMIT: 3,
  MESSAGES_FOR_DATE_SUGGESTION: 10,
  PHOTO_EXPIRATION_DAYS: 30,
  PHOTO_REMINDER_DAYS: 25,
  INACTIVE_THRESHOLD_DAYS: 30,
  MAX_PHOTOS: 10,
  MAX_BIO_LENGTH: 500,
  MAX_THINGS_TO_KNOW_LENGTH: 300,

  // Photo verification thresholds
  FACE_DETECTION_CONFIDENCE_MIN: 90,
  MODERATION_CONFIDENCE_THRESHOLD: 75,
  FACE_MATCH_SIMILARITY_MIN: 80,
  FACE_MATCH_REVIEW_THRESHOLD: 60,
  VERIFICATION_TIMEOUT_MS: 30000,

  // Venue deals
  DEAL_DEFAULT_EXPIRY_HOURS: 48,
  DEAL_REDEMPTION_CODE_LENGTH: 8,

  // Question game
  QUIET_PERIOD_HOURS: 24,
  GAME_EXPIRY_HOURS: 24,
  GAME_MAX_ANSWER_LENGTH: 300,

  // Voice messages
  VOICE_MAX_DURATION_SECONDS: 60,
  VOICE_MAX_SIZE_MB: 2,

  // Video prompts
  VIDEO_MAX_DURATION_SECONDS: 30,
  VIDEO_MAX_SIZE_MB: 10,
  MAX_VIDEO_PROMPTS: 3,

  // Community dealbreakers
  COMMUNITY_DEALBREAKER_CYCLE_DAYS: 30,
  COMMUNITY_SUBMISSION_MAX_LENGTH: 200,
  COMMUNITY_SIMILAR_THRESHOLD: 0.4,
};

// User-facing rejection reason messages
export const MODERATION_REJECTION_REASONS: Record<string, string> = {
  no_face: 'No face was detected in the photo. Please take a clear selfie.',
  multiple_faces: 'Multiple faces were detected. Please take a solo selfie.',
  inappropriate_content: 'The photo was flagged for inappropriate content.',
  face_mismatch: 'The photo does not match your existing profile photos.',
  low_quality: 'The photo quality is too low. Please try again in better lighting.',
  metadata_invalid: 'Photo must be taken with the front camera.',
};

// Color Theme - Plant / Growth palette
export const COLORS = {
  primary: '#40916C',
  primaryDark: '#2D6A4F',
  primaryLight: '#74C69D',
  secondary: '#F4ACB7',
  secondaryDark: '#E08C98',
  accent: '#FFD166',
  background: '#F0FFF4',
  surface: '#FFFFFF',
  surfaceVariant: '#E8F5E9',
  text: '#1B4332',
  textSecondary: '#52796F',
  textLight: '#95B8A3',
  border: '#C8E6C9',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#F9A825',
  info: '#0288D1',
  overlay: 'rgba(27, 67, 50, 0.5)',
  cardShadow: 'rgba(45, 106, 79, 0.1)',
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

// Looking For Options — individual gender preferences
export const LOOKING_FOR_OPTIONS = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary people' },
  { value: 'other', label: 'Other' },
];

// All gender values for "Everyone" selection
export const ALL_GENDERS = LOOKING_FOR_OPTIONS.map((o) => o.value);

// Ethnicity Options
export const ETHNICITY_OPTIONS = [
  { value: 'asian', label: 'Asian' },
  { value: 'black', label: 'Black / African American' },
  { value: 'hispanic', label: 'Hispanic / Latino' },
  { value: 'white', label: 'White / Caucasian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'native_american', label: 'Native American' },
  { value: 'pacific_islander', label: 'Pacific Islander' },
  { value: 'mixed', label: 'Mixed / Multi-racial' },
  { value: 'other', label: 'Other' },
];

// Religion Options
export const RELIGION_OPTIONS = [
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'atheist', label: 'Atheist' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'christian', label: 'Christian' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// Offspring/Kids Options
export const OFFSPRING_OPTIONS = [
  { value: 'has_kids_wants_more', label: 'Have kids, want more' },
  { value: 'has_kids_doesnt_want_more', label: 'Have kids, don\'t want more' },
  { value: 'no_kids_wants_kids', label: 'Don\'t have kids, want them' },
  { value: 'no_kids_doesnt_want_kids', label: 'Don\'t have kids, don\'t want them' },
  { value: 'not_sure', label: 'Not sure yet' },
];

// Frequency Options (for smoking, drinking, drugs)
export const FREQUENCY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Often' },
  { value: 'daily', label: 'Daily' },
];

// Smoker-specific labels
export const SMOKER_OPTIONS = [
  { value: 'never', label: 'Non-smoker' },
  { value: 'rarely', label: 'Social smoker' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Regular smoker' },
  { value: 'daily', label: 'Daily smoker' },
];

// Alcohol-specific labels
export const ALCOHOL_OPTIONS = [
  { value: 'never', label: 'Don\'t drink' },
  { value: 'rarely', label: 'Rarely drink' },
  { value: 'sometimes', label: 'Social drinker' },
  { value: 'often', label: 'Regular drinker' },
  { value: 'daily', label: 'Daily' },
];

// Drugs-specific labels
export const DRUGS_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Regularly' },
  { value: 'daily', label: 'Daily' },
];

// Diet Options
export const DIET_OPTIONS = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'halal', label: 'Halal' },
  { value: 'kosher', label: 'Kosher' },
  { value: 'other', label: 'Other' },
];

// Income Options
export const INCOME_OPTIONS = [
  { value: 'under_25k', label: 'Under $25,000' },
  { value: '25k_50k', label: '$25,000 - $50,000' },
  { value: '50k_75k', label: '$50,000 - $75,000' },
  { value: '75k_100k', label: '$75,000 - $100,000' },
  { value: '100k_150k', label: '$100,000 - $150,000' },
  { value: '150k_200k', label: '$150,000 - $200,000' },
  { value: 'over_200k', label: 'Over $200,000' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

// Height helpers
export const HEIGHT_RANGE = {
  MIN_CM: 120,
  MAX_CM: 230,
};

export const cmToFeetInches = (cm: number): string => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
};

export const feetInchesToCm = (feet: number, inches: number): number => {
  return Math.round((feet * 12 + inches) * 2.54);
};

// Age helpers
export const AGE_RANGE = {
  MIN: 18,
  MAX: 99,
};

export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Venue Categories — grouped by type
export const VENUE_CATEGORY_GROUPS = [
  {
    title: 'Drinks',
    categories: [
      { value: 'coffee', label: 'Coffee / Café', emoji: '☕' },
      { value: 'bar', label: 'Bar / Cocktails', emoji: '🍸' },
      { value: 'brewery', label: 'Brewery', emoji: '🍺' },
    ],
  },
  {
    title: 'Dining',
    categories: [
      { value: 'italian', label: 'Italian', emoji: '🍝' },
      { value: 'japanese', label: 'Japanese', emoji: '🍣' },
      { value: 'mexican', label: 'Mexican', emoji: '🌮' },
      { value: 'american', label: 'American', emoji: '🍔' },
      { value: 'thai', label: 'Thai', emoji: '🍜' },
      { value: 'korean', label: 'Korean', emoji: '🍱' },
      { value: 'french', label: 'French', emoji: '🥐' },
      { value: 'indian', label: 'Indian', emoji: '🍛' },
      { value: 'chinese', label: 'Chinese', emoji: '🥡' },
      { value: 'mediterranean', label: 'Mediterranean', emoji: '🥙' },
      { value: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
    ],
  },
  {
    title: 'Activities & Events',
    categories: [
      { value: 'activity', label: 'Activity', emoji: '🎯' },
      { value: 'entertainment', label: 'Entertainment', emoji: '🎭' },
      { value: 'spa', label: 'Spa / Wellness', emoji: '💆' },
    ],
  },
];

// Flat array for backward compatibility (venueStore, types, etc.)
export const VENUE_CATEGORIES = VENUE_CATEGORY_GROUPS.flatMap((g) => g.categories);

// Question Game Prompts
export const QUESTION_GAME_PROMPTS = [
  "What's the most spontaneous thing you've ever done?",
  "If you could have dinner with anyone, who would it be?",
  "What's your most unpopular opinion?",
  "What's the best gift you've ever received?",
  "If you weren't doing your current job, what would you be doing?",
  "What's the last thing that made you laugh out loud?",
  "What's your love language?",
  "What's the most adventurous food you've tried?",
  "If you could live anywhere for a year, where would it be?",
  "What's a skill you'd love to learn?",
  "What does your ideal weekend look like?",
  "What's the best advice you've ever received?",
  "What's something most people don't know about you?",
  "What's the last show you binge-watched?",
  "If you could have any superpower, what would it be?",
];

// Video Prompt Options
export const VIDEO_PROMPT_OPTIONS = [
  { key: 'ideal_date', label: 'My ideal date would be...' },
  { key: 'way_to_heart', label: 'The way to my heart is...' },
  { key: 'looking_for', label: "I'm looking for someone who..." },
  { key: 'friends_say', label: 'My friends would describe me as...' },
  { key: 'perfect_sunday', label: 'A perfect Sunday looks like...' },
];

// Report Reasons
export const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake or misleading profile' },
  { value: 'inappropriate_content', label: 'Inappropriate photos or content' },
  { value: 'harassment', label: 'Harassment or abusive behavior' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'underage', label: 'Appears to be underage' },
  { value: 'other', label: 'Other' },
];

// Accuracy Review Options
export const ACCURACY_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'mostly', label: 'Mostly' },
  { value: 'no', label: 'No' },
] as const;

// Trust & Safety Config
export const TRUST_CONFIG = {
  REVIEW_ELIGIBLE_HOURS: 24,
  MIN_VOUCHES_FOR_TIER_1: 1,
  MIN_VOUCHES_FOR_TIER_2: 3,
  MIN_VOUCHES_FOR_TIER_3: 5,
  REPORTS_FOR_VISIBILITY_REDUCE: 3,
  REPORTS_FOR_SUSPENSION: 5,
  SUSPENSION_HOURS: 72,
  TRUST_SCORE_LOW_THRESHOLD: 0.2,
  MIN_REVIEWS_FOR_DISPLAY: 3,
};

// Default Deal Breaker Values
export const DEFAULT_DEAL_BREAKERS = {
  min_age: 18,
  max_age: 50,
  min_height: 150,
  max_height: 200,
  max_distance: 25,
};

// Distance Options (in miles)
export const DISTANCE_OPTIONS = [
  { value: 5, label: '5 miles' },
  { value: 10, label: '10 miles' },
  { value: 15, label: '15 miles' },
  { value: 25, label: '25 miles' },
  { value: 50, label: '50 miles' },
  { value: 100, label: '100 miles' },
  { value: 500, label: 'Anywhere' },
];
