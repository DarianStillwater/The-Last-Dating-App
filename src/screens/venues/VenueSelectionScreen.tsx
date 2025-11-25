import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useVenueStore } from '../../store';
import { COLORS, VENUE_CATEGORIES } from '../../constants';
import Button from '../../components/ui/Button';
import type { Venue } from '../../types';

const VenueSelectionScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { matchId, category } = route.params;

  const { venues, selectedVenue, isLoading, fetchVenuesForMatch, selectVenue, submitDateSuggestion } = useVenueStore();

  useEffect(() => {
    fetchVenuesForMatch(matchId, category);
  }, [matchId, category]);

  const handleSelectVenue = async () => {
    if (!selectedVenue) return;
    const { error } = await submitDateSuggestion(matchId, selectedVenue.id);
    if (!error) {
      navigation.goBack();
      navigation.goBack();
    }
  };

  const renderVenue = ({ item }: { item: Venue }) => {
    const isSelected = selectedVenue?.id === item.id;
    const categoryInfo = VENUE_CATEGORIES.find((c) => c.value === item.category);

    return (
      <TouchableOpacity
        style={[styles.venueCard, isSelected && styles.venueCardSelected]}
        onPress={() => selectVenue(isSelected ? null : item)}
      >
        <Image
          source={{ uri: item.photo_urls[0] || 'https://via.placeholder.com/200' }}
          style={styles.venueImage}
        />
        <View style={styles.venueInfo}>
          <View style={styles.venueHeader}>
            <Text style={styles.venueName}>{item.name}</Text>
            {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryEmoji}>{categoryInfo?.emoji}</Text>
            <Text style={styles.categoryText}>{categoryInfo?.label}</Text>
          </View>
          {item.description && (
            <Text style={styles.venueDescription} numberOfLines={2}>{item.description}</Text>
          )}
          <Text style={styles.venueAddress}>{item.address}</Text>
          
          <View style={styles.venueActions}>
            {item.menu_url && (
              <TouchableOpacity
                style={styles.venueAction}
                onPress={() => Linking.openURL(item.menu_url!)}
              >
                <Ionicons name="restaurant-outline" size={16} color={COLORS.primary} />
                <Text style={styles.venueActionText}>Menu</Text>
              </TouchableOpacity>
            )}
            {item.website_url && (
              <TouchableOpacity
                style={styles.venueAction}
                onPress={() => Linking.openURL(item.website_url!)}
              >
                <Ionicons name="globe-outline" size={16} color={COLORS.primary} />
                <Text style={styles.venueActionText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {category ? VENUE_CATEGORIES.find((c) => c.value === category)?.label : 'All Venues'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding venues near you both...</Text>
        </View>
      ) : venues.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No venues found</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't find any venues in this category near your midpoint.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultsInfo}>
            {venues.length} curated {venues.length === 1 ? 'spot' : 'spots'} near you both
          </Text>
          
          <FlatList
            data={venues}
            keyExtractor={(item) => item.id}
            renderItem={renderVenue}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {selectedVenue && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Button
            title={`Suggest ${selectedVenue.name}`}
            onPress={handleSelectVenue}
            fullWidth
            size="large"
          />
        </View>
      )}
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsInfo: {
    fontSize: 14,
    color: COLORS.textSecondary,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  venueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  venueCardSelected: {
    borderColor: COLORS.primary,
  },
  venueImage: {
    width: '100%',
    height: 160,
  },
  venueInfo: {
    padding: 16,
  },
  venueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceVariant,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  venueDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  venueAddress: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  venueActions: {
    flexDirection: 'row',
    gap: 16,
  },
  venueAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  venueActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default VenueSelectionScreen;
