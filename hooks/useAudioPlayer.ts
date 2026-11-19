'use client';

import { useEffect, useState } from 'react';
import { audioController, type AudioState, type PlayableTrack } from '@/lib/audio';

/**
 * Jembatan React ke audioController. Satu audio untuk seluruh aplikasi,
 * jadi lagu terus berjalan saat pengguna pindah halaman.
 */
export function useAudioPlayer() {
  const [state, setState] = useState<AudioState>(() => audioController.getState());

  useEffect(() => audioController.subscribe(() => setState(audioController.getState())), []);

  return {
    ...state,
    play: (track: PlayableTrack, queue: PlayableTrack[] = []) =>
      audioController.play(track, queue),
    toggle: () => audioController.toggle(),
    next: () => audioController.next(),
    prev: () => audioController.prev(),
    seek: (seconds: number) => audioController.seek(seconds),
    hasNext: audioController.hasNext(),
  };
}
