import { create } from 'zustand';
import { api, socket } from './authStore';

const useLikeStore = create((set, get) => ({
  likes: [],
  loading: false,
  error: null,

  fetchLikes: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/likes');
      if (JSON.stringify(res.data) !== JSON.stringify(get().likes)) {
        set({ likes: res.data });
      }
    } catch (err) {
      console.log('[LIKES-FETCH-ERROR]', err.message);
    } finally {
      set({ loading: false });
    }
  },

  addLike: (likeUser) => {
    set((state) => {
      if (state.likes.find((u) => u.id === likeUser.id)) return state;
      return { likes: [likeUser, ...state.likes] };
    });
  },

  removeLike: (userId) => {
    set((state) => ({
      likes: state.likes.filter((u) => u.id !== parseInt(userId))
    }));
  }
}));

// Listener para novas curtidas via socket (opcional se o polling do auth já disparar fetch)
socket.on('like:new', () => {
  useLikeStore.getState().fetchLikes();
});

export default useLikeStore;
