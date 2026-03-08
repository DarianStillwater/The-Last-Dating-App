# CLAUDE.md

## Project

React Native / Expo SDK 54 dating app with a Supabase (PostgreSQL) backend. Portrait-only mobile app with a plant/garden theme throughout (onboarding = filling a planter box, matches = growing plants). Features profile matching, real-time messaging, photo verification, push notifications, date venue suggestions, community dealbreakers, trust & safety scoring, and haptic/audio feedback.

## Commands

```bash
npx expo start            # Start dev server
npx expo start --ios      # iOS simulator
npx expo start --android  # Android emulator
npm test                  # Run Jest tests
npm run test:watch        # Jest in watch mode
```

## Architecture

```
src/
├── screens/           # 26 screens across 6 areas (auth, matching, messaging, profile, settings, venues)
├── store/             # 8 Zustand stores: auth, profile, match, message, venue, photoVerification, trust, communityDealBreaker
├── services/feedback/ # Centralized haptic + sound feedback system (expo-haptics, expo-av)
├── hooks/             # useHint, useFeedback, useAppleAuth, useGoogleAuth
├── lib/               # supabase.ts, database.types.ts, notifications.ts
├── types/index.ts     # All TypeScript types (centralized)
├── constants/index.ts # COLORS, APP_CONFIG, TRUST_CONFIG, VENUE_CATEGORY_GROUPS, option lists
├── components/        # cards/ (SwipeCard), ui/ (Button, Input, AnimatedPress, Toast, etc.), decorative/, ErrorBoundary
├── navigation/        # AppNavigator with deep linking (lastdatingapp:// scheme)
└── theme/             # plantMetaphors.ts — all plant-themed copy, tab labels, growth stages, trust tiers, hints

supabase/functions/    # 4 edge functions: verify-photo, verify-social-link, generate-answer-options, notify-new-community-dealbreaker
assets/sounds/         # 9 MP3 sound effects (bloom, pass, match, send, receive, vote, success, error, step)
assets/animations/     # Lottie JSON: sprout-growth, match-celebration, bloom-burst
__tests__/             # Jest test suites (components, store, hooks, utils)
```

- **Database**: 14+ tables with RLS policies, 7 functions, webhook triggers for notifications
- **Edge functions**: `verify-photo` (AWS Rekognition), `verify-social-link`, `generate-answer-options` (Gemini AI), `notify-new-community-dealbreaker` (Expo push)
- **Entry point**: `App.tsx` → `ErrorBoundary` → `ToastProvider` → `AppNavigator` → conditional auth/setup/main stacks
- **Feedback init**: `initFeedback()` called on mount in App.tsx, `cleanupFeedback()` on unmount

## Stores

| Store | Domain | Key state |
|-------|--------|-----------|
| `authStore` | Auth & session | user, session, isAuthenticated, social auth (Apple/Google) |
| `profileStore` | Profile & photos | profile, dealBreakers, photo upload/verification |
| `matchStore` | Swiping & matches | discoverProfiles, matches, swipeRight/Left, block/report |
| `messageStore` | Real-time messaging | messages, messageLimit, shouldShowDateSuggestion |
| `venueStore` | Date venues | venues (midpoint-based), dateSuggestion, category selection |
| `photoVerificationStore` | Photo verification | selfie verification, face matching, expiration (30 days) |
| `trustStore` | Trust & safety | trust scores, reviews, vouches, social links, 4-tier system |
| `communityDealBreakerStore` | Community questions | 30-day voting cycles, submissions, answers, preferences, admin approval |

## UI Components

### `src/components/ui/`
- `Button` — Primary CTA with loading state
- `Input` — Text input with validation
- `VerificationBadge` — Photo/phone verification status
- `TrustBadge` — 4-tier trust display (New Seedling → Deep Roots)
- `AnimatedPress` — Spring-scale pressable with optional `feedbackAction` prop
- `AnimatedCounter` — Spring-animated number for vote counts
- `SuccessCheck` — Animated checkmark overlay
- `Toast` — Bottom toast (success/error/info), auto-dismiss 2s. Provider wraps app, use via `useToast()` hook.

### `src/components/decorative/`
- VineDivider, EmptyStatePlant, FloatingLeaves, BotanicalFrame, LeafCorner

## Conventions

### TypeScript
- Strict mode enabled. All code must be fully typed.
- All types live in `src/types/index.ts` — centralized, not co-located with components.
- Navigation uses typed param lists (`RootStackParamList`, `MainTabParamList`, etc.) from the types file.

### State management (Zustand)
- One store per domain in `src/store/`. Each store follows this pattern:
  1. Define a state interface with properties and action signatures
  2. `create<StateType>((set, get) => ({ ...initialState, ...actions }))`
  3. Async actions: set `isLoading: true` at start, wrap in try/catch/finally, return `{ error: string | null }`
- Import stores via hooks: `const { user } = useAuthStore()`
- Re-exported from `src/store/index.ts`

### Components
- Functional components with hooks, typed as `React.FC`
- Use existing UI components from `src/components/ui/` before creating new ones
- Styles via `StyleSheet.create()` at the bottom of each file — no inline styles
- Colors from `COLORS` constant in `src/constants/index.ts` — never hardcode hex values
- App limits from `APP_CONFIG` (max matches, message limits, photo limits, etc.)

### Feedback system
- `src/services/feedback/` — centralized service mapping 10 actions to haptic + sound combos
- Use `triggerFeedback(action)` for combined haptic + sound, or `playHaptic(type)` / `playSound(name)` individually
- `useFeedback()` hook wraps the service for use in components
- `AnimatedPress` component adds spring bounce + optional feedback on press
- Integrated into: swipe cards, match celebrations, message send/receive, community votes, profile saves, onboarding steps

### Imports
Order: React → React Native → third-party libraries → relative imports

### UI / Layout
- **No scrolling on static screens.** Only dynamic list screens (Chat, Matches, Messages, Venues) use ScrollView/FlatList.
- Static screens that would overflow are split into multiple steps (wizard pattern) or use accordion sections (one expanded at a time).
- Onboarding uses a 6-step wizard in BasicInfoScreen, 3-step (or 4 with community questions) wizard in DealBreakersScreen.
- Settings and EditProfile use accordion pattern with `expandedSection` state.
- ProfileDetailScreen shows key info with a "See More Details" button linking to ProfileDetailsScreen.

### Theme
- All plant/garden metaphors and copy are centralized in `src/theme/plantMetaphors.ts`.
- Tab labels: Explore, Garden, Messages, My Planter.
- Onboarding stages map to `PLANTER_STAGES` (6 steps). Match progression uses `GROWTH_STAGES` (seed → sprout → budding → blooming).
- Trust tiers: New Seedling (0) → Taking Root (1) → Growing Strong (2) → Deep Roots (3) based on vouches + reviews.
- Community dealbreaker copy uses "Garden Rules" terminology.
- Use themed copy from `plantMetaphors.ts` — don't hardcode plant metaphors in screens.

### Immutable profile fields
- `first_name`, `gender`, `height_cm`, `birth_date` are set during onboarding and **cannot be changed** afterward.
- EditProfileScreen only allows editing: `looking_for`, background, lifestyle, professional, and about sections.

### Database
- All DB access through the Supabase client in `src/lib/supabase.ts` — no ORM
- Use helpers: `getCurrentUserId()`, `isAuthenticated()`, `uploadImage()`, `deleteImage()`
- Real-time subscriptions via `subscribeToChannel()` helper
- Match creation is handled by the `create_match_on_mutual_like` DB trigger — do not duplicate in client code
- Notification delivery is handled by DB webhook triggers calling edge functions
- Community dealbreaker tables: `_cycles`, `_submissions`, `_votes`, `_questions`, `_answers`, `_preferences`
- `pg_trgm` extension used for duplicate submission detection via `find_similar_submissions()`

### Venue system
- Venues are partner-managed (not API-sourced), stored in `venues` table with geolocation
- Midpoint-based matching: calculates geographic midpoint between two users, filters by `service_radius_miles`
- Partnership slots (1-3) for priority ranking, payment tiers for monetization
- Categories grouped into: Drinks (coffee, bar, brewery), Dining (11 cuisines), Activities & Events (activity, entertainment, spa)
- Date suggestion triggered after 10+ messages in a match conversation

### Notifications
- Push token registration happens automatically on auth init (`src/lib/notifications.ts`)
- Token lifecycle: register on sign-in, deactivate on sign-out, reactivate on re-sign-in
- Notification taps handled in `App.tsx` — routes to Chat, Matches, or AnswerCommunityDealBreaker screen

### Environment
- Env vars use `EXPO_PUBLIC_` prefix (Expo convention)
- `.env` is gitignored — see `.env.example` for required variables
- Sensitive credentials stored via `expo-secure-store` at runtime
- Edge function secrets (AWS keys, Gemini API key) set via Supabase dashboard, not in `.env`

## Testing

- **Framework**: Jest with `jest-expo` preset + React Native Testing Library
- **Config**: `jest.config.js` + `jest.setup.js` (polyfills for Expo SDK 54 compatibility)
- **Test location**: `__tests__/` directory mirroring `src/` structure
- **Patterns**:
  - Component tests: render, assert text/elements, fireEvent for interactions
  - Store tests: test pure logic independently of Supabase (mock or isolate)
  - Utility tests: direct function input/output assertions
- Run: `npm test`

## Build & Deploy

- **EAS Build** configured in `eas.json` with 3 profiles: development, preview, production
- **Bundle ID**: `com.lastdatingapp.app` (iOS + Android)
- **Deep linking scheme**: `lastdatingapp://`
- Update `app.json` > `extra.eas.projectId` before first EAS build
