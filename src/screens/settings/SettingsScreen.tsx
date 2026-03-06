import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import HintBubble from '../../components/HintBubble';
import { useAuthStore, useProfileStore, useTrustStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants';
import { getNotificationPermissionStatus, deactivateToken, reactivateToken } from '../../lib/notifications';

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOut, user } = useAuthStore();
  const { profile, pauseProfile, deleteAccount } = useProfileStore();

  const { ownSocialLinks, fetchSocialLinks, fetchOwnTrust } = useTrustStore();

  const [notifications, setNotifications] = useState(true);
  const [isPaused, setIsPaused] = useState(profile?.is_paused || false);
  const [expandedSection, setExpandedSection] = useState<string | null>('notifications');

  useEffect(() => {
    getNotificationPermissionStatus().then(setNotifications);
    fetchSocialLinks();
    fetchOwnTrust();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotifications(value);
    if (!user?.id) return;
    if (value) {
      await reactivateToken(user.id);
    } else {
      await deactivateToken(user.id);
    }
  };

  const handlePause = async (value: boolean) => {
    setIsPaused(value);
    await pauseProfile(value);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? Your data will be retained for potential reactivation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', error);
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, label, value, onPress, toggle, danger }: any) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={toggle !== undefined}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? COLORS.error : COLORS.primary} />
      </View>
      <Text style={[styles.settingLabel, danger && styles.settingLabelDanger]}>{label}</Text>
      {toggle !== undefined ? (
        <Switch
          value={toggle}
          onValueChange={onPress}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={toggle ? COLORS.primary : COLORS.textLight}
        />
      ) : value ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title, sectionKey }: { title: string; sectionKey: string }) => (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      <Ionicons
        name={expandedSection === sectionKey ? 'chevron-up' : 'chevron-down'}
        size={18}
        color={COLORS.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <SectionHeader title="NOTIFICATIONS" sectionKey="notifications" />
        {expandedSection === 'notifications' && (
          <SettingItem
            icon="notifications-outline"
            label="Push Notifications"
            toggle={notifications}
            onPress={handleNotificationToggle}
          />
        )}

        <SectionHeader title="ACCOUNT" sectionKey="account" />
        {expandedSection === 'account' && (
          <>
            <SettingItem icon="pause-circle-outline" label="Pause Profile" toggle={isPaused} onPress={handlePause} />
            <SettingItem icon="mail-outline" label="Email" value={profile?.email} />
            <SettingItem
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => {
                Alert.alert(
                  'Reset Password',
                  'We\'ll send a password reset link to your email.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send Link',
                      onPress: async () => {
                        if (profile?.email) {
                          const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
                          if (error) {
                            Alert.alert('Error', error.message);
                          } else {
                            Alert.alert('Sent', 'Check your email for a password reset link.');
                          }
                        }
                      },
                    },
                  ],
                );
              }}
            />
          </>
        )}

        <SectionHeader title="PRIVACY & SAFETY" sectionKey="privacy" />
        {expandedSection === 'privacy' && (
          <>
            {!profile?.phone_verified && (
              <SettingItem
                icon="phone-portrait-outline"
                label="Verify Phone Number"
                onPress={() => (navigation as any).navigate('PhoneVerification')}
              />
            )}
            {profile?.phone_verified && (
              <SettingItem icon="checkmark-circle" label="Phone Verified" value="Verified" />
            )}
            <SettingItem
              icon="logo-instagram"
              label={ownSocialLinks.find(l => l.provider === 'instagram')?.verified ? 'Instagram Linked' : 'Link Instagram'}
              value={ownSocialLinks.find(l => l.provider === 'instagram')?.verified ? 'Linked' : undefined}
              onPress={() => {
                if (!ownSocialLinks.find(l => l.provider === 'instagram')?.verified) {
                  Alert.alert('Coming Soon', 'Instagram linking will be available in a future update.');
                }
              }}
            />
            <SettingItem
              icon="logo-linkedin"
              label={ownSocialLinks.find(l => l.provider === 'linkedin')?.verified ? 'LinkedIn Linked' : 'Link LinkedIn'}
              value={ownSocialLinks.find(l => l.provider === 'linkedin')?.verified ? 'Linked' : undefined}
              onPress={() => {
                if (!ownSocialLinks.find(l => l.provider === 'linkedin')?.verified) {
                  Alert.alert('Coming Soon', 'LinkedIn linking will be available in a future update.');
                }
              }}
            />
            <SettingItem icon="shield-outline" label="Privacy Policy" onPress={() => Alert.alert('Privacy Policy', 'Our privacy policy will be available at launch. We never sell your data to third parties.')} />
            <SettingItem icon="document-text-outline" label="Terms of Service" onPress={() => Alert.alert('Terms of Service', 'Our terms of service will be available at launch. By using the app, you agree to treat all users with respect.')} />
            <SettingItem icon="help-circle-outline" label="Safety Tips" onPress={() => Alert.alert('Safety Tips', '• Always meet in a public place\n• Tell a friend where you\'re going\n• Trust your instincts\n• Never send money to someone you haven\'t met\n• Report suspicious behavior')} />
          </>
        )}

        <SectionHeader title="SUPPORT" sectionKey="support" />
        {expandedSection === 'support' && (
          <>
            <SettingItem icon="chatbox-outline" label="Contact Us" onPress={() => Linking.openURL('mailto:support@lastdatingapp.com')} />
            <SettingItem icon="bug-outline" label="Report a Problem" onPress={() => Linking.openURL('mailto:support@lastdatingapp.com?subject=Bug%20Report')} />
          </>
        )}

        <SectionHeader title="ACCOUNT ACTIONS" sectionKey="actions" />
        {expandedSection === 'actions' && (
          <>
            <SettingItem icon="log-out-outline" label="Sign Out" onPress={signOut} />
            <SettingItem icon="trash-outline" label="Delete Account" onPress={handleDeleteAccount} danger />
          </>
        )}
      </View>

      <Text style={styles.version}>The Last Dating App v1.0.0</Text>
      <HintBubble hintKey="settings_privacy" />
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
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  settingIconDanger: {
    backgroundColor: COLORS.error + '15',
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingLabelDanger: {
    color: COLORS.error,
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  version: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default SettingsScreen;
