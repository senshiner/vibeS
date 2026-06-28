'use client';

import { useState } from 'react';
import { MusicTrack } from '@/types';

export const useSpotifyPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);

  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
  };

  return {
    currentTrack,
    playTrack,
  };
};
