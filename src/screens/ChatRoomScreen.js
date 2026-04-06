import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, 
  Dimensions, Alert 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Video } from 'expo-video';
import { 
  Send, Camera, Mic, Image as ImageIcon, CheckCircle2, 
  Play, Pause, ChevronLeft, Trash2, Info 
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import useAuthStore, { api, socket, getFullUrl } from '../store/authStore';
import { COLORS, SPACING, SIZES } from '../constants/theme';

const { width } = Dimensions.get('window');

const ChatRoomScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  
  // Audio Recording
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const route = useRoute();
  const navigation = useNavigation();
  const { roomId, otherUser } = route.params;
  const { user } = useAuthStore();
  const listRef = useRef();

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/matches/${roomId}/messages`);
      setMessages(res.data.reverse()); // FlatList inverted
    } catch (err) {
      console.error('[CHAT-FETCH-ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Sincronização Socket
    socket.emit('register', user.id);
    
    socket.on('message:new', (msg) => {
      // Se a mensagem for deste match, adiciona à lista
      if (msg.matchId === parseInt(roomId)) {
        setMessages(prev => [msg, ...prev]);
        // Marcar como lido no socket/backend
        socket.emit('messages:read', { messageIds: [msg.id], fromId: msg.senderId });
      }
    });

    socket.on('typing:start', (data) => {
      if (parseInt(data.fromId) === otherUser.id) setOtherUserTyping(true);
    });

    socket.on('typing:stop', (data) => {
      if (parseInt(data.fromId) === otherUser.id) setOtherUserTyping(false);
    });

    return () => {
      socket.off('message:new');
      socket.off('typing:start');
      socket.off('typing:stop');
    };
  }, [roomId]);

  const handleTyping = (text) => {
    setInputText(text);
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      socket.emit('typing:start', { toId: otherUser.id });
    } else if (isTyping && text.length === 0) {
      setIsTyping(false);
      socket.emit('typing:stop', { toId: otherUser.id });
    }
  };

  const sendMessage = async (type = 'text', payload = null) => {
    if (sending) return;
    setSending(true);
    
    try {
      let res;
      if (type === 'text') {
        const content = inputText.trim();
        if (!content) return;
        setInputText('');
        res = await api.post(`/matches/${roomId}/messages`, { content });
      } else if (type === 'image') {
        const fd = new FormData();
        fd.append('image', {
          uri: payload.uri,
          name: 'photo.jpg',
          type: 'image/jpeg'
        });
        res = await api.post(`/matches/${roomId}/messages/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Adiciona localmente para feedback instantâneo
      setMessages(prev => [res.data, ...prev]);
      socket.emit('message:new', { toId: otherUser.id, message: res.data });
      
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível enviar sua mensagem.');
    } finally {
      setSending(false);
      setIsTyping(false);
      socket.emit('typing:stop', { toId: otherUser.id });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      sendMessage('image', result.assets[0]);
    }
  };

  const renderMessage = useCallback(({ item }) => {
    const isMine = item.senderId === user.id;
    return (
      <View style={[styles.msgContainer, isMine ? styles.myMsgContainer : styles.otherMsgContainer]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.otherBubble]}>
          {item.type === 'image' ? (
            <Image 
              source={{ uri: getFullUrl(item.imageUrl) }} 
              style={styles.messageImage} 
              resizeMode="cover" 
            />
          ) : (
            <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.otherMsgText]}>
              {item.content}
            </Text>
          )}
          
          <View style={styles.footerRow}>
              <Text style={[styles.msgTime, isMine && { color: 'rgba(255,255,255,0.7)' }]}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMine && (
                  <CheckCircle2 
                    size={10} 
                    color={item.status === 'read' ? '#4ade80' : 'rgba(255,255,255,0.5)'} 
                    style={{ marginLeft: 4 }}
                  />
              )}
          </View>
        </View>
      </View>
    );
  }, [user.id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Personalizado */}
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft color={COLORS.text} size={28} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
              <Image source={{ uri: getFullUrl(otherUser.photoUrl) }} style={styles.avatar} />
              <View>
                <Text style={styles.headerName}>{otherUser.nickname || otherUser.name}</Text>
                <Text style={styles.headerStatus}>{otherUserTyping ? 'Digitando...' : (otherUser.isOnline ? 'Online' : 'Visto por último recentemente')}</Text>
              </View>
          </View>
          <TouchableOpacity>
              <Info color={COLORS.textLight} size={24} />
          </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id.toString()}
          inverted
          contentContainerStyle={styles.list}
          ListFooterComponent={() => loading && <ActivityIndicator style={{ margin: 20 }} color={COLORS.primary} />}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity onPress={pickImage} style={styles.attachBtn}>
              <ImageIcon color={COLORS.textLight} size={24} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleTyping}
            placeholder="Conversar..."
            multiline
            maxLength={1000}
          />

          {inputText.length > 0 ? (
            <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage('text')}>
                <Send color="white" size={20} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn}>
                <Mic color="white" size={20} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      paddingHorizontal: SPACING.md, 
      height: 60, 
      backgroundColor: 'white', 
      elevation: 2,
      borderBottomWidth:1,
      borderBottomColor: '#f3f4f6'
  },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  headerStatus: { fontSize: 10, color: COLORS.textLight },

  list: { padding: SPACING.md, paddingBottom: 20 },
  msgContainer: { marginBottom: 15, maxWidth: '85%' },
  myMsgContainer: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  otherMsgContainer: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  bubble: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, elevation: 1 },
  myBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: 'white', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  myMsgText: { color: 'white' },
  otherMsgText: { color: '#111827' },
  
  messageImage: { width: width * 0.6, height: width * 0.8, borderRadius: 12, marginBottom: 4 },
  
  footerRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 2 },
  msgTime: { fontSize: 9, color: '#9ca3af' },

  inputBar: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      padding: 8, 
      backgroundColor: 'white', 
      borderTopWidth: 1, 
      borderTopColor: '#e5e7eb' 
  },
  attachBtn: { padding: 8 },
  input: { 
      flex: 1, 
      backgroundColor: '#f3f4f6', 
      borderRadius: 25, 
      paddingHorizontal: 15, 
      paddingVertical: 10, 
      marginHorizontal: 8, 
      maxHeight: 100, 
      fontSize: 16 
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  micBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
});

export default ChatRoomScreen;
