import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import ErrorBoundary from './src/components/ErrorBoundary';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import AnimatedSplash from './src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const notificationResponseListener = useRef<Notifications.EventSubscription>(null!);
  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);

  const [fontsLoaded] = useFonts({
    'Nunito': require('./assets/fonts/Nunito-Variable.ttf'),
    'Caveat': require('./assets/fonts/Caveat-Variable.ttf'),
  });

  // Hide native splash as soon as our animated splash is mounted
  useEffect(() => {
    if (splashReady) {
      SplashScreen.hideAsync();
    }
  }, [splashReady]);

  useEffect(() => {
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (navigationRef.isReady()) {
          if (data?.type === 'new_message' && data?.matchId) {
            navigationRef.navigate('Chat' as never, { matchId: data.matchId } as never);
          } else if (data?.type === 'new_match') {
            navigationRef.navigate('Tabs' as never, { screen: 'Matches' } as never);
          } else if (data?.type === 'community_dealbreaker' && data?.questionId) {
            navigationRef.navigate('AnswerCommunityDealBreaker' as never, { questionId: data.questionId } as never);
          }
        }
      });

    return () => {
      notificationResponseListener.current?.remove();
    };
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReducedMotionConfig mode={ReduceMotion.Never} />
      {fontsLoaded && !showSplash && (
        <ErrorBoundary>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </SafeAreaProvider>
        </ErrorBoundary>
      )}
      {showSplash && (
        <AnimatedSplash
          onComplete={handleSplashComplete}
          onReady={() => setSplashReady(true)}
        />
      )}
    </GestureHandlerRootView>
  );
}
