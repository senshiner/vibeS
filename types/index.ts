export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  url: string; // link sumber (YouTube/Spotify) atau lookup iTunes
  source: 'youtube' | 'spotify' | 'itunes';
  audioUrl?: string; // hanya transit di memori, tidak pernah disimpan
  preview?: boolean; // true kalau audio yang diputar hanya preview 30 detik
}

/**
 * Favorit yang disimpan di browser. Hanya metadata.
 * audioUrl sengaja TIDAK disimpan: link download dari API bisa
 * kedaluwarsa, jadi audio selalu di-resolve ulang saat diputar
 * lewat /api/music?url=.
 */
export interface FavoriteTrack {
  id: string; // sama dengan url lagu, jadi tidak ada duplikat
  title: string;
  artist: string;
  coverUrl: string;
  url: string;
  source: 'youtube' | 'spotify' | 'itunes';
  preview?: boolean; // diisi saat diputar, tidak pernah disimpan
}

/** Penempatan satu kartu musik di halaman photo book, satu per lagu. */
export interface PhotoCardPlacement {
  /** id lagu (url sumber), sama dengan FavoriteTrack.id. */
  trackId: string;
  /** Posisi dalam persen dari ukuran halaman. */
  x: number;
  y: number;
  /** Kemiringan kartu dalam derajat, untuk kesan 3D seperti kartu Spotify. */
  tilt: number;
}

export interface PhotoItem {
  id: string;
  caption: string;
  createdAt: number;
  /**
   * Penempatan kartu musik di halaman, satu per lagu.
   * Foto lama tanpa `cards` memakai posisi default baru (bawah):
   * posisi lama (atas, satu kartu) adalah yang dikeluhkan,
   * jadi tidak dipertahankan.
   */
  cards?: PhotoCardPlacement[];
}

export type CompanionRole = 'user' | 'companion' | 'crisis';

export type CompanionSuggestion = 'breathing' | 'music' | 'photo';

export interface CompanionMessage {
  id: string;
  role: CompanionRole;
  text: string;
  suggestion?: CompanionSuggestion | null;
}
