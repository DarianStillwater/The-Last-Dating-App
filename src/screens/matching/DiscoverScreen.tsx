import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import SwipeCard from '../../components/cards/SwipeCard';
import Button from '../../components/ui/Button';
import { useMatchStore, useAuthStore } from '../../store';
import { COLORS, APP_CONFIG } from '../../constants';

const DiscoverScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const {
    discoverProfiles,
    currentIndex,
    isLoading,
    hasReachedLimit,
    matches,
    fetchDiscoverProfiles,
    fetchMatches,
    swipeRight,
    swipeLeft,
    refreshDiscovery,
  } = useMatchStore();

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
      fetchDiscoverProfiles();
    }, [])
  );

  const handleSwipeRight = async () => {
    const profile = discoverProfiles[currentIndex];
    if (!profile) return;

    const { match, error } = await swipeRight(profile.id);
    
    if (error) {
      Alert.alert('Oops', error);
      return;
    }

    if (match) {
      Alert.alert(
        '🎉 It\'s a Match!',
        `You and ${match.other_user?.first_name} liked each other!`,
        [
          { text: 'Keep Swiping', style: 'cancel' },
          { text: 'Send Message', onPress: () => navigation.navigate('Chat', { matchId: match.id }) },
        ]
      );
    }
  };

  const handleSwipeLeft = () => {
    const profile = discoverProfiles[currentIndex];
    if (!profile) return;
    swipeLeft(profile.id);
  };

  const handleProfilePress = () => {
    const profile = discoverProfiles[currentIndex];
    if (!profile) return;
    navigation.navigate('ProfileDetail', { userId: profile.id });
  };

  const currentProfile = discoverProfiles[currentIndex];
  const nextProfile = discoverProfiles[currentIndex + 1];

  // Match limit reached state
  if (hasReachedLimit) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart" size={64} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>Match limit reached!</Text>
          <Text style={styles.emptySubtitle}>
            You have {APP_CONFIG.MAX_MATCHES} active matches.{'\n'}
            Unmatch someone to keep swiping.
          </Text>
          <Button
            title="View Matches"
            onPress={() => navigation.navigate('Matches')}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading && discoverProfiles.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </View>
    );
  }

  // No profiles state
  if (!currentProfile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.emptyScrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshDiscovery}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="compass-outline" size={64} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No more profiles</Text>
            <Text style={styles.emptySubtitle}>
              Check back later or adjust your{'\n'}deal breakers to see more people.
            </Text>
            <Button
              title="Refresh"
              onPress={refreshDiscovery}
              variant="outline"
              style={{ marginTop: 24 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <View style={styles.matchCounter}>
          <Ionicons name="heart" size={16} color={COLORS.primary} />
          <Text style={styles.matchCountText}>
            {matches.length}/{APP_CONFIG.MAX_MATCHES}
          </Text>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.cardContainer}>
        {/* Background card (next profile preview) */}
        {nextProfile && (
          <SwipeCard
            key={`next-${nextProfile.id}`}
            profile={nextProfile}
            onSwipeLeft={() => {}}
            onSwipeRight={() => {}}
            onPress={() => {}}
            isFirst={false}
          />
        )}

        {/* Front card (current profile) */}
        <SwipeCard
          key={`current-${currentProfile.id}`}
          profile={currentProfile}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onPress={handleProfilePress}
          isFirst={true}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  matchCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  matchCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyScrollContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default DiscoverScreen;
