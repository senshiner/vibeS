'use client';

import { useState } from 'react';
import type { PlayableTrack } from '@/lib/audio';

interface MiniPlayerCardProps {
  track: PlayableTrack | null;
  isPlaying: boolean;
  loading: boolean;
  onToggle: () => void;
}

/**
 * Kartu musik mini untuk photo book: satu baris saja.
 * Cover 44 px, judul + artis masing-masing satu baris terpotong,
 * satu tombol putar/jeda. Tanpa favorit, progress, atau prev/next,
 * supaya tidak menutupi foto.
 */
export function MiniPlayerCard({ track, isPlaying, loading, onToggle }: MiniPlayerCardProps) {
  // Cover yang pernah gagal dimuat diingat dari URL-nya.
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);

  // Judul dari API sering sudah berisi artis ("The 1975 - About You"),
  // padahal baris artis sudah ada di bawahnya. Tampilkan judul lagunya
  // saja supaya tidak terpotong jadi "The 1975 - A...".
  const displayTitle =
    track && track.artist && track.title.startsWith(`${track.artist} - `)
      ? track.title.slice(track.artist.length + 3)
      : track?.title;

  return (
    <div className="flex w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0c1a2a]/90 p-2.5 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#93b8a4,#2c4a5a)]">
        {track && track.coverUrl && track.coverUrl !== failedCoverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={track.coverUrl}
            alt={`Sampul ${displayTitle}`}
            className="h-full w-full object-cover"
            onError={() => setFailedCoverUrl(track.coverUrl)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-[#ece7db]/90">
            {displayTitle ? displayTitle.charAt(0).toUpperCase() : '♪'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        {track ? (
          <>
            <p className="truncate text-sm font-medium text-[#ece7db]">{displayTitle}</p>
            <p className="truncate text-xs text-[#a7b8c4]">{track.artist || 'Artis tidak diketahui'}</p>
          </>
        ) : (
          <p className="truncate text-sm text-[#a7b8c4]">Pilih lagu dulu.</p>
        )}
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading || !track}
        aria-label={isPlaying ? 'Jeda' : 'Putar'}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ece7db] text-base text-[#0c1a2a] transition hover:bg-white disabled:opacity-50"
      >
        {loading ? '…' : isPlaying ? '❚❚' : '▶'}
      </button>
    </div>
  );
}
