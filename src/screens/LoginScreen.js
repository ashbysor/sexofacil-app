import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import useAuthStore, { api } from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import { Heart } from 'lucide-react-native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigation = useNavigation();
  const setAuth = useAuthStore(state => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      await setAuth(res.data.user, res.data.token);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={{ width: 100, height: 100, borderRadius: 25 }}
              resizeMode="contain"
            />
        </View>
        <Text style={styles.title}>SexoFacil</Text>
        <Text style={styles.subtitle}>Encontre pessoas reais perto de você</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="E-MAIL"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="SENHA"
          placeholderTextColor={COLORS.textLight}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>ENTRAR</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Ainda não tem conta? Cadastre-se</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'white',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    fontStyle: 'italic',
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    fontWeight: 'bold',
  },
  form: {
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white,
    height: SIZES.inputHeight,
    borderRadius: SIZES.radius,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 16,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    height: SIZES.buttonHeight,
    borderRadius: SIZES.radius,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    elevation: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: 'bold',
  }
});

export default LoginScreen;
