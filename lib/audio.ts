'use client';

import type { FavoriteTrack, MusicTrack } from '@/types';

export type PlayableTrack = FavoriteTrack | MusicTrack;

export interface AudioState {
  current: PlayableTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  loading: boolean;
  error: string | null;
}

type Listener = () => void;

/**
 * Satu elemen audio untuk seluruh aplikasi. Elemen ini hidup di level
 * modul, jadi lagu terus berjalan saat pengguna pindah halaman
 * (Beranda, Musik, Photo Book, Teman).
 *
 * Audio TIDAK pernah dibuat di server: elemen baru dibuat saat play
 * pertama kali, dan itu selalu terjadi di browser.
 */
class AudioController {
  private audio: HTMLAudioElement | null = null;
  private listeners = new Set<Listener>();
  private queue: PlayableTrack[] = [];
  private state: AudioState = {
    current: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    loading: false,
    error: null,
  };

  getState(): AudioState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  private setState(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audio) {
      const el = new Audio();
      el.preload = 'metadata';
      el.addEventListener('loadedmetadata', () => {
        this.setState({ duration: Number.isFinite(el.duration) ? Math.floor(el.duration) : 0 });
      });
      el.addEventListener('timeupdate', () => {
        this.setState({ progress: Math.floor(el.currentTime) });
      });
      el.addEventListener('play', () => this.setState({ isPlaying: true }));
      el.addEventListener('pause', () => this.setState({ isPlaying: false }));
      el.addEventListener('ended', () => this.next());
      el.addEventListener('error', () => {
        this.setState({
          isPlaying: false,
          loading: false,
          error: 'Lagu tidak bisa diputar. Coba lagu lain.',
        });
      });
      this.audio = el;
    }
    return this.audio;
  }

  /**
   * Minta link audio segar ke /api/music. Coba sumber asli lagu dulu,
   * lalu sumber satunya sebagai cadangan.
   */
  private async resolveAudioUrl(track: PlayableTrack): Promise<string | null> {
    const sources: Array<'youtube' | 'spotify'> =
      track.source === 'spotify' ? ['spotify', 'youtube'] : ['youtube', 'spotify'];
    for (const source of sources) {
      try {
        const res = await fetch(
          `/api/music?url=${encodeURIComponent(track.url)}&source=${source}`,
        );
        const data: { audioUrl?: string } = await res.json();
        if (res.ok && data.audioUrl) return data.audioUrl;
      } catch {
        // lanjut ke sumber berikutnya
      }
    }
    return null;
  }

  async play(track: PlayableTrack, queue: PlayableTrack[] = []) {
    const audio = this.ensureAudio();
    if (!audio) return;
    if (queue.length > 0) this.queue = queue;

    // Lagu yang sama dan sedang diputar: jeda saja.
    if (this.state.current?.id === track.id && this.state.isPlaying) {
      audio.pause();
      return;
    }

    this.setState({ loading: true, error: null });
    audio.pause();

    // Favorit tidak pernah menyimpan audioUrl, jadi selalu resolve ulang.
    // Hasil pencarian membawa audioUrl transit di memori dan boleh dipakai.
    let audioUrl = 'audioUrl' in track ? (track.audioUrl ?? null) : null;
    if (!audioUrl) audioUrl = await this.resolveAudioUrl(track);
    if (!audioUrl) {
      this.setState({
        loading: false,
        error: 'Lagu tidak bisa dimuat. Layanan musik sedang tidak bisa dijangkau.',
      });
      return;
    }

    audio.src = audioUrl;
    audio.load();
    try {
      await audio.play();
    } catch {
      this.setState({ loading: false, error: 'Pemutaran diblokir browser. Ketuk tombol putar sekali lagi.' });
      return;
    }
    this.setState({ current: track, progress: 0, loading: false, error: null });
  }

  toggle() {
    const audio = this.audio;
    if (!audio || !this.state.current) return;
    if (this.state.isPlaying) audio.pause();
    else void audio.play().catch(() => undefined);
  }

  next() {
    if (this.queue.length === 0) return;
    const idx = this.queue.findIndex((t) => t.id === this.state.current?.id);
    const nextTrack = this.queue[(idx + 1) % this.queue.length];
    if (nextTrack) void this.play(nextTrack, this.queue);
  }

  prev() {
    if (this.queue.length === 0) return;
    const idx = this.queue.findIndex((t) => t.id === this.state.current?.id);
    const prevTrack = this.queue[(idx - 1 + this.queue.length) % this.queue.length];
    if (prevTrack) void this.play(prevTrack, this.queue);
  }

  seek(seconds: number) {
    const audio = this.audio;
    if (!audio || !this.state.current) return;
    audio.currentTime = seconds;
    this.setState({ progress: seconds });
  }

  hasNext(): boolean {
    return this.queue.length > 1;
  }
}

export const audioController = new AudioController();
