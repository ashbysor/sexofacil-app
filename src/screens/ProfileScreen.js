import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import useAuthStore, { api } from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Wallet, LogOut, Settings, ShieldCheck, MessageCircle, Ticket, X } from 'lucide-react-native';

const ProfileScreen = () => {
  const { user, logout, checkAuth } = useAuthStore();
  const navigation = useNavigation();

  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);


  const handleRedeem = async () => {
    if (!couponCode.trim()) return;
    setRedeeming(true);
    try {
      const res = await api.post('/coupons/redeem', { code: couponCode });
      Alert.alert('Sucesso! 🎁', res.data.message);
      await checkAuth(); 
      setShowCouponModal(false);
      setCouponCode('');
    } catch (err) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao resgatar cupom');
    } finally {
      setRedeeming(false);
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* Header Profile */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{user?.nickname?.[0] || user?.name?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.nickname || user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.isSubscriber && (
            <View style={styles.premiumTag}>
                <ShieldCheck color="white" size={12} />
                <Text style={styles.premiumText}>MEMBRO PREMIUM</Text>
            </View>
        )}
      </View>

      {/* Balance Card */}
      <View style={styles.card}>
          <View style={styles.cardHeader}>
              <Wallet color={COLORS.primary} size={20} />
              <Text style={styles.cardTitle}>SALDO ATUAL</Text>
          </View>
          <Text style={styles.balance}>R$ {user?.balance?.toFixed(2) || '0,00'}</Text>
          <TouchableOpacity style={styles.depositBtn} onPress={() => navigation.navigate('Deposit')}>
              <Text style={styles.depositBtnText}>ADICIONAR SALDO</Text>
          </TouchableOpacity>
      </View>

      {/* Options */}
      <View style={styles.optionsArea}>
          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('EditProfile')}>
              <Settings color={COLORS.textLight} size={22} />
              <Text style={styles.optionText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             style={styles.optionRow} 
             onPress={() => setShowCouponModal(true)}
          >
              <Ticket color={COLORS.primary} size={22} />
              <Text style={[styles.optionText, { color: COLORS.primary }]}>Resgatar Cupom / Código</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Support')}>
              <MessageCircle color={COLORS.textLight} size={22} />
              <Text style={styles.optionText}>Conversar com Suporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.optionRow, { borderBottomWidth: 0 }]} onPress={logout}>
              <LogOut color={COLORS.error} size={22} />
              <Text style={[styles.optionText, { color: COLORS.error }]}>Sair da Conta</Text>
          </TouchableOpacity>
      </View>

      {/* Coupon Modal */}
      <Modal visible={showCouponModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ticket color={COLORS.primary} size={20} />
                <Text style={styles.modalTitle}>RESGATAR CUPOM</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCouponModal(false)}>
                <X color={COLORS.textLight} size={24} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Digite seu código promocional para ativar seu benefício agora!
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CÓDIGO DO CUPOM</Text>
              <TextInput 
                style={styles.input} 
                value={couponCode}
                onChangeText={(t) => setCouponCode(t.toUpperCase())}
                placeholder="EX: SEXOFACIL100"
                autoCapitalize="characters"
              />
            </View>

            <TouchableOpacity 
              style={[styles.redeemBtn, (redeeming || !couponCode.trim()) && { opacity: 0.6 }]}
              disabled={redeeming || !couponCode.trim()}
              onPress={handleRedeem}
            >
              {redeeming ? <ActivityIndicator color="white" /> : <Text style={styles.redeemBtnText}>ATIVAR AGORA</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
    marginBottom: 20,
  },
  avatarPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
  },
  avatarInitial: {
      fontSize: 40,
      fontWeight: '900',
      color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
  },
  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 2,
  },
  premiumTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f59e0b',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
      marginTop: 10,
  },
  premiumText: {
      color: 'white',
      fontSize: 10,
      fontWeight: 'bold',
      marginLeft: 4,
  },
  card: {
      backgroundColor: 'white',
      marginHorizontal: SPACING.lg,
      padding: 20,
      borderRadius: 20,
      elevation: 2,
      marginBottom: 20,
  },
  cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  cardTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: COLORS.textLight,
      marginLeft: 8,
  },
  balance: {
      fontSize: 32,
      fontWeight: '900',
      color: '#111827',
      marginBottom: 15,
  },
  depositBtn: {
      backgroundColor: COLORS.primary,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
  },
  depositBtnText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14,
  },
  optionsArea: {
      backgroundColor: 'white',
      marginHorizontal: SPACING.lg,
      borderRadius: 20,
      overflow: 'hidden',
  },
  optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
  },
  optionText: {
      fontSize: 16,
      color: '#374151',
      fontWeight: '600',
      marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
    marginLeft: 10,
  },
  modalDesc: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  redeemBtn: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  redeemBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProfileScreen;
