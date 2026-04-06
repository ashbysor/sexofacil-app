import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, Modal, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Heart, Info, MessageCircle, RotateCcw } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import * as Haptics from 'expo-haptics';

import useAuthStore, { api, getFullUrl } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';
import SwipeCard from '../components/SwipeCard';

const { width, height } = Dimensions.get('window');

const ExploreScreen = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState(null);
  
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/explore');
      setProfiles(res.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('[EXPLORE-FETCH-ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSwipe = async (profile, action) => {
    try {
      const res = await api.post(`/explore/swipe/${profile.id}`, { action });
      if (res.data.match) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMatchPopup({
          ...res.data.targetUser,
          matchData: res.data.matchData
        });
      } else if (action === 'LIKE') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      // Avança para o próximo perfil localmente após o swipe
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.log('[SWIPE-ERROR]', err.message);
    }
  };

  const handleLike = (profile) => handleSwipe(profile, 'LIKE');
  const handleDislike = (profile) => handleSwipe(profile, 'DISLIKE');

  if (loading && profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GestureHandlerRootView style={styles.content}>
        
        {/* Header App Name */}
        <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={{ width: 32, height: 32, marginRight: 8, borderRadius: 8 }}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>SexoFacil</Text>
            </View>
            <TouchableOpacity onPress={fetchProfiles}>
                <RotateCcw size={24} color={COLORS.textLight} />
            </TouchableOpacity>
        </View>

        {/* Stack of Cards */}
        <View style={styles.cardsContainer}>
           {profiles.slice(currentIndex).reverse().map((profile, i, arr) => {
             const isTop = i === arr.length - 1;
             return (
               <SwipeCard 
                  key={profile.id}
                  profile={profile}
                  onLike={handleLike}
                  onDislike={handleDislike}
                  disabled={!isTop}
               />
             );
           })}

           {currentIndex >= profiles.length && !loading && (
             <View style={styles.centerContainer}>
                <Text style={styles.noProfilesText}>Não há mais perfis por perto.</Text>
                <TouchableOpacity style={styles.reloadBtn} onPress={fetchProfiles}>
                    <Text style={styles.reloadText}>RECARREGAR</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>

        {/* Actions Bar (Fitts' Law: Bottom of the screen) */}
        <View style={styles.actionsBar}>
            <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={() => handleDislike(profiles[currentIndex])}>
                <X color="#ef4444" size={32} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.infoBtn} onPress={() => Alert.alert('Perfil', profiles[currentIndex]?.bio || 'Sem bio')}>
                <Info color={COLORS.textLight} size={24} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleLike(profiles[currentIndex])}>
                <Heart color="#4ade80" size={32} fill="#4ade80" />
            </TouchableOpacity>
        </View>

        {/* Match Popup Native Modal */}
        <Modal visible={!!matchPopup} animationType="fade" transparent>
           <View style={styles.modalBackdrop}>
             <View style={styles.modalContent}>
                <Text style={styles.matchTitle}>🎉 Deu Match!</Text>
                <Text style={styles.matchSubtitle}>Você e {matchPopup?.nickname || matchPopup?.name} curtiram um ao outro.</Text>
                
                <View style={styles.matchPhotos}>
                   <Image source={{ uri: getFullUrl(user?.photoUrl, '') }} style={styles.matchPhoto} />
                   <Image source={{ uri: getFullUrl(matchPopup?.photoUrl, '') }} style={styles.matchPhoto} />
                </View>

                <TouchableOpacity 
                   style={styles.chatBtn} 
                    onPress={() => {
                        const mId = matchPopup.matchData.id;
                        const targetUser = matchPopup; // Contém id, name, nickname, photoUrl etc
                        setMatchPopup(null);
                        navigation.navigate('Chat', { screen: 'ChatRoom', params: { roomId: mId, otherUser: targetUser } });
                    }}
                >
                    <MessageCircle color="white" size={20} />
                    <Text style={styles.chatBtnText}>ENVIAR MENSAGEM</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setMatchPopup(null)}>
                    <Text style={styles.closeBtnText}>Voltar ao explorar</Text>
                </TouchableOpacity>
             </View>
           </View>
        </Modal>

      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.md,
  },
  appName: {
      fontSize: 28,
      fontWeight: '900',
      color: COLORS.primary,
      fontStyle: 'italic',
      letterSpacing: -1
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noProfilesText: {
    fontSize: 18,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  reloadBtn: {
      marginTop: 20,
      backgroundColor: COLORS.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 999
  },
  reloadText: {
    color: 'white',
    fontWeight: '900',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  infoBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'white',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
  },
  // Modal Match
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
      width: width * 0.9,
      backgroundColor: 'transparent',
      alignItems: 'center',
  },
  matchTitle: {
      fontSize: 36,
      fontWeight: '900',
      color: COLORS.primary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 10
  },
  matchSubtitle: {
      color: 'white',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 30
  },
  matchPhotos: {
      flexDirection: 'row',
      marginBottom: 40
  },
  matchPhoto: {
      width: 120,
      height: 120,
      borderRadius: 60,
      borderWidth: 4,
      borderColor: 'white',
      marginHorizontal: -10
  },
  chatBtn: {
      backgroundColor: COLORS.primary,
      flexDirection: 'row',
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 30,
      alignItems: 'center',
      marginBottom: 20
  },
  chatBtnText: {
      color: 'white',
      fontWeight: '900',
      marginLeft: 10
  },
  closeBtnText: {
      color: 'white',
      fontSize: 16,
      opacity: 0.8
  }
});

export default ExploreScreen;
