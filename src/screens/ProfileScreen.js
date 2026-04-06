import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import useAuthStore from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { Wallet, LogOut, Settings, ShieldCheck } from 'lucide-react-native';

const ProfileScreen = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();
  
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
          <TouchableOpacity style={styles.optionRow} onPress={() => navigation.navigate('Support')}>
              <MessageCircle color={COLORS.textLight} size={22} />
              <Text style={styles.optionText}>Conversar com Suporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.optionRow, { borderBottomWidth: 0 }]} onPress={logout}>
              <LogOut color={COLORS.error} size={22} />
              <Text style={[styles.optionText, { color: COLORS.error }]}>Sair da Conta</Text>
          </TouchableOpacity>
      </View>
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
  }
});

export default ProfileScreen;
