import React from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { 
  GestureHandlerRootView, 
  Gesture, 
  GestureDetector 
} from 'react-native-gesture-handler';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import { getFullUrl } from '../store/authStore';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.25;

const SwipeCard = ({ profile, onLike, onDislike, onShowInfo }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        if (event.translationX > 0) {
          translateX.value = withSpring(width * 1.5);
          runOnJS(onLike)(profile);
        } else {
          translateX.value = withSpring(-width * 1.5);
          runOnJS(onDislike)(profile);
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value, 
      [-width / 2, 0, width / 2], 
      [-10, 0, 10], 
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` }
      ]
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, width / 4], [0, 1], Extrapolate.CLAMP)
  }));

  const dislikeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-width / 4, 0], [1, 0], Extrapolate.CLAMP)
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image 
          source={{ uri: getFullUrl(profile.photoUrl, 'https://via.placeholder.com/400x600?text=SexoFacil') }} 
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.overlay}>
          <Text style={styles.name}>{profile.nickname || profile.name}, {profile.age}</Text>
          <Text style={styles.location}>📍 {profile.city}{profile.uf ? `/${profile.uf}` : ''}</Text>
          <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
        </View>

        {/* Lables de Like/Nope */}
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
           <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.dislikeLabel, dislikeOpacity]}>
           <Text style={styles.dislikeText}>NOPE</Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    width: width - 32,
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  name: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10
  },
  location: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
    marginTop: 4,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    borderWidth: 4,
    borderColor: '#4ade80',
    paddingHorizontal: 16,
    borderRadius: 8,
    transform: [{ rotate: '-30deg' }]
  },
  likeText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#4ade80'
  },
  dislikeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    borderWidth: 4,
    borderColor: '#ef4444',
    paddingHorizontal: 16,
    borderRadius: 8,
    transform: [{ rotate: '30deg' }]
  },
  dislikeText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ef4444'
  }
});

export default SwipeCard;
