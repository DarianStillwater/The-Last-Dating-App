import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';
import { useAuthStore } from '../store';

// Complete any in-progress auth sessions when the app returns from the browser
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export function useGoogleAuth() {
  const { signInWithGoogleIdToken } = useAuthStore();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
    ...(GOOGLE_ANDROID_CLIENT_ID ? { androidClientId: GOOGLE_ANDROID_CLIENT_ID } : {}),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params.id_token;
      if (idToken) {
        signInWithGoogleIdToken(idToken).then(({ error }) => {
          if (error) {
            Alert.alert('Sign In Failed', error);
          }
        });
      }
    } else if (response?.type === 'error') {
      Alert.alert('Sign In Failed', response.error?.message || 'Google sign in failed');
    }
  }, [response]);

  const signInWithGoogle = () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert('Configuration Error', 'Google sign in is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.');
      return;
    }
    promptAsync();
  };

  return { signInWithGoogle, isReady: !!request };
}
