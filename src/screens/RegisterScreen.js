import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import useAuthStore, { api } from '../store/authStore';

const RegisterScreen = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    birthdate: '',
    gender: '',
    uf: '',
    city: '',
    interests: [],
    bio: ''
  });

  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const navigation = useNavigation();
  const setAuth = useAuthStore(state => state.setAuth);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await api.get('/location/states');
        setStates(res.data);
      } catch (err) { console.log(err); }
    };
    fetchStates();
  }, []);

  useEffect(() => {
    if (formData.uf) {
      const fetchCities = async () => {
        setLoadingLocations(true);
        try {
          const res = await api.get(`/location/cities/${formData.uf}`);
          setCities(res.data);
        } catch (err) { console.log(err); }
        finally { setLoadingLocations(false); }
      };
      fetchCities();
    }
  }, [formData.uf]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password || !formData.gender || !formData.city) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios (*)');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      await setAuth(res.data.user, res.data.token);
    } catch (err) {
      Alert.alert('Erro no Cadastro', err.response?.data?.error || 'Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.label}>NOME COMPLETO *</Text>
      <TextInput 
        style={styles.input} 
        value={formData.name} 
        onChangeText={v => handleChange('name', v.toUpperCase())}
        placeholder="SEU NOME"
      />
      
      <Text style={styles.label}>E-MAIL *</Text>
      <TextInput 
        style={styles.input} 
        value={formData.email} 
        onChangeText={v => handleChange('email', v.toLowerCase())}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="EX@EXEMPLO.COM"
      />

      <Text style={styles.label}>SENHA *</Text>
      <TextInput 
        style={styles.input} 
        value={formData.password} 
        onChangeText={v => handleChange('password', v)}
        secureTextEntry
        placeholder="MÍNIMO 6 CARACTERES"
      />

      <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
        <Text style={styles.nextBtnText}>PRÓXIMO</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.label}>APELIDO (EXIBIDO NO PERFIL)</Text>
      <TextInput 
        style={styles.input} 
        value={formData.nickname} 
        onChangeText={v => handleChange('nickname', v.toUpperCase())}
        placeholder="EX: SAFADINHA"
      />

      <Text style={styles.label}>ESTADO *</Text>
      <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.uf}
            onValueChange={(v) => handleChange('uf', v)}
          >
            <option label="Selecione UF" value="" />
            {states.map(s => <Picker.Item key={s.uf} label={s.uf} value={s.uf} />)}
          </Picker>
      </View>

      <Text style={styles.label}>CIDADE *</Text>
      <View style={[styles.pickerContainer, !formData.uf && { opacity: 0.5 }]}>
          <Picker
            selectedValue={formData.city}
            onValueChange={(v) => handleChange('city', v)}
            disabled={!formData.uf}
          >
            <option label={loadingLocations ? "Carregando..." : "Selecione Cidade"} value="" />
            {cities.map(c => <Picker.Item key={c.city} label={c.city} value={c.city} />)}
          </Picker>
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
            <Text style={styles.backBtnText}>VOLTAR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextBtn, { flex: 1, marginTop: 0 }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>CRIAR CONTA</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Criar Perfil</Text>
        <Text style={styles.subtitle}>Passo {step} de 2</Text>

        {step === 1 ? renderStep1() : renderStep2()}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Já tenho conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Componente Picker precisa ser instalado separadamente se não estiver no bundle básico do Expo às vezes.
// No plano adicionei @react-native-picker/picker.

import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.primary, fontStyle: 'italic', marginBottom: 5 },
  subtitle: { fontSize: 14, color: COLORS.textLight, marginBottom: 30, fontWeight: 'bold' },
  label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 8 },
  input: {
    backgroundColor: 'white',
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
    justifyContent: 'center',
    overflow: 'hidden'
  },
  nextBtn: {
    backgroundColor: COLORS.primary,
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  nextBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  backBtn: {
      paddingHorizontal: 20,
      justifyContent: 'center',
      marginRight: 10
  },
  backBtnText: { color: COLORS.textLight, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  cancelBtn: { marginTop: 30, alignItems: 'center' },
  cancelBtnText: { color: COLORS.textLight, fontWeight: 'bold' }
});

export default RegisterScreen;
