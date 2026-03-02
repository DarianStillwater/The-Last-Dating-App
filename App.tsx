import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';

export default function App() {
  const notificationResponseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Handle notification taps - navigate to relevant screen
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (navigationRef.isReady()) {
          if (data?.type === 'new_message' && data?.matchId) {
            navigationRef.navigate('Chat' as never, { matchId: data.matchId } as never);
          } else if (data?.type === 'new_match') {
            navigationRef.navigate('Tabs' as never, { screen: 'Matches' } as never);
          }
        }
      });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(notificationResponseListener.current);
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
