import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, Modal, Image, Dimensions, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { X, Heart, Info, MessageCircle, RotateCcw, Search, MapPin, Users, Sliders } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import useAuthStore, { api, getFullUrl } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';
import SwipeCard from '../components/SwipeCard';

const { width, height } = Dimensions.get('window');

const ExploreScreen = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matchPopup, setMatchPopup] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [genders, setGenders] = useState([]);
  const [filters, setFilters] = useState({
    uf: '',
    city: '',
    minAge: 18,
    maxAge: 90,
    genders: []
  });
  
  const navigation = useNavigation();
  const { user, checkAuth } = useAuthStore();

  const fetchProfiles = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const res = await api.get('/explore', { params: currentFilters });
      setProfiles(res.data);
      setCurrentIndex(0);
    } catch (err) {
      console.error('[EXPLORE-FETCH-ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [stRes, gRes] = await Promise.all([
        api.get('/location/states'),
        api.get('/genders')
      ]);
      setStates(stRes.data);
      setGenders(gRes.data);
    } catch (err) {}
  };

  useEffect(() => {
    loadMetadata();
    const init = async () => {
      const savedFilters = await SecureStore.getItemAsync('explore_filters');
      let initialFilters = filters;
      
      if (savedFilters) {
        initialFilters = JSON.parse(savedFilters);
      } else if (user?.interest) {
         const interests = user.interest.split(',').map(s => s.trim()).filter(Boolean);
         initialFilters = { ...filters, genders: interests };
      }
      
      // Enforce 18-90 constraints
      initialFilters.minAge = Math.max(18, initialFilters.minAge || 18);
      initialFilters.maxAge = Math.max(initialFilters.minAge + 1, Math.min(90, initialFilters.maxAge || 90));
      
      setFilters(initialFilters);
      fetchProfiles(initialFilters);
      
      const hasSet = await SecureStore.getItemAsync('explore_filters_set');
      if (!hasSet) setShowFilters(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (filters.uf) loadCities(filters.uf);
  }, [filters.uf]);

  const loadCities = async (uf) => {
    try {
      const res = await api.get(`/location/cities/${uf}`);
      setCities(res.data);
    } catch (err) {}
  };

  const handleApplyFilters = async () => {
    await SecureStore.setItemAsync('explore_filters', JSON.stringify(filters));
    await SecureStore.setItemAsync('explore_filters_set', '1');
    
    // Sync Interest to DB
    try {
      if (Array.isArray(filters.genders)) {
        const interestString = filters.genders.join(',');
        await api.put('/profile', { interest: interestString });
        await checkAuth();
      }
    } catch (err) {
      console.log('[FILTER-SYNC-ERROR]', err.message);
    }

    setShowFilters(false);
    fetchProfiles();
  };

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

  const currentProfile = profiles[currentIndex];

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
            <TouchableOpacity onPress={() => setShowFilters(true)}>
                <Search size={26} color={COLORS.primary} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={{ width: 32, height: 32, marginRight: 8, borderRadius: 8 }}
                  resizeMode="contain"
                />
                <Text style={styles.appName}>SexoFacil</Text>
            </View>
            <TouchableOpacity onPress={() => fetchProfiles()}>
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
                  onLike={() => handleSwipe(profile, 'LIKE')}
                  onDislike={() => handleSwipe(profile, 'DISLIKE')}
                  disabled={!isTop}
               />
             );
           })}

           {currentIndex >= profiles.length && !loading && (
             <View style={styles.centerContainer}>
                <Text style={styles.noProfilesText}>Não há mais perfis por perto.</Text>
                <TouchableOpacity style={styles.reloadBtn} onPress={() => fetchProfiles()}>
                    <Text style={styles.reloadText}>RECARREGAR</Text>
                </TouchableOpacity>
             </View>
           )}
        </View>

        {/* Actions Bar */}
        {currentProfile && (
          <View style={styles.actionsBar}>
              <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={() => handleSwipe(currentProfile, 'DISLIKE')}>
                  <X color="#ef4444" size={32} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.infoBtn} onPress={() => Alert.alert('Perfil', currentProfile?.bio || 'Sem bio')}>
                  <Info color={COLORS.textLight} size={24} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => handleSwipe(currentProfile, 'LIKE')}>
                  <Heart color="#4ade80" size={32} fill="#4ade80" />
              </TouchableOpacity>
          </View>
        )}

        {/* Filters Modal */}
        <Modal visible={showFilters} animationType="slide" transparent>
          <View style={styles.filtersOverlay}>
            <ScrollView style={styles.filtersContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sliders color={COLORS.primary} size={22} />
                  <Text style={styles.modalTitle}>FILTRAR BUSCA</Text>
                </View>
                <TouchableOpacity onPress={() => setShowFilters(false)}>
                  <X color={COLORS.textLight} size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <MapPin color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>LOCALIZAÇÃO</Text>
                </View>
                
                <TouchableOpacity 
                   style={styles.checkRow} 
                   onPress={() => setFilters(prev => ({ ...prev, uf: prev.uf ? '' : (user?.uf || ''), city: '' }))}
                >
                  <View style={[styles.checkbox, !!filters.uf && styles.checkboxActive]} />
                  <Text style={styles.checkLabel}>Filtrar por Estado</Text>
                </TouchableOpacity>

                {filters.uf && (
                    <View style={{ marginLeft: 30 }}>
                      <Text style={{ fontSize: 10, color: COLORS.textLight, fontWeight: 'bold', marginTop: 10 }}>ESTADO SELECIONADO</Text>
                      <TouchableOpacity style={styles.selectBtn} onPress={() => setShowStatePicker(true)}>
                        <Text style={styles.selectBtnText}>{filters.uf}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: 'bold' }}>ALTERAR</Text>
                      </TouchableOpacity>

                     <TouchableOpacity 
                        style={[styles.checkRow, { marginTop: 15 }]} 
                        onPress={() => setFilters(prev => ({ ...prev, city: prev.city ? '' : (user?.city || '') }))}
                      >
                        <View style={[styles.checkbox, !!filters.city && styles.checkboxActive]} />
                        <Text style={styles.checkLabel}>Filtrar por Cidade</Text>
                      </TouchableOpacity>

                      {filters.city && (
                        <TouchableOpacity style={styles.selectBtn}>
                          <Text>{filters.city}</Text>
                        </TouchableOpacity>
                      )}
                   </View>
                )}
              </View>

              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                  <Users color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>FAIXA ETÁRIA</Text>
                </View>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 10 }}>IDADE MÍNIMA: {filters.minAge} anos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {Array.from({ length: 73 }, (_, i) => i + 18).map(age => (
                       <TouchableOpacity 
                         key={`min-${age}`}
                         onPress={() => {
                           const newMin = Math.max(18, age);
                           setFilters(prev => ({ ...prev, minAge: newMin, maxAge: Math.max(newMin + 1, prev.maxAge) }));
                           Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                         }}
                         style={[styles.ageTag, filters.minAge === age && styles.ageTagActive]}
                       >
                         <Text style={[styles.ageTagText, filters.minAge === age && styles.ageTagTextActive]}>{age}</Text>
                       </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Idade Máxima Scroll */}
                <View>
                  <Text style={{ fontSize: 11, color: COLORS.textLight, fontWeight: 'bold', marginBottom: 10 }}>IDADE MÁXIMA: {filters.maxAge} anos</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                    {Array.from({ length: 72 }, (_, i) => i + Math.max(19, filters.minAge + 1)).map(age => {
                       if (age > 90) return null;
                       return (
                        <TouchableOpacity 
                          key={`max-${age}`}
                          onPress={() => {
                            setFilters(prev => ({ ...prev, maxAge: age }));
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[styles.ageTag, filters.maxAge === age && styles.ageTagActive]}
                        >
                          <Text style={[styles.ageTagText, filters.maxAge === age && styles.ageTagTextActive]}>{age === 90 ? '90+' : age}</Text>
                        </TouchableOpacity>
                       )
                    })}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.filterSection}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <Heart color={COLORS.primary} size={18} />
                  <Text style={styles.sectionTitle}>QUERO VER</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {genders.map(g => {
                    const isSelected = filters.genders.includes(g.name);
                    return (
                      <TouchableOpacity 
                        key={g.id} 
                        onPress={() => {
                          const updated = isSelected
                            ? filters.genders.filter(n => n !== g.name)
                            : [...filters.genders, g.name];
                          setFilters(prev => ({ ...prev, genders: updated }));
                        }}
                        style={[styles.genderTag, isSelected && styles.genderTagActive]}
                      >
                        <Text style={[styles.genderTagText, isSelected && styles.genderTagTextActive]}>{g.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={handleApplyFilters}>
                <Text style={styles.applyBtnText}>APLICAR FILTROS</Text>
              </TouchableOpacity>
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </Modal>

        {/* State Picker Modal */}
        <Modal visible={showStatePicker} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
                <View style={[styles.pickerContent, { height: height * 0.7 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>SELECIONE O ESTADO</Text>
                        <TouchableOpacity onPress={() => setShowStatePicker(false)}>
                            <X color={COLORS.textLight} size={24} />
                        </TouchableOpacity>
                    </View>
                    <FlatList 
                        data={states}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.pickerItem, filters.uf === item.acronym && styles.pickerItemActive]}
                                onPress={() => {
                                    setFilters(prev => ({ ...prev, uf: item.acronym, city: '' }));
                                    setShowStatePicker(false);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }}
                            >
                                <Text style={[styles.pickerItemText, filters.uf === item.acronym && styles.pickerItemTextActive]}>
                                    {item.name} ({item.acronym})
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
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
  // Filters Modal
  filtersOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  filtersContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 30,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    marginLeft: 10,
  },
  filterSection: {
    marginBottom: 25,
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111827',
    marginLeft: 8,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#475569',
  },
  selectBtn: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  ageTag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageTagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ageTagText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#64748b',
  },
  ageTagTextActive: {
    color: 'white',
  },
  genderTag: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  genderTagActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  genderTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  genderTagTextActive: {
    color: 'white',
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  applyBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
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
  },
  // Picker
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  pickerContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  pickerItemActive: {
    backgroundColor: '#f8fafc'
  },
  pickerItemText: {
    fontSize: 16,
    color: '#334155'
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold'
  },
  selectBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827'
  }
});

export default ExploreScreen;
