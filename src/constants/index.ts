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
};

// Color Theme
export const COLORS = {
  primary: '#FF6B6B',
  primaryDark: '#E55A5A',
  primaryLight: '#FF8F8F',
  secondary: '#4ECDC4',
  secondaryDark: '#3DBDB5',
  accent: '#FFE66D',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardShadow: 'rgba(0, 0, 0, 0.1)',
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

// Looking For Options
export const LOOKING_FOR_OPTIONS = [
  { value: 'male', label: 'Men' },
  { value: 'female', label: 'Women' },
  { value: 'non-binary', label: 'Non-binary people' },
  { value: 'other', label: 'Everyone' },
];

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

// Venue Categories
export const VENUE_CATEGORIES = [
  { value: 'indian', label: 'Indian', emoji: '🍛' },
  { value: 'thai', label: 'Thai', emoji: '🍜' },
  { value: 'french', label: 'French', emoji: '🥐' },
  { value: 'korean', label: 'Korean', emoji: '🍱' },
  { value: 'japanese', label: 'Japanese', emoji: '🍣' },
  { value: 'italian', label: 'Italian', emoji: '🍝' },
  { value: 'mexican', label: 'Mexican', emoji: '🌮' },
  { value: 'american', label: 'American', emoji: '🍔' },
  { value: 'chinese', label: 'Chinese', emoji: '🥡' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🥙' },
  { value: 'vietnamese', label: 'Vietnamese', emoji: '🍲' },
  { value: 'bar', label: 'Bar / Cocktails', emoji: '🍸' },
  { value: 'coffee', label: 'Coffee / Café', emoji: '☕' },
  { value: 'activity', label: 'Activity', emoji: '🎯' },
  { value: 'outdoor', label: 'Outdoor', emoji: '🌳' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎭' },
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

// Review Fields
export const REVIEW_FIELDS = [
  { value: 'height', label: 'Height' },
  { value: 'age', label: 'Age' },
  { value: 'ethnicity', label: 'Ethnicity' },
  { value: 'photos', label: 'Photos' },
  { value: 'occupation', label: 'Occupation' },
  { value: 'religion', label: 'Religion' },
  { value: 'general', label: 'General' },
];

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
