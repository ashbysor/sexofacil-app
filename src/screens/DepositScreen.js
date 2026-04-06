import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, QrCode } from 'lucide-react-native';
import { api, socket } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';

const DepositScreen = () => {
  const [amount, setAmount] = useState('20');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [copied, setCopied] = useState(false);

  const generatePix = async () => {
    const num = parseFloat(amount);
    if (!num || num < 5) {
      Alert.alert('Erro', 'O valor mínimo para depósito é R$ 5,00');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/pix/generate', { 
        amount: num,
        description: 'Saldo App - SexoFacil'
      });
      setPixData(res.data);
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao gerar Pix.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (pixData?.copyPasteContent) {
      await Clipboard.setStringAsync(pixData.copyPasteContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (pixData) {
    return (
      <ScrollView contentContainerStyle={styles.center}>
        <Text style={styles.pixTitle}>Quase lá! 🚀</Text>
        <Text style={styles.pixSubtitle}>Escaneie o QR Code ou copie o código abaixo para pagar.</Text>
        
        <View style={styles.qrContainer}>
          <Image 
            source={{ uri: `data:image/png;base64,${pixData.qrCodeBase64}` }} 
            style={styles.qrCode} 
          />
        </View>

        <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard}>
          <Text style={styles.copyBtnText} numberOfLines={1}>{pixData.copyPasteContent}</Text>
          <View style={styles.copyIcon}>
            {copied ? <Check color="white" size={18} /> : <Copy color="white" size={18} />}
          </View>
        </TouchableOpacity>

        <Text style={styles.instructions}>
          1. Abra o app do seu banco.{"\n"}
          2. Vá em Pix > Copia e Cola.{"\n"}
          3. Cole o código e confirme o pagamento.
        </Text>

        <TouchableOpacity style={styles.backBtn} onPress={() => setPixData(null)}>
          <Text style={styles.backBtnText}>GERAR OUTRO VALOR</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adicionar Saldo</Text>
      <Text style={styles.subtitle}>Escolha o valor que deseja depositar via PIX:</Text>

      <View style={styles.amountContainer}>
        {['10', '20', '50', '100'].map(val => (
          <TouchableOpacity 
            key={val} 
            style={[styles.valBtn, amount === val && styles.valBtnActive]} 
            onPress={() => setAmount(val)}
          >
            <Text style={[styles.valText, amount === val && styles.valTextActive]}>R$ {val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputPrefix}>R$</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Outro valor..."
        />
      </View>

      <TouchableOpacity style={styles.generateBtn} onPress={generatePix} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : (
          <>
            <QrCode color="white" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>GERAR PIX AGORA</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>O saldo é liberado instantaneamente após a confirmação do pagamento.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: SPACING.lg },
  center: { alignItems: 'center', padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 5 },
  subtitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 30 },
  amountContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  valBtn: { 
    flex: 1, 
    minWidth: '45%', 
    height: 50, 
    borderWidth: 2, 
    borderColor: '#e5e7eb', 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  valBtnActive: { borderColor: COLORS.primary, backgroundColor: '#fdf2f8' },
  valText: { fontSize: 18, fontWeight: 'bold', color: '#374151' },
  valTextActive: { color: COLORS.primary },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f3f4f6', 
    borderRadius: 12, 
    paddingHorizontal: 15,
    marginBottom: 30
  },
  inputPrefix: { fontSize: 20, fontWeight: 'bold', color: '#374151', marginRight: 10 },
  input: { flex: 1, height: 60, fontSize: 24, fontWeight: 'bold', color: '#111827' },
  generateBtn: { 
    backgroundColor: COLORS.primary, 
    height: 60, 
    borderRadius: 30, 
    flexDirection: 'row',
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3
  },
  generateBtnText: { color: 'white', fontSize: 18, fontWeight: '900' },
  infoBox: { marginTop: 30, backgroundColor: '#f9fafb', padding: 15, borderRadius: 10 },
  infoText: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 18 },
  
  // PIX DISPLAY
  pixTitle: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginTop: 20 },
  pixSubtitle: { textAlign: 'center', color: COLORS.textLight, marginVertical: 15 },
  qrContainer: { padding: 20, backgroundColor: 'white', borderRadius: 20, elevation: 5, marginBottom: 30 },
  qrCode: { width: 220, height: 220 },
  copyBtn: { 
    backgroundColor: '#111827', 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingLeft: 20, 
    borderRadius: 30, 
    overflow: 'hidden',
    height: 55,
    width: '100%'
  },
  copyBtnText: { flex: 1, color: 'white', fontSize: 12, opacity: 0.7 },
  copyIcon: { backgroundColor: COLORS.primary, height: '100%', width: 55, justifyContent: 'center', alignItems: 'center' },
  instructions: { marginTop: 30, color: '#374151', lineHeight: 24, alignSelf: 'flex-start' },
  backBtn: { marginTop: 40, padding: 10 },
  backBtnText: { color: COLORS.primary, fontWeight: 'bold' }
});

export default DepositScreen;
