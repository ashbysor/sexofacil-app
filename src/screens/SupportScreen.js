import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MessageSquare, Send, ChevronLeft } from 'lucide-react-native';
import { api } from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const SupportScreen = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSendSupport = async () => {
    if (!message.trim()) {
      Alert.alert('Erro', 'Por favor, descreva seu problema ou sugestão.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/profile/support', { message });
      Alert.alert(
        'Mensagem Enviada! 🎉', 
        'Recebemos seu chamado. Nossa equipe responderá em breve no seu e-mail cadastrado.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar sua mensagem agora. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={COLORS.text} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suporte Técnico</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconCircle}>
              <MessageSquare color={COLORS.primary} size={40} />
          </View>
          
          <Text style={styles.title}>Como podemos ajudar?</Text>
          <Text style={styles.subtitle}>
              Conte-nos detalhadamente o que está acontecendo. Nossa equipe de suporte recebe todos os chamados por e-mail e responde o mais rápido possível.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua mensagem aqui..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity 
            style={[styles.sendBtn, !message.trim() && { opacity: 0.6 }]} 
            onPress={handleSendSupport}
            disabled={loading || !message.trim()}
          >
            {loading ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Send color="white" size={20} style={{ marginRight: 8 }} />
                    <Text style={styles.sendBtnText}>ENVIAR CHAMADO</Text>
                </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.footerTip}>Horário de atendimento: Segunda a Sábado, das 08h às 22h.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { padding: SPACING.lg, alignItems: 'center' },
  iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#fdf2f8',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginTop: 20,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 10, textAlign: 'center' },
  subtitle: { 
      fontSize: 14, 
      color: COLORS.textLight, 
      textAlign: 'center', 
      lineHeight: 20, 
      marginBottom: 30,
      paddingHorizontal: 10
  },
  input: {
      width: '100%',
      backgroundColor: '#f3f4f6',
      borderRadius: 16,
      padding: 16,
      fontSize: 16,
      color: '#111827',
      minHeight: 200,
      borderWidth: 1,
      borderColor: '#e5e7eb',
  },
  sendBtn: {
      backgroundColor: COLORS.primary,
      width: '100%',
      height: 55,
      borderRadius: 28,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 30,
      elevation: 3,
  },
  sendBtnText: { color: 'white', fontSize: 16, fontWeight: '900' },
  footerTip: { marginTop: 40, fontSize: 12, color: '#9ca3af', textAlign: 'center' }
});

export default SupportScreen;
