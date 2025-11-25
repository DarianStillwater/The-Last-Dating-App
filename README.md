# 💕 The Last Dating App

A modern, feature-rich dating application built with React Native and Expo, designed to help people find meaningful connections.

## 🌟 Features

### Core Features
- **Smart Profile Matching** - Advanced algorithm considers deal breakers and preferences
- **Swipe Interface** - Intuitive Tinder-style card swiping
- **Real-time Messaging** - Chat with your matches instantly
- **Daily Message Limits** - Encourages meaningful conversations
- **Date Suggestions** - Integrated venue recommendations
- **Profile Reviews** - Community-driven profile accuracy verification

### User Experience
- **Comprehensive Profiles** - Detailed information about lifestyle, values, and preferences
- **Deal Breakers** - Set your non-negotiables for better matches
- **Photo Management** - Multiple photos with secure cloud storage
- **Location-based Matching** - Find people nearby
- **Match Limit** - Quality over quantity approach

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo SDK 54** - Simplified development workflow
- **TypeScript** - Type-safe code
- **Zustand** - Lightweight state management
- **React Navigation** - Seamless navigation

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
  - Cloud storage for photos

### Key Libraries
- `expo-linear-gradient` - Beautiful gradients
- `expo-camera` - Photo capture
- `expo-image-picker` - Photo selection
- `date-fns` - Date formatting
- `react-native-gesture-handler` - Smooth interactions
- `react-native-reanimated` - Performant animations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac) or Android Emulator
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DarianStillwater/The-Last-Dating-App.git
   cd The-Last-Dating-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Set up Supabase database**
   
   - Go to your Supabase project
   - Open the SQL Editor
   - Copy and paste the contents of `supabase_schema.sql`
   - Run the SQL script

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run on your device**
   - Scan the QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS Simulator
   - Or press `a` for Android Emulator

## 📁 Project Structure

```
last-dating-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── cards/       # SwipeCard component
│   │   └── ui/          # Button, Input components
│   ├── screens/         # App screens
│   │   ├── auth/        # Authentication screens
│   │   ├── matching/    # Discovery and profile screens
│   │   ├── messaging/   # Chat and matches screens
│   │   ├── profile/     # Profile setup screens
│   │   ├── settings/    # Settings and edit screens
│   │   └── venues/      # Date suggestion screens
│   ├── navigation/      # Navigation configuration
│   ├── store/           # Zustand state management
│   ├── lib/             # Supabase client and utilities
│   ├── types/           # TypeScript type definitions
│   └── constants/       # App constants and configs
├── assets/              # Images and static files
├── supabase_schema.sql  # Complete database schema
├── App.tsx              # Root component
└── package.json         # Dependencies
```

## 🗄️ Database Schema

The app uses 11 main tables:

1. **profiles** - User profiles and information
2. **deal_breakers** - User matching preferences
3. **swipes** - Like/pass actions
4. **matches** - Mutual matches
5. **messages** - Chat messages
6. **message_limits** - Daily message tracking
7. **venues** - Partner restaurants/locations
8. **date_suggestions** - Proposed dates
9. **profile_reviews** - Profile accuracy reviews
10. **reports** - User reports
11. **blocks** - Blocked users

See `supabase_schema.sql` for the complete schema with RLS policies and functions.

## 🔒 Security

- **Row Level Security (RLS)** - All tables protected with RLS policies
- **Secure Storage** - Credentials stored using Expo SecureStore
- **Environment Variables** - Sensitive data in .env (not committed)
- **Authentication** - Supabase Auth with email/password

## 🎨 Design Philosophy

- **Modern UI** - Clean, minimalist interface
- **Smooth Animations** - Polished user experience
- **Accessibility** - Designed for all users
- **Performance** - Optimized for mobile devices

## 📱 App Configuration

Key settings in `app.json`:
- Expo SDK 54
- Portrait orientation only
- iOS and Android support
- Custom splash screen and icons

## 🔧 Development

### Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web (limited support)

### Key Configuration Files

- `metro.config.js` - Metro bundler configuration
- `tsconfig.json` - TypeScript configuration
- `app.json` - Expo app configuration
- `.gitignore` - Git ignore rules

## 🚢 Deployment

### Building for Production

1. **iOS**
   ```bash
   eas build --platform ios
   ```

2. **Android**
   ```bash
   eas build --platform android
   ```

See [Expo EAS Build](https://docs.expo.dev/build/introduction/) for detailed instructions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👤 Author

**Darian Stillwater**

## 🙏 Acknowledgments

- Expo team for the amazing framework
- Supabase for the backend infrastructure
- React Native community for excellent libraries

---

**Note:** Remember to add your Supabase credentials to `.env` before running the app!
