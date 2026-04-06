import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

// URL de produção (ajuste se tiver domínio próprio ou IP específico da rede local para testes)
export const BASE_URL = 'https://sexofacil-138203245479.southamerica-east1.run.app';

export const getFullUrl = (url, fallback = '') => {
  if (!url) return fallback;
  if (url.startsWith('http')) return url;
  const pivot = url.startsWith('/') ? '' : '/';
  return `${BASE_URL}${pivot}${url}`;
};

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
});

export const socket = io(BASE_URL, { 
  autoConnect: false,
  transports: ['websocket'] 
});

// Interceptor para injetar o token em cada requisição
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  loading: true,
  counters: { matches: 0, messages: 0, likes: 0, pendingPayments: 0, feedReports: 0, pendingCreators: 0, pendingWithdrawals: 0 },
  pollingInterval: null,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync('token', token);
    set({ user, token });
    get().startPolling();
    socket.connect();
    socket.emit('register', user.id);
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    if (get().pollingInterval) clearInterval(get().pollingInterval);
    set({ user: null, token: null, counters: { matches: 0, messages: 0, likes: 0 }, pollingInterval: null });
    socket.disconnect();
  },

  fetchCounters: async () => {
    try {
      const res = await api.get('/auth/counters');
      set({ counters: res.data });
    } catch (err) {
      console.log('Error fetching counters', err.message);
    }
  },

  startPolling: () => {
    if (get().pollingInterval) return;

    const tick = () => {
      get().fetchCounters();
      api.post('/auth/ping').catch(() => {});
    };

    tick(); 
    const interval = setInterval(tick, 10000);
    set({ pollingInterval: interval });
  },

  checkAuth: async () => {
    set({ loading: true });
    const token = await SecureStore.getItemAsync('token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      set({ token });
      const res = await api.get('/auth/me');
      set({ user: res.data.user, loading: false });
      get().startPolling();
      socket.connect();
      socket.emit('register', res.data.user.id);
    } catch (err) {
      await SecureStore.deleteItemAsync('token');
      set({ user: null, token: null, loading: false });
    }
  },

  fetchUser: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user });
    } catch (err) { }
  }
}));

// Escutar eventos Socket para sincronização em tempo real (mesma lógica da web)
socket.on('user:updated', (data) => {
  const state = useAuthStore.getState();
  if (data && state.user) {
    useAuthStore.setState({ 
      user: { ...state.user, ...data } 
    });
  }
});

socket.on('message:new', () => {
  useAuthStore.getState().fetchCounters();
});

export { api };
export default useAuthStore;
