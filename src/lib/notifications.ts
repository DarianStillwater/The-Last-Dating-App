import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Check existing permission
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return tokenData.data;
}

export async function saveTokenToDb(userId: string, token: string): Promise<void> {
  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS as 'ios' | 'android',
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,expo_push_token' }
  );
}

export async function deactivateToken(userId: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function reactivateToken(userId: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
}

export async function getNotificationPermissionStatus(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
