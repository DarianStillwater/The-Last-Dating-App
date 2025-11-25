import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useMatchStore } from '../../store';
import { COLORS, calculateAge } from '../../constants';
import type { Match } from '../../types';

const MatchesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { matches, isLoading, fetchMatches } = useMatchStore();

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const newMatches = matches.filter((m) => m.total_messages === 0);
  const activeConversations = matches.filter((m) => m.total_messages > 0);

  const renderNewMatch = ({ item }: { item: Match }) => {
    const profile = item.other_user;
    if (!profile) return null;

    return (
      <TouchableOpacity
        style={styles.newMatchItem}
        onPress={() => navigation.navigate('Chat', { matchId: item.id })}
      >
        <Image
          source={{ uri: profile.main_photo_url }}
          style={styles.newMatchPhoto}
        />
        <Text style={styles.newMatchName} numberOfLines={1}>
          {profile.first_name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderConversation = ({ item }: { item: Match }) => {
    const profile = item.other_user;
    if (!profile) return null;

    const age = calculateAge(profile.birth_date);
    const timeAgo = item.last_message_at
      ? formatDistanceToNow(new Date(item.last_message_at), { addSuffix: true })
      : 'New match';

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { matchId: item.id })}
      >
        <Image
          source={{ uri: profile.main_photo_url }}
          style={styles.conversationPhoto}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>
              {profile.first_name}, {age}
            </Text>
            <Text style={styles.conversationTime}>{timeAgo}</Text>
          </View>
          <Text style={styles.conversationPreview} numberOfLines={1}>
            {item.last_message_preview || 'Start the conversation!'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="heart-outline" size={64} color={COLORS.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No matches yet</Text>
      <Text style={styles.emptySubtitle}>
        Keep swiping to find your{'\n'}perfect match!
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Matches</Text>
        <Text style={styles.matchCount}>{matches.length} matches</Text>
      </View>

      <FlatList
        data={[{ type: 'content' }]}
        keyExtractor={() => 'content'}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchMatches}
            tintColor={COLORS.primary}
          />
        }
        renderItem={() => (
          <>
            {/* New Matches Section */}
            {newMatches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>New Matches</Text>
                <FlatList
                  data={newMatches}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.newMatchesList}
                  renderItem={renderNewMatch}
                />
              </View>
            )}

            {/* Conversations Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {activeConversations.length > 0 ? 'Conversations' : ''}
              </Text>
              {activeConversations.length > 0 ? (
                activeConversations.map((item) => (
                  <View key={item.id}>{renderConversation({ item })}</View>
                ))
              ) : newMatches.length === 0 ? (
                <EmptyState />
              ) : null}
            </View>
          </>
        )}
        ListEmptyComponent={matches.length === 0 ? <EmptyState /> : null}
        contentContainerStyle={styles.listContent}
      />
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
  matchCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  newMatchesList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  newMatchItem: {
    alignItems: 'center',
    width: 80,
  },
  newMatchPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: COLORS.primary,
    marginBottom: 8,
  },
  newMatchName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  conversationPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  conversationPreview: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingTop: 80,
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

export default MatchesScreen;
