'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useMusicStore } from '@/store/musicStore';
import { DEFAULT_MUSIC_LIST } from '@/lib/musicConfig';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import Image from 'next/image';

interface MusicPickerSheetProps {
  onClose: () => void;
}

export const MusicPickerSheet = ({ onClose }: MusicPickerSheetProps) => {
  const { customTracks, addTrack, removeTrack, selectedTrackId, setSelectedTrack } =
    useMusicStore();
  const { currentTrack, isPlaying, progress, duration, playTrack, togglePlay, syncState } =
    useAudioPlayer();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Sync state dari audio setiap kali komponen mount (popup dibuka)
  useEffect(() => {
    syncState();
    // Interval untuk sync setiap 2 detik (jika ada perubahan dari luar)
    const interval = setInterval(syncState, 2000);
    return () => clearInterval(interval);
  }, [syncState]);

  const allTracks = [...DEFAULT_MUSIC_LIST, ...customTracks];
  const displayTracks = allTracks.slice(0, 3);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch(
        `/api/music?q=${encodeURIComponent(searchQuery)}&source=spotify`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mencari lagu');
      }

      const isDuplicate = displayTracks.some(t => t.url === data.url);
      if (isDuplicate) {
        setSearchError('Lagu ini sudah ada di daftar');
        setIsSearching(false);
        return;
      }

      if (displayTracks.length >= 3) {
        setSearchError('Maksimal 3 lagu. Hapus salah satu untuk menambah.');
        setIsSearching(false);
        return;
      }

      const newTrack = {
        id: `search-${Date.now()}`,
        title: data.title,
        artist: data.artist,
        coverUrl: data.coverUrl || '',
        url: data.url,
        source: 'spotify' as const,
        audioUrl: data.audioUrl,
      };
      addTrack(newTrack);
      setSelectedTrack(newTrack.id);
      setSearchQuery('');
      playTrack(newTrack);
    } catch (error: any) {
      setSearchError(error.message || 'Terjadi kesalahan');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveTrack = (id: string) => {
    removeTrack(id);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedTrack = displayTracks.find((t) => t.id === selectedTrackId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-30 flex items-start justify-start bg-black/10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[45%] h-full p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium tracking-wide text-white/90">🎵 Pilih Lagu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cari judul lagu..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white/40"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg text-sm font-medium transition"
            >
              {isSearching ? '...' : 'Cari'}
            </button>
          </div>
          {searchError && <p className="text-red-400 text-xs">{searchError}</p>}
          <p className="text-gray-500 text-xs">Maksimal 3 lagu · klik lagu untuk memutar</p>
        </div>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

        <div className="space-y-3">
          {displayTracks.map((track) => {
            const isActive = selectedTrackId === track.id;
            const isCustom = track.id.startsWith('custom-') || track.id.startsWith('search-');
            return (
              <div
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track.id);
                  playTrack(track);
                }}
                className={`
                  flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all
                  ${isActive ? 'bg-white/30 border border-white/40' : 'bg-white/20 hover:bg-white/30'}
                `}
              >
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/10 flex items-center justify-center">
                  {track.coverUrl ? (
                    <Image
                      src={track.coverUrl}
                      alt={track.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <span className="text-2xl">🎵</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-gray-300 truncate">{track.artist}</p>
                </div>

                {isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTrack(track.id);
                    }}
                    className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 text-sm"
                  >
                    ✕
                  </button>
                )}

                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {isActive && isPlaying ? (
                    <span className="text-xs text-green-400">⏸</span>
                  ) : (
                    <span className="text-xs text-gray-300">▶</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedTrack && (
          <div className="mt-6 p-3 bg-white/20 rounded-xl border border-white/20">
            <p className="text-xs text-gray-300 mb-2 text-center truncate">
              🎶 {selectedTrack.title} — {selectedTrack.artist}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-300 to-yellow-400 rounded-full transition-all duration-300"
                  style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 font-mono min-w-[40px] text-right">
                {formatTime(progress)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
