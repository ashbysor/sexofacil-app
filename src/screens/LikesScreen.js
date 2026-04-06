import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl, Dimensions, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import useAuthStore, { api, getFullUrl } from '../store/authStore';
import useLikeStore from '../store/likeStore';
import { COLORS, SPACING } from '../constants/theme';
import { Heart, Lock } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - SPACING.lg * 2 - SPACING.md) / 2;

const LikeItem = React.memo(({ user, onPress, isSubscriber }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(user)}>
    <Image 
      source={{ uri: getFullUrl(user.photoUrl, 'https://via.placeholder.com/200') }} 
      style={[styles.image, !isSubscriber && styles.blurredImage]} 
      blurRadius={!isSubscriber ? 20 : 0}
    />
    <View style={styles.overlay}>
      <Text style={styles.name}>{user.nickname || user.name}, {user.age}</Text>
      <Text style={styles.location}>📍 {user.city}/{user.uf}</Text>
    </View>
    {!isSubscriber && (
      <View style={styles.lockContainer}>
        <Lock color="white" size={24} />
      </View>
    )}
  </TouchableOpacity>
));

const LikesScreen = () => {
  const { likes, fetchLikes, loading } = useLikeStore();
  const { user } = useAuthStore();
  const isSubscriber = user?.isSubscriber;
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      fetchLikes();
    }, [])
  );

  const handleUserClick = (targetUser) => {
    if (!isSubscriber) {
      Alert.alert(
        'SexoFacil Premium',
        'Assine o Premium para ver quem te curtiu e desbloquear fotos!',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ver Planos', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }
    // Abrir detalhes ou Swipe logic
    Alert.alert('Funcionalidade', 'Deseja curtir de volta?', [
        { text: 'Ignorar', style: 'cancel' },
        { text: 'CURTIR ❤️', onPress: async () => {
            try {
                await api.post(`/explore/swipe/${targetUser.id}`, { action: 'LIKE' });
                fetchLikes();
                Alert.alert('Match!', 'Vocês agora podem conversar!');
            } catch(e) {}
        }}
    ]);
  };

  const renderItem = useCallback(({ item }) => (
    <LikeItem user={item} onPress={handleUserClick} isSubscriber={isSubscriber} />
  ), [isSubscriber]);

  if (loading && likes.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quem curtiu você</Text>
      </View>

      <FlatList
        data={likes}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLikes} color={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Heart color="#e5e7eb" size={60} />
            <Text style={styles.emptyText}>Nenhuma curtida ainda.</Text>
            <Text style={styles.emptySub}>Continue explorando para ser visto!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  list: {
    padding: SPACING.lg,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  card: {
    width: ITEM_WIDTH,
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    overflow: 'hidden',
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurredImage: {
    opacity: 0.6,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  name: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  location: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  lockContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  }
});

export default LikesScreen;
