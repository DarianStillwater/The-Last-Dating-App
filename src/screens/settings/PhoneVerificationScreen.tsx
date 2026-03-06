import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { useTrustStore } from '../../store';
import { COLORS } from '../../constants';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const PhoneVerificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { linkPhone, verifyPhoneCode, isLoading } = useTrustStore();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const handleSendCode = async () => {
    if (!phone.trim()) return;

    const { error } = await linkPhone(phone.trim());
    if (error) {
      Alert.alert('Error', error);
      return;
    }
    setStep('code');
  };

  const handleVerify = async () => {
    if (!code.trim()) return;

    const { error } = await verifyPhoneCode(phone.trim(), code.trim());
    if (error) {
      Alert.alert('Error', error);
      return;
    }

    Alert.alert('Verified!', 'Your phone number has been verified.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Phone</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="phone-portrait-outline" size={48} color={COLORS.primary} />
        </View>

        {step === 'phone' ? (
          <>
            <Text style={styles.title}>Add your phone number</Text>
            <Text style={styles.description}>
              We'll send a verification code via SMS. This helps build trust with your matches.
            </Text>
            <Input
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Send Code"
                onPress={handleSendCode}
                disabled={!phone.trim() || isLoading}
                loading={isLoading}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Enter verification code</Text>
            <Text style={styles.description}>
              We sent a 6-digit code to {phone}
            </Text>
            <Input
              placeholder="000000"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Verify"
                onPress={handleVerify}
                disabled={code.length < 6 || isLoading}
                loading={isLoading}
              />
            </View>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => setStep('phone')}
            >
              <Text style={styles.resendText}>Change number or resend</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default PhoneVerificationScreen;
