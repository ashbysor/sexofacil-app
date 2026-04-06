import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StatusBar } from 'react-native';
import { Home, Heart, MessageCircle, User } from 'lucide-react-native';
import { 
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_900Black 
} from '@expo-google-fonts/outfit';

import useAuthStore from './src/store/authStore';
import { COLORS } from './src/constants/theme';

// Importando telas (que criaremos a seguir)
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import SupportScreen from './src/screens/SupportScreen';
import DepositScreen from './src/screens/DepositScreen';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import ExploreScreen from './src/screens/ExploreScreen';
import LikesScreen from './src/screens/LikesScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ChatNavigator from './src/navigation/ChatNavigator';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { counters } = useAuthStore();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        headerShown: false,
        tabBarStyle: { height: 60, paddingBottom: 10, paddingTop: 5 }
      }}
    >
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          title: 'Explorar'
        }}
      />
      <Tab.Screen 
        name="Likes" 
        component={LikesScreen} 
        options={{
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
          tabBarBadge: counters.likes > 0 ? counters.likes : null,
          title: 'Curtidas'
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatNavigator} 
        options={{
          tabBarIcon: ({ color }) => <MessageCircle size={24} color={color} />,
          tabBarBadge: counters.messages > 0 ? counters.messages : null,
          title: 'Chat'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          title: 'Perfil'
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, loading, checkAuth } = useAuthStore();
  let [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_700Bold,
    Outfit_900Black,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
        registerForPushNotificationsAsync();
    }
  }, [user]);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Support" component={SupportScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Deposit" component={DepositScreen} options={{ headerShown: true, title: 'Adicionar Saldo' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
