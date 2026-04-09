import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Dimensions, 
  Modal 
} from 'react-native';
import { Camera, Trash2, Eye, Filter, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';

import useAuthStore, { api, getFullUrl } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';

const { width } = Dimensions.get('window');
const MAX_PHOTOS = 6;

const PhotosScreen = () => {
  const [myPhotos, setMyPhotos] = useState([]);
  const [feedPhotos, setFeedPhotos] = useState([]);
  const [availableGenders, setAvailableGenders] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [feedIndex, setFeedIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
      const saved = await SecureStore.getItemAsync('feed_index');
      if (saved) setFeedIndex(parseInt(saved));
      loadMyPhotos();
      loadFeedPhotos();
      loadGenders();
    };
    init();
  }, []);

  useEffect(() => {
    loadFeedPhotos();
  }, [selectedGenders]);

  const loadGenders = async () => {
    try {
      const res = await api.get('/genders');
      setAvailableGenders(res.data.map(g => g.name));
    } catch (err) {}
  };

  const loadMyPhotos = async () => {
    try {
      const res = await api.get('/feed/me');
      setMyPhotos(res.data);
    } catch (err) {}
  };

  const loadFeedPhotos = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/feed?genders=${selectedGenders.join(',')}`);
      setFeedPhotos(res.data);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    if (myPhotos.length >= MAX_PHOTOS) {
      Alert.alert('Limite Atingido', 'Você já atingiu o limite de 6 fotos.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão', 'Precisamos de acesso às suas fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', {
      uri: asset.uri,
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
    });

    try {
      await api.post('/feed', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      loadMyPhotos();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Sucesso', 'Sua foto foi enviada!');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Excluir Foto',
      'Deseja realmente excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/feed/${id}`);
              setMyPhotos(prev => prev.filter(p => p.id !== id));
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível excluir a foto.');
            }
          }
        }
      ]
    );
  };

  const toggleGender = (g) => {
    setSelectedGenders(prev => 
      prev.includes(g) ? prev.filter(item => item !== g) : [...prev, g]
    );
  };

  const openLightbox = () => {
     if (feedPhotos.length === 0) return;
     setLightboxIndex(feedIndex % feedPhotos.length);
  };

  const nextLightbox = () => {
    setLightboxIndex((prev) => {
      const next = (prev + 1) % feedPhotos.length;
      setFeedIndex(next);
      SecureStore.setItemAsync('feed_index', next.toString());
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* SEÇÃO: MINHAS FOTOS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>📸 Galeria Pessoal</Text>
              <Text style={styles.sectionSubtitle}>{myPhotos.length}/{MAX_PHOTOS} fotos enviadas</Text>
            </View>
            <TouchableOpacity 
              onPress={handlePickImage} 
              disabled={uploading || myPhotos.length >= MAX_PHOTOS}
              style={[styles.uploadBtn, (uploading || myPhotos.length >= MAX_PHOTOS) && { opacity: 0.5 }]}
            >
              {uploading ? <ActivityIndicator color="white" /> : <Camera size={20} color="white" />}
              <Text style={styles.uploadBtnText}>ENVIAR</Text>
            </TouchableOpacity>
          </View>

          <FlatList 
            data={myPhotos}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.photoContainer}>
                <Image source={{ uri: item.imageUrl }} style={styles.photo} />
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Trash2 size={16} color="white" />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => !uploading && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhuma foto enviada</Text>
                </View>
            )}
          />
        </View>

        <View style={styles.divider} />

        {/* SEÇÃO: VER FOTOS DE OUTROS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👀 Ver fotos de outros usuários</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {availableGenders.map(g => {
              const active = selectedGenders.includes(g);
              return (
                <TouchableOpacity 
                  key={g} 
                  onPress={() => toggleGender(g)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actionCard}>
             <Text style={styles.actionEmoji}>🔥</Text>
             <Text style={styles.actionTitle}>Explorar Feed</Text>
             <Text style={styles.actionSubtitle}>Veja as fotos da comunidade uma a uma no modo imersivo.</Text>
             
             <TouchableOpacity 
                style={styles.actionBtn}
                onPress={openLightbox}
                disabled={feedPhotos.length === 0 || loading}
             >
                <Eye size={22} color="white" />
                <Text style={styles.actionBtnText}>
                  {loading ? 'CARREGANDO...' : 'VISUALIZAR FEED'}
                </Text>
             </TouchableOpacity>

             {feedPhotos.length === 0 && !loading && (
               <Text style={styles.errorText}>Nenhuma foto encontrada para os filtros.</Text>
             )}
          </View>
        </View>
      </ScrollView>

      {/* ── LIGHTBOX (STORY MODE) ── */}
      <Modal visible={lightboxIndex !== null} animationType="slide">
        <View style={styles.lightboxContainer}>
           {lightboxIndex !== null && feedPhotos[lightboxIndex] && (
             <>
               <View style={styles.lightboxHeader}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{feedPhotos[lightboxIndex].gender}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setLightboxIndex(null)}>
                    <X size={32} color="white" />
                  </TouchableOpacity>
               </View>

               <View style={styles.lightboxContent}>
                  <Image source={{ uri: feedPhotos[lightboxIndex].imageUrl }} style={styles.lightboxImage} resizeMode="contain" />
                  
                  <TouchableOpacity 
                    style={[styles.sideBtn, { left: 10 }]} 
                    onPress={() => setLightboxIndex(prev => (prev - 1 + feedPhotos.length) % feedPhotos.length)}
                  >
                    <ChevronLeft size={32} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.sideBtn, { right: 10 }]} 
                    onPress={nextLightbox}
                  >
                    <ChevronRight size={32} color="white" />
                  </TouchableOpacity>
               </View>

               <View style={styles.lightboxFooter}>
                  <TouchableOpacity 
                    style={styles.reportBtn}
                    onPress={() => {
                      setLightboxIndex(null);
                      Alert.alert('Denúncia', 'Denúncia registrada para análise.');
                    }}
                  >
                    <AlertCircle size={18} color="#ef4444" />
                    <Text style={styles.reportBtnText}>Denunciar Conteúdo</Text>
                  </TouchableOpacity>
               </View>
             </>
           )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  photoContainer: {
    width: 100,
    height: 133,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginRight: 10,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    background: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    width: width - 32,
    height: 133,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  divider: {
    height: 8,
    backgroundColor: '#f8fafc',
  },
  filterBar: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: 'white',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 13,
  },
  filterChipTextActive: {
    color: 'white',
  },
  actionCard: {
    padding: 30,
    background: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  actionEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 12,
    fontWeight: 'bold',
  },
  // Lightbox
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  lightboxHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lightboxContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: width,
    height: '100%',
  },
  sideBtn: {
    position: 'absolute',
    width: 60,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxFooter: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportBtnText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default PhotosScreen;
