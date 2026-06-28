import { create } from 'zustand';
import { MusicTrack } from '@/types';

interface MusicState {
  selectedTrack: MusicTrack | null;
  setSelectedTrack: (track: MusicTrack) => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  selectedTrack: null,
  setSelectedTrack: (track) => set({ selectedTrack: track }),
}));
