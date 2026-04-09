import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator, Alert, FlatList, Image } from 'react-native';
import { Users, Diamond, Clock, AlertTriangle, ShieldAlert, Ban, Trash2, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { api, getFullUrl } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';

const AdminScreen = () => {
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('DASHBOARD'); // DASHBOARD, REPORTS
    const navigation = useNavigation();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stRes, repRes] = await Promise.all([
                api.get('/admin/dashboard'),
                api.get('/admin/feed/reports')
            ]);
            setStats(stRes.data);
            setReports(repRes.data);
        } catch (err) {
            console.error('[ADMIN-FETCH-ERROR]', err);
            Alert.alert('Erro', 'Não foi possível carregar os dados administrativos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleIgnoreReport = async (reportId) => {
        try {
            await api.post(`/admin/feed/reports/${reportId}/ignore`);
            setReports(prev => prev.filter(r => r.id !== reportId));
        } catch (err) {
            Alert.alert('Erro', 'Falha ao ignorar denúncia.');
        }
    };

    const handleDeletePhoto = async (reportId) => {
        Alert.confirm('Deseja excluir esta foto permanentemente?', 'Esta ação não pode ser desfeita.', [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'Excluir', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/admin/feed/reports/${reportId}`);
                        setReports(prev => prev.filter(r => r.id !== reportId));
                    } catch (err) {
                        Alert.alert('Erro', 'Falha ao excluir foto.');
                    }
                }
            }
        ]);
    };

    const renderDashboard = () => (
        <ScrollView style={styles.tabContent}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VISÃO GERAL</Text>
            </View>
            
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Users color={COLORS.primary} size={24} />
                    <Text style={styles.statVal}>{stats?.totalUsers || 0}</Text>
                    <Text style={styles.statLabel}>Usuários</Text>
                </View>
                <View style={styles.statCard}>
                    <Clock color="#4ade80" size={24} />
                    <Text style={styles.statVal}>{stats?.onlineUsers || 0}</Text>
                    <Text style={styles.statLabel}>Online</Text>
                </View>
                <View style={styles.statCard}>
                    <Diamond color="#f59e0b" size={24} />
                    <Text style={styles.statVal}>{stats?.subscribers || 0}</Text>
                    <Text style={styles.statLabel}>Premium</Text>
                </View>
                <View style={styles.statCard}>
                    <AlertTriangle color="#ef4444" size={24} />
                    <Text style={styles.statVal}>{stats?.feedReports || 0}</Text>
                    <Text style={styles.statLabel}>Denúncias</Text>
                </View>
            </View>

            <View style={[styles.statCard, { width: '100%', marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 25 }]}>
                <View>
                    <Text style={styles.statLabelCaps}>PAGAMENTOS PENDENTES</Text>
                    <Text style={[styles.statVal, { textAlign: 'left', marginTop: 5 }]}>{stats?.pendingPayments || 0}</Text>
                </View>
                <ShieldAlert color={COLORS.primary} size={32} />
            </View>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchData}>
                <Text style={styles.refreshText}>ATUALIZAR DADOS</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderReports = () => (
        <FlatList 
            data={reports}
            keyExtractor={item => item.id.toString()}
            style={styles.tabContent}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    <CheckCircle color={COLORS.textLight} size={48} opacity={0.3} />
                    <Text style={styles.emptyText}>Nenhuma denúncia pendente!</Text>
                </View>
            )}
            renderItem={({ item }) => (
                <View style={styles.reportCard}>
                    <View style={styles.reportHeader}>
                        <View>
                            <Text style={styles.reporterName}>De: {item.user?.name}</Text>
                            <Text style={styles.reportDate}>{new Date(item.createdAt).toLocaleDateString()} - {item.reason}</Text>
                        </View>
                    </View>
                    
                    <Image 
                        source={{ uri: getFullUrl(item.photo?.url) }} 
                        style={styles.reportedImage}
                        resizeMode="cover"
                    />

                    <View style={styles.reportActions}>
                        <TouchableOpacity 
                            style={[styles.reportBtn, styles.ignoreBtn]}
                            onPress={() => handleIgnoreReport(item.id)}
                        >
                            <CheckCircle color="#64748b" size={18} />
                            <Text style={styles.ignoreText}>Manter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.reportBtn, styles.deleteBtn]}
                            onPress={() => handleDeletePhoto(item.id)}
                        >
                            <Trash2 color="white" size={18} />
                            <Text style={styles.deleteText}>Excluir Foto</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <ArrowLeft color="#111827" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>PAINEL ADMIN</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'DASHBOARD' && styles.tabActive]}
                    onPress={() => setActiveTab('DASHBOARD')}
                >
                    <Text style={[styles.tabText, activeTab === 'DASHBOARD' && styles.tabTextActive]}>Métricas</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'REPORTS' && styles.tabActive]}
                    onPress={() => setActiveTab('REPORTS')}
                >
                    <Text style={[styles.tabText, activeTab === 'REPORTS' && styles.tabTextActive]}>Moderação ({reports.length})</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                activeTab === 'DASHBOARD' ? renderDashboard() : renderReports()
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#111827',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 3,
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748b',
    },
    tabTextActive: {
        color: COLORS.primary,
    },
    tabContent: {
        flex: 1,
        padding: 20,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#64748b',
        letterSpacing: 1,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    statCard: {
        width: '47%',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statVal: {
        fontSize: 24,
        fontWeight: '900',
        color: '#111827',
        marginTop: 10,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: 'bold',
        marginTop: 2,
    },
    statLabelCaps: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
    },
    refreshBtn: {
        marginTop: 30,
        backgroundColor: '#111827',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
    },
    refreshText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
    },
    // Reports
    reportCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 15,
        marginBottom: 20,
        elevation: 2,
    },
    reportHeader: {
        marginBottom: 12,
    },
    reporterName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    reportDate: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 2,
    },
    reportedImage: {
        width: '100%',
        height: 300,
        borderRadius: 15,
        backgroundColor: '#f1f5f9',
    },
    reportActions: {
        flexDirection: 'row',
        marginTop: 15,
        gap: 10,
    },
    reportBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    ignoreBtn: {
        backgroundColor: '#f1f5f9',
    },
    deleteBtn: {
        backgroundColor: '#ef4444',
    },
    ignoreText: {
        color: '#475569',
        fontWeight: 'bold',
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingVertical: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 15,
        color: '#64748b',
        fontWeight: 'bold',
    }
});

export default AdminScreen;
