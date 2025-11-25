import React, { useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile } from '../../types';
import { COLORS, calculateAge, cmToFeetInches } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

interface SwipeCardProps {
  profile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress: () => void;
  isFirst: boolean;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onPress,
  isFirst,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  const photoIndex = useRef(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

  const allPhotos = [profile.main_photo_url, ...(profile.photo_urls || [])].filter(Boolean) as string[];

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return isFirst && Math.abs(gesture.dx) > 5;
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipeRight();
      position.setValue({ x: 0, y: 0 });
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipeLeft();
      position.setValue({ x: 0, y: 0 });
    });
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const handlePhotoPress = (side: 'left' | 'right') => {
    if (side === 'right' && currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    } else if (side === 'left' && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const cardStyle = isFirst
    ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: rotation },
        ],
      }
    : {
        transform: [{ scale: nextCardScale }],
      };

  const age = calculateAge(profile.birth_date);

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        style={styles.cardTouchable}
      >
        {/* Photo */}
        <Image
          source={{ uri: allPhotos[currentPhotoIndex] }}
          style={styles.photo}
          resizeMode="cover"
        />

        {/* Photo navigation areas */}
        <TouchableOpacity
          style={styles.photoNavLeft}
          onPress={() => handlePhotoPress('left')}
        />
        <TouchableOpacity
          style={styles.photoNavRight}
          onPress={() => handlePhotoPress('right')}
        />

        {/* Photo indicators */}
        {allPhotos.length > 1 && (
          <View style={styles.photoIndicators}>
            {allPhotos.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.photoIndicator,
                  index === currentPhotoIndex && styles.photoIndicatorActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Like/Nope stamps */}
        {isFirst && (
          <>
            <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
              <Text style={[styles.stampText, styles.likeText]}>LIKE</Text>
            </Animated.View>
            <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
              <Text style={[styles.stampText, styles.nopeText]}>NOPE</Text>
            </Animated.View>
          </>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        {/* Profile info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.first_name}</Text>
            <Text style={styles.age}>{age}</Text>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detail}>
              <Ionicons name="resize-outline" size={16} color="#FFF" />
              <Text style={styles.detailText}>{cmToFeetInches(profile.height_cm)}</Text>
            </View>
            {profile.occupation && (
              <View style={styles.detail}>
                <Ionicons name="briefcase-outline" size={16} color="#FFF" />
                <Text style={styles.detailText}>{profile.occupation}</Text>
              </View>
            )}
          </View>

          {profile.bio && (
            <Text style={styles.bio} numberOfLines={2}>
              {profile.bio}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      {isFirst && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.nopeButton]}
            onPress={swipeLeft}
          >
            <Ionicons name="close" size={32} color={COLORS.error} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={swipeRight}
          >
            <Ionicons name="heart" size={32} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 32,
    height: SCREEN_HEIGHT * 0.7,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  cardTouchable: {
    flex: 1,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 100,
    width: '30%',
  },
  photoNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 100,
    width: '30%',
  },
  photoIndicators: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
  },
  photoIndicatorActive: {
    backgroundColor: '#FFF',
  },
  stamp: {
    position: 'absolute',
    top: 60,
    padding: 12,
    borderWidth: 4,
    borderRadius: 8,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    right: 24,
    borderColor: COLORS.success,
  },
  nopeStamp: {
    left: 24,
    borderColor: COLORS.error,
  },
  stampText: {
    fontSize: 32,
    fontWeight: '800',
  },
  likeText: {
    color: COLORS.success,
  },
  nopeText: {
    color: COLORS.error,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginRight: 8,
  },
  age: {
    fontSize: 26,
    fontWeight: '400',
    color: '#FFF',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#FFF',
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  actions: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nopeButton: {
    borderWidth: 2,
    borderColor: COLORS.error,
  },
  likeButton: {
    borderWidth: 2,
    borderColor: COLORS.success,
  },
});

export default SwipeCard;
