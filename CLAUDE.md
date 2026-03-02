# CLAUDE.md

## Project

React Native / Expo SDK 54 dating app with a Supabase (PostgreSQL) backend. Portrait-only mobile app featuring profile matching, real-time messaging, photo verification, push notifications, and date venue suggestions.

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
├── screens/           # 18 screens across 6 feature areas (auth, matching, messaging, profile, settings, venues)
├── store/             # Zustand stores: auth, profile, match, message, venue, photoVerification
├── lib/               # supabase.ts, database.types.ts, notifications.ts
├── types/index.ts     # All TypeScript types (centralized)
├── constants/index.ts # Colors, APP_CONFIG, option lists, validators
├── components/        # cards/ (SwipeCard), ui/ (Button, Input, VerificationBadge), ErrorBoundary
└── navigation/        # AppNavigator with deep linking (lastdatingapp:// scheme)

supabase/functions/    # Edge functions (verify-photo)
__tests__/             # Jest test suites (components, store, utils)
```

- **Database**: 14 tables with RLS policies, 7 functions, webhook triggers for notifications
- **Edge functions**: `send-match-notification`, `send-message-notification` (deployed), `verify-photo` (requires AWS secrets)
- **Entry point**: `App.tsx` → `ErrorBoundary` → `AppNavigator` → conditional auth/setup/main stacks

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
- Use existing `Button`, `Input`, and `VerificationBadge` components from `src/components/ui/` before creating new ones
- Styles via `StyleSheet.create()` at the bottom of each file — no inline styles
- Colors from `COLORS` constant in `src/constants/index.ts` — never hardcode hex values
- App limits from `APP_CONFIG` (max matches, message limits, photo limits, etc.)

### Imports
Order: React → React Native → third-party libraries → relative imports

### Database
- All DB access through the Supabase client in `src/lib/supabase.ts` — no ORM
- Use helpers: `getCurrentUserId()`, `isAuthenticated()`, `uploadImage()`, `deleteImage()`
- Real-time subscriptions via `subscribeToChannel()` helper
- Match creation is handled by the `create_match_on_mutual_like` DB trigger — do not duplicate in client code
- Notification delivery is handled by DB webhook triggers calling edge functions

### Notifications
- Push token registration happens automatically on auth init (`src/lib/notifications.ts`)
- Token lifecycle: register on sign-in, deactivate on sign-out, reactivate on re-sign-in
- Notification taps handled in `App.tsx` — routes to Chat or Matches screen

### Environment
- Env vars use `EXPO_PUBLIC_` prefix (Expo convention)
- `.env` is gitignored — see `.env.example` for required variables
- Sensitive credentials stored via `expo-secure-store` at runtime
- Edge function secrets (AWS keys) set via Supabase dashboard, not in `.env`

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
