# The Last Dating App

A modern dating app built with React Native, Expo SDK 54, and Supabase. Profile matching with deal breakers, real-time messaging, date venue suggestions, photo verification, and push notifications.

## Features

- **Smart Matching** - Algorithm respects deal breakers, location, and preferences with a curated match limit
- **Swipe Interface** - Card-based swiping with animated transitions
- **Real-time Chat** - Instant messaging with daily message limits to encourage meaningful conversation
- **Photo Verification** - AWS Rekognition-powered selfie verification via edge function
- **Push Notifications** - Match and message alerts via Expo Push API
- **Date Suggestions** - Venue recommendations with midpoint-based location logic
- **Deep Linking** - `lastdatingapp://` scheme for chat and profile URLs
- **Error Boundary** - Graceful crash recovery with retry

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript (strict) |
| State | Zustand (6 stores) |
| Navigation | React Navigation 7 (stack + tabs) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Edge Functions | Deno (photo verification, push notifications) |
| Notifications | expo-notifications + Expo Push API |
| Testing | Jest + jest-expo + React Native Testing Library |
| Build | EAS Build (development, preview, production profiles) |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npx expo`)
- iOS Simulator (Mac) or Android Emulator
- Supabase project

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase URL and anon key
   ```

3. **Set up the database**

   Run `supabase_schema.sql` in your Supabase SQL Editor. This creates all 14 tables, RLS policies, functions, and triggers.

4. **Start dev server**
   ```bash
   npx expo start
   ```

### Edge Function Secrets

The `verify-photo` edge function requires AWS Rekognition credentials set as Supabase Edge Function secrets:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

The notification edge functions (`send-match-notification`, `send-message-notification`) are deployed and triggered automatically by database webhooks.

## Project Structure

```
src/
├── components/          # Reusable UI
│   ├── cards/           #   SwipeCard
│   ├── ui/              #   Button, Input, VerificationBadge
│   └── ErrorBoundary.tsx
├── screens/             # 18 screens across 6 feature areas
│   ├── auth/            #   Welcome, SignIn, SignUp
│   ├── matching/        #   Discover, ProfileDetail
│   ├── messaging/       #   Matches, Messages, Chat
│   ├── profile/         #   BasicInfo, Photos, PhotoVerification, DealBreakers, Bio, Preview
│   ├── settings/        #   Profile, EditProfile, Settings
│   └── venues/          #   DateSuggestion, VenueSelection
├── store/               # Zustand stores
│   ├── authStore.ts     #   Auth + push token registration
│   ├── profileStore.ts  #   Profile CRUD + photo upload
│   ├── matchStore.ts    #   Swipes, matching, daily profiles
│   ├── messageStore.ts  #   Chat + real-time subscriptions
│   ├── venueStore.ts    #   Venues + date suggestions
│   └── photoVerificationStore.ts
├── lib/                 # Supabase client, types, notifications
├── navigation/          # AppNavigator with deep linking
├── types/index.ts       # All TypeScript types (centralized)
└── constants/index.ts   # Colors, APP_CONFIG, option lists, validators

supabase/
└── functions/
    └── verify-photo/    # AWS Rekognition photo verification

__tests__/               # Jest test suites
├── components/          #   Button component tests
├── store/               #   Match store logic tests
└── utils/               #   Validator/utility tests
```

## Database

14 tables with Row Level Security:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles with verification status |
| `deal_breakers` | Matching preferences |
| `swipes` | Like/pass actions |
| `matches` | Mutual matches (created by trigger) |
| `messages` | Chat messages |
| `message_limits` | Daily message tracking |
| `venues` | Partner locations |
| `venue_owners` | Venue ownership |
| `date_suggestions` | Proposed dates |
| `profile_reviews` | Profile accuracy reviews |
| `reports` | User reports |
| `blocks` | Blocked users |
| `photo_verifications` | Verification attempts + results |
| `push_tokens` | Expo push tokens per device |

Key database functions:
- `get_compatible_profiles` - Matching algorithm with deal breaker filtering
- `calculate_distance` / `get_midpoint_coordinates` - Geo utilities
- `check_mutual_match` / `create_match_on_mutual_like` - Trigger-based match creation
- `increment_match_count` / `decrement_match_count` - Atomic counter updates

## Scripts

```bash
npm start          # Start Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm test           # Run Jest tests
npm run test:watch # Run tests in watch mode
```

## Building for Production

EAS Build is configured with three profiles in `eas.json`:

```bash
eas build --profile development  # Dev client (internal distribution)
eas build --profile preview      # Internal testing
eas build --profile production   # App Store / Play Store
```

Before building, update `app.json` > `extra.eas.projectId` with your EAS project ID, and `eas.json` > `submit` with your Apple/Google credentials.

## Security

- Row Level Security on all tables
- Credentials stored via `expo-secure-store`
- Environment variables via `.env` (gitignored)
- Edge functions validate JWT tokens
- Database functions use `SECURITY DEFINER` with locked `search_path`

## License

Private and proprietary.
