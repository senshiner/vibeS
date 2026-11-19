import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FavoriteTrack } from '@/types';

interface MusicState {
  favorites: FavoriteTrack[];
  addFavorite: (track: FavoriteTrack) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

/**
 * Favorit disimpan di localStorage (kunci vibes:favorites:v1).
 * Yang disimpan hanya metadata lagu (judul, artis, cover, link).
 * Link audio tidak pernah disimpan, karena bisa kedaluwarsa.
 */
export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (track) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === track.id)) return state;
          return { favorites: [...state.favorites, track] };
        }),
      removeFavorite: (id) =>
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
    }),
    {
      name: 'vibes:favorites:v1',
      partialize: (state) => ({ favorites: state.favorites }),
    },
  ),
);
