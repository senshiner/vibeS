'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MusicTrack } from '@/types';

// Audio singleton (hanya dibuat sekali)
let audioInstance: HTMLAudioElement | null = null;
let audioInitialized = false;

export const useAudioPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const trackRef = useRef<MusicTrack | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Inisialisasi audio singleton (hanya sekali)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!audioInitialized) {
      audioInstance = new Audio();
      audioInstance.preload = 'metadata';
      audioInitialized = true;
      
      const audio = audioInstance;
      
      const handleLoadedMetadata = () => {
        if (isMountedRef.current && audio) {
          setDuration(Math.floor(audio.duration));
        }
      };
      
      const handleTimeUpdate = () => {
        if (isMountedRef.current && audio) {
          setProgress(Math.floor(audio.currentTime));
        }
      };
      
      const handlePlay = () => {
        if (isMountedRef.current) setIsPlaying(true);
      };
      
      const handlePause = () => {
        if (isMountedRef.current) setIsPlaying(false);
      };
      
      const handleEnded = () => {
        if (isMountedRef.current) {
          setIsPlaying(false);
          setProgress(0);
        }
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('ended', handleEnded);
      
      // Simpan listener cleanup
      (audio as any).__listeners = {
        loadedmetadata: handleLoadedMetadata,
        timeupdate: handleTimeUpdate,
        play: handlePlay,
        pause: handlePause,
        ended: handleEnded,
      };
    }
    
    return () => {
      // Saat unmount, kita tidak destroy audio agar tetap berjalan
      // Tapi kita matikan interval jika ada
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // Sync state dari audio (dipanggil saat popup dibuka)
  const syncState = useCallback(() => {
    if (!audioInstance) return;
    const audio = audioInstance;
    if (trackRef.current) {
      setProgress(Math.floor(audio.currentTime));
      setDuration(Math.floor(audio.duration));
      setIsPlaying(!audio.paused);
    }
  }, []);

  // Fungsi utama play track
  const playTrack = useCallback(async (track: MusicTrack) => {
    const audio = audioInstance;
    if (!audio) return;

    // Jika lagu sama dan sedang diputar, pause
    if (trackRef.current?.id === track.id && isPlaying) {
      audio.pause();
      return;
    }

    // Hentikan semua audio yang sedang berjalan (untuk mencegah duplikasi)
    audio.pause();
    audio.src = '';
    audio.removeAttribute('src');
    audio.load(); // reset

    let audioUrl = track.audioUrl;
    if (!audioUrl) {
      try {
        // Coba Spotify dulu, fallback YouTube
        let res = await fetch(
          `/api/music?url=${encodeURIComponent(track.url)}&source=spotify`
        );
        let data = await res.json();
        if (!res.ok || !data.audioUrl) {
          console.warn('Spotify gagal, fallback ke YouTube');
          res = await fetch(
            `/api/music?url=${encodeURIComponent(track.url)}&source=youtube`
          );
          data = await res.json();
        }
        if (res.ok && data.audioUrl) {
          audioUrl = data.audioUrl;
          track.audioUrl = audioUrl;
        } else {
          console.error('Gagal download:', data.error);
          return;
        }
      } catch (error) {
        console.error('Error fetch audio:', error);
        return;
      }
    }

    if (!audioUrl) return;

    // Set sumber dan putar
    audio.src = audioUrl;
    audio.load();
    audio.play();
    
    // Update state & ref
    trackRef.current = track;
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioInstance;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      if (trackRef.current) {
        audio.play();
      }
    }
  }, [isPlaying]);

  return {
    currentTrack,
    isPlaying,
    progress,
    duration,
    playTrack,
    togglePlay,
    syncState,
  };
};
