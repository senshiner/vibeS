import { create } from 'zustand';

interface UserState {
  name: string;
  photoUrl: string | null;
  wish: string;
  setName: (name: string) => void;
  setPhoto: (url: string) => void;
  setWish: (text: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
  name: '',
  photoUrl: null,
  wish: '',
  setName: (name) => set({ name }),
  setPhoto: (url) => set({ photoUrl: url }),
  setWish: (text) => set({ wish: text }),
}));
