import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, 
  TextInput, ActivityIndicator, Alert, Dimensions, SafeAreaView 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus, Save, ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import useAuthStore, { api, getFullUrl } from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - SPACING.lg * 2 - 20) / 3;

const EditProfileScreen = () => {
  const { user, checkAuth } = useAuthStore();
  const navigation = useNavigation();
  
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const photos = user?.photos || [];

  const handlePickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limite Atingido', 'Você pode ter no máximo 6 fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadPhoto(result.assets[0]);
    }
  };

  const uploadPhoto = async (asset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      // Em React Native, o FormData do upload precisa deste objeto específico:
      formData.append('photo', {
        uri: asset.uri,
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      await api.post('/profile/photos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await checkAuth();
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao subir foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (id) => {
    Alert.alert('Excluir Foto', 'Deseja realmente excluir esta foto?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'EXCLUIR', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/profile/photos/${id}`);
            await checkAuth();
          } catch (err) {
            Alert.alert('Erro', 'Não foi possível excluir a foto.');
          }
      }}
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile', formData);
      await checkAuth();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Erro', 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft color={COLORS.text} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.saveText}>SALVAR</Text>}
          </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>MINHAS FOTOS (MÁX. 6)</Text>
          <View style={styles.photoGrid}>
              {photos.map((p, index) => (
                  <View key={p.id} style={styles.photoContainer}>
                      <Image source={{ uri: getFullUrl(p.url) }} style={styles.photo} />
                      {index === 0 && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>PRINCIPAL</Text></View>}
                      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePhoto(p.id)}>
                          <X color="white" size={14} />
                      </TouchableOpacity>
                  </View>
              ))}
              
              {photos.length < 6 && (
                  <TouchableOpacity 
                    style={styles.addPhotoBtn} 
                    onPress={handlePickImage}
                    disabled={uploading}
                  >
                      {uploading ? <ActivityIndicator color={COLORS.primary} /> : (
                          <>
                            <Camera color={COLORS.textLight} size={30} />
                            <View style={styles.plusIcon}>
                                <Plus color="white" size={14} />
                            </View>
                          </>
                      )}
                  </TouchableOpacity>
              )}
          </View>

          <View style={styles.inputSection}>
              <Text style={styles.label}>NICKNAME / APELIDO</Text>
              <TextInput 
                style={styles.input}
                value={formData.nickname}
                onChangeText={(v) => setFormData(p => ({ ...p, nickname: v }))}
                placeholder="Como quer ser chamado?"
              />

              <Text style={styles.label}>SOBRE MIM / BIO</Text>
              <TextInput 
                style={[styles.input, styles.bioInput]}
                value={formData.bio}
                onChangeText={(v) => setFormData(p => ({ ...p, bio: v }))}
                placeholder="Conte algo sobre você..."
                multiline
                numberOfLines={4}
              />
          </View>
          
          <Text style={styles.tipText}>Perfil completo aumenta em 3x suas chances de Match! ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      paddingHorizontal: SPACING.md, 
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  saveText: { color: COLORS.primary, fontWeight: '900', fontSize: 16 },
  content: { padding: SPACING.lg },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 15, letterSpacing: 1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoContainer: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.33, borderRadius: 12, overflow: 'hidden', backgroundColor: '#f3f4f6' },
  photo: { width: '100%', height: '100%' },
  removeBtn: { 
      position: 'absolute', 
      top: 5, 
      right: 5, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      width: 24, 
      height: 24, 
      borderRadius: 12, 
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  mainBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  mainBadgeText: { color: 'white', fontSize: 8, fontWeight: 'bold' },
  addPhotoBtn: { 
      width: PHOTO_SIZE, 
      height: PHOTO_SIZE * 1.33, 
      borderRadius: 12, 
      borderWidth: 2, 
      borderColor: '#e5e7eb', 
      borderStyle: 'dashed', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f9fafb'
  },
  plusIcon: { 
      position: 'absolute', 
      bottom: -6, 
      right: -6, 
      backgroundColor: COLORS.primary, 
      width: 24, 
      height: 24, 
      borderRadius: 12, 
      borderWidth: 3, 
      borderColor: 'white',
      justifyContent: 'center', 
      alignItems: 'center' 
  },
  inputSection: { marginTop: 30 },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8 },
  input: { 
      backgroundColor: '#f3f4f6', 
      borderRadius: 12, 
      paddingHorizontal: 15, 
      height: 50, 
      fontSize: 16, 
      color: COLORS.text,
      marginBottom: 20
  },
  bioInput: { height: 120, paddingTop: 15, textAlignVertical: 'top' },
  tipText: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 20, fontStyle: 'italic' }
});

export default EditProfileScreen;
