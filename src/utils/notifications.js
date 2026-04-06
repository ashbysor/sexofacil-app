import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '../store/authStore';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#ec4899', // Pink
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID do Expo (necessário para EAS)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[PUSH-TOKEN]', token);
    
    // Enviar para o backend
    try {
        await api.put('/profile/push-token', { pushToken: token });
    } catch(e) {
        console.log('[PUSH-TOKEN-SAVE-ERROR]', e.message);
    }

  } else {
    // No emulador não funciona push real
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Configuração de como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
