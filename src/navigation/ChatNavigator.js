import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatListScreen from '../screens/ChatListScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator();

const ChatNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '900', fontStyle: 'italic' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen 
        name="ChatList" 
        component={ChatListScreen} 
        options={{ title: 'Mensagens' }}
      />
      <Stack.Screen 
        name="ChatRoom" 
        component={ChatRoomScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Chat' })}
      />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
