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

export const PROFILE_STATS = {
  matches: 'Connections',
  responseRate: 'Growth Rate',
  photos: 'Petals',
} as const;

export const SWIPE_LABELS = {
  like: 'BLOOM',
  nope: 'PASS',
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
