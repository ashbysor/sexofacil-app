import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import useAuthStore, { api, getFullUrl, socket } from '../store/authStore';
import { COLORS, SPACING } from '../constants/theme';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ChatItem = React.memo(({ item, onPress, currentUserId }) => {
  const otherUser = item.user1Id === currentUserId ? item.user2 : item.user1;
  const lastMsg = item.messages[0];
  const isUnread = lastMsg && !lastMsg.readAt && lastMsg.senderId !== currentUserId;

  return (
    <TouchableOpacity style={styles.chatItem} onPress={() => onPress(item, otherUser)}>
      <Image 
        source={{ uri: getFullUrl(otherUser.photoUrl, 'https://via.placeholder.com/100') }} 
        style={styles.avatar} 
      />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.name, isUnread && styles.unreadText]}>{otherUser.nickname || otherUser.name}</Text>
          {lastMsg && (
            <Text style={styles.time}>
              {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true, locale: ptBR })}
            </Text>
          )}
        </View>
        <Text style={[styles.lastMsg, isUnread && styles.unreadText]} numberOfLines={1}>
          {lastMsg ? lastMsg.content : 'Inicie uma conversa! 🎉'}
        </Text>
      </View>
      {isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
});

const ChatListScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();
  const navigation = useNavigation();

  const fetchRooms = async () => {
    try {
      const res = await api.get('/chat-rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('[ROOMS-FETCH-ERROR]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    
    // Ouvir novos chats em tempo real
    socket.on('message:new', fetchRooms);
    return () => socket.off('message:new');
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [])
  );

  const handleRoomPress = (room, otherUser) => {
    navigation.navigate('ChatRoom', { 
      roomId: room.id, 
      otherUser: otherUser
    });
  };

  const renderItem = useCallback(({ item }) => (
    <ChatItem item={item} onPress={handleRoomPress} currentUserId={user.id} />
  ), [user.id]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={rooms}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          < RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRooms(); }} color={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhuma conversa ainda.</Text>
            <Text style={styles.emptySub}>Comece a dar likes no explorar! ❤️</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  list: {
    paddingVertical: SPACING.sm,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
  },
  chatInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
  lastMsg: {
    fontSize: 14,
    color: '#6b7280',
  },
  unreadText: {
    fontWeight: '900',
    color: 'black',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    paddingTop: 100,
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151'
  },
  emptySub: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center'
  }
});

export default ChatListScreen;
