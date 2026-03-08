import { Platform, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useAuthStore } from '../store';

export function useAppleAuth() {
  const { signInWithAppleIdToken } = useAuthStore();

  const signInWithApple = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS.');
      return;
    }

    try {
      // Generate a random nonce for security
      const rawNonce = Crypto.getRandomValues(new Uint8Array(32))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        Alert.alert('Sign In Failed', 'No identity token received from Apple.');
        return;
      }

      const { error } = await signInWithAppleIdToken(credential.identityToken, rawNonce);
      if (error) {
        Alert.alert('Sign In Failed', error);
      }
    } catch (error: any) {
      // User cancelled — don't show an alert
      if (error.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Sign In Failed', error.message || 'Apple sign in failed');
    }
  };

  return { signInWithApple };
}
