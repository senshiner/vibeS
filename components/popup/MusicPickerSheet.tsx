'use client';

import { MUSIC_LIST } from '@/lib/musicConfig';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface MusicPickerSheetProps {
  onClose: () => void;
}

export const MusicPickerSheet = ({ onClose }: MusicPickerSheetProps) => {
  const { currentTrack, playTrack } = useSpotifyPlayer();
  const [showEmbed, setShowEmbed] = useState(false);

  const handlePlayTrack = (track: any) => {
    playTrack(track);
    setShowEmbed(true);
  };

  const getSpotifyEmbedUrl = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    if (match) {
      return `https://open.spotify.com/embed/track/${match[1]}`;
    }
    return url;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-30 flex items-start justify-start bg-black/10 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Container kiri (transparan, hanya sebagai wadah) */}
      <div
        className="w-[45%] h-full p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium tracking-wide text-white/90">🎵 Pilih Lagu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition"
          >
            ✕
          </button>
        </div>

        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

        {/* 3 Card Lagu — SOLID BACKGROUND */}
        <div className="space-y-3">
          {MUSIC_LIST.map((track) => {
            const isActive = currentTrack?.id === track.id;
            return (
              <div
                key={track.id}
                onClick={() => handlePlayTrack(track)}
                className={`
                  flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all
                  ${isActive ? 'bg-white/30 border border-white/40' : 'bg-white/20 hover:bg-white/30'}
                  backdrop-blur-none
                `}
              >
                {/* Cover */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={track.coverUrl}
                    alt={track.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-white truncate">{track.title}</p>
                  <p className="text-xs text-gray-300 truncate">{track.artist}</p>
                </div>

                {/* Play indicator */}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  {isActive ? (
                    <span className="text-xs text-green-400">▶</span>
                  ) : (
                    <span className="text-xs text-gray-300">▶</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Spotify Embed Player */}
        {showEmbed && currentTrack && (
          <div className="mt-6 p-3 bg-white/20 rounded-xl border border-white/20">
            <p className="text-xs text-gray-300 mb-2 text-center">
              🎶 {currentTrack.title} — {currentTrack.artist}
            </p>
            <iframe
              src={getSpotifyEmbedUrl(currentTrack.spotifyUrl)}
              width="100%"
              height="80"
              frameBorder="0"
              allow="encrypted-media"
              className="rounded-lg"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};
