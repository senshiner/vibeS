import { create } from 'zustand';
import { MusicTrack } from '@/types';

interface MusicState {
  customTracks: MusicTrack[];
  selectedTrackId: string | null;
  addTrack: (track: MusicTrack) => void;
  removeTrack: (id: string) => void;
  setSelectedTrack: (id: string) => void;
}

export const useMusicStore = create<MusicState>((set) => ({
  customTracks: [],
  selectedTrackId: null,
  addTrack: (track) =>
    set((state) => {
      if (state.customTracks.length >= 3) return state;
      return { customTracks: [...state.customTracks, track] };
    }),
  removeTrack: (id) =>
    set((state) => ({
      customTracks: state.customTracks.filter((t) => t.id !== id),
      selectedTrackId: state.selectedTrackId === id ? null : state.selectedTrackId,
    })),
  setSelectedTrack: (id) => set({ selectedTrackId: id }),
}));
