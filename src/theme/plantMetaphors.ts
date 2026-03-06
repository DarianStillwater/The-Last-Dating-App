// Centralized plant-themed labels and copy

export const TAB_LABELS = {
  discover: 'Explore',
  matches: 'Garden',
  messages: 'Messages',
  profile: 'My Planter',
} as const;

export const MATCH_METAPHORS = {
  newMatch: 'New Seed',
  seedPlanted: 'Seed Planted',
  likes: 'Seeds Planted',
  matchLimit: 'Garden Full',
  matches: 'Connections',
  garden: 'Your Garden',
} as const;

// Onboarding: filling a planter box (6 steps matching BasicInfoScreen)
export const PLANTER_STAGES = {
  1: { label: 'Choose Your Pot', icon: 'cube-outline' },
  2: { label: 'Fill With Soil', icon: 'layers-outline' },
  3: { label: 'Add Fertilizer', icon: 'flask-outline' },
  4: { label: 'Select Your Seeds', icon: 'ellipse-outline' },
  5: { label: 'Water It', icon: 'water-outline' },
  6: { label: 'Plant It', icon: 'leaf-outline' },
} as const;

// Match progression: plant growth stages
export const GROWTH_STAGES = {
  0: { label: 'Seed', icon: 'ellipse' },
  1: { label: 'Sprout', icon: 'leaf-outline' },
  2: { label: 'Budding', icon: 'flower-outline' },
  3: { label: 'Blooming', icon: 'flower' },
} as const;

// Keep backward compat alias
export const PROFILE_STAGES = PLANTER_STAGES;

export const EMPTY_STATES = {
  noProfiles: {
    title: 'No new people nearby',
    subtitle: 'Check back soon for new people to discover',
  },
  matchLimit: {
    title: 'Your garden is full!',
    subtitle: 'Nurture your current connections before adding more',
  },
  photoExpired: {
    title: 'Your photo needs sunlight',
    subtitle: 'Reverify your photos to keep blooming',
  },
  noMatches: {
    title: 'Your garden is empty',
    subtitle: 'Start swiping to plant your first seeds',
  },
  noMessages: {
    title: 'No conversations yet',
    subtitle: 'Start nurturing your connections',
  },
} as const;

// Trust tiers based on community vouches and reviews
export const TRUST_TIERS = {
  0: { label: 'New Seedling', icon: 'leaf-outline', minVouches: 0, minReviews: 0 },
  1: { label: 'Taking Root', icon: 'leaf', minVouches: 1, minReviews: 1 },
  2: { label: 'Growing Strong', icon: 'flower-outline', minVouches: 3, minReviews: 3 },
  3: { label: 'Deep Roots', icon: 'flower', minVouches: 5, minReviews: 5 },
} as const;

export const TRUST_COPY = {
  reviewPrompt: {
    title: 'Garden Check-In',
    subtitle: 'How was your date? Help the community grow.',
  },
  vouchPrompt: {
    title: 'Vouch for this person',
    subtitle: 'Let others know they are who they say they are.',
  },
  trustBadge: {
    label: 'Community Trust',
  },
} as const;

export const PROFILE_STATS = {
  matches: 'Connections',
  responseRate: 'Growth Rate',
  photos: 'Petals',
} as const;

export const SWIPE_LABELS = {
  like: 'BLOOM',
  nope: 'PASS',
} as const;

// Guided hints shown by PlantCompanion throughout the app
export const COMPANION_HINTS = {
  discover_swipe: {
    message: "Swipe right if you feel a spark! Remember, you can only grow 10 plants at a time — choose wisely!",
    delay: 2500,
  },
  garden_overview: {
    message: "Welcome to your Garden! Each match is a plant that grows as you get to know each other.",
    delay: 2000,
  },
  chat_limits: {
    message: "You start with a few messages to break the ice. Keep chatting to unlock date suggestions!",
    delay: 2500,
  },
  profile_photo_refresh: {
    message: "Every month, you'll take a fresh selfie to keep your profile honest. It's how we keep things real!",
    delay: 3000,
  },
  photos_verification: {
    message: "Verified photos build trust. A quick selfie match proves you're really you!",
    delay: 2500,
  },
  post_date_review: {
    message: "After a date, share how it went! Your honest check-in helps the whole community stay safe.",
    delay: 2000,
  },
  settings_privacy: {
    message: "Verify your phone or link social accounts to boost your trust score and stand out!",
    delay: 2500,
  },
} as const;

export const ONBOARDING_COPY = {
  welcome: {
    tagline: 'Where real connections grow naturally',
    features: [
      { text: 'Prepare Your Planter', icon: 'leaf' },
      { text: 'Beautiful Gardens to Visit', icon: 'flower' },
      { text: '10 Matches, Deeply Rooted', icon: 'heart' },
    ],
  },
  signIn: {
    title: 'Welcome Back to Your Garden',
    subtitle: 'Sign in to continue growing',
  },
  signUp: {
    title: 'Plant Your Seed',
    subtitle: 'Create your account and start planting',
    button: 'Start Planting',
  },
  basicInfo: {
    title: 'Tell us about yourself',
  },
  photos: {
    title: 'Show Your Colors',
    emptySlot: 'Add a photo',
  },
  dealBreakers: {
    title: 'Your Deal Breakers',
    subtitle: "People outside these preferences won't appear",
  },
  bio: {
    title: 'Your Story',
    placeholder: 'Share your story to help things grow',
  },
  preview: {
    title: 'Preview Your Planter',
    button: 'Plant It!',
  },
} as const;
