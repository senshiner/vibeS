'use client';

import { useState } from 'react';
import type { PlayableTrack } from '@/lib/audio';
import { formatTime } from '@/lib/format';

interface PlayerCardProps {
  track: PlayableTrack | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  loading: boolean;
  error: string | null;
  isFavorite: boolean;
  hasNext: boolean;
  onToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleFavorite: () => void;
}

/**
 * Kartu player ala tren foto Spotify: cover, judul, artis, progress bar,
 * dan tombol putar. Cover memakai fallback gradien kalau gambar gagal
 * dimuat, jadi kartu tidak pernah kosong.
 */
export function PlayerCard({
  track,
  isPlaying,
  progress,
  duration,
  loading,
  error,
  isFavorite,
  hasNext,
  onToggle,
  onNext,
  onPrev,
  onSeek,
  onToggleFavorite,
}: PlayerCardProps) {
  // Cover yang pernah gagal dimuat diingat dari URL-nya, jadi kartu tidak
  // perlu efek untuk mereset state saat lagu berganti.
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);

  const ratio = duration > 0 ? Math.min(1, progress / duration) : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!track || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const next = ((e.clientX - rect.left) / rect.width) * duration;
    onSeek(Math.max(0, Math.min(duration, next)));
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
      {!track ? (
        <p className="py-6 text-center text-sm leading-relaxed text-[#a7b8c4]">
          Pilih lagu dulu.
        </p>
      ) : (
        <div>
          <div className="flex gap-4">
            <div
              className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#93b8a4,#2c4a5a)]"
            >
              {track.coverUrl && track.coverUrl !== failedCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.coverUrl}
                  alt={`Sampul ${track.title}`}
                  className="h-full w-full object-cover"
                  onError={() => setFailedCoverUrl(track.coverUrl)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-light text-[#ece7db]/90">
                  {track.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-medium text-[#ece7db]">{track.title}</p>
              <p className="mt-1 truncate text-sm text-[#a7b8c4]">{track.artist || 'Artis tidak diketahui'}</p>
              <p className="mt-2 text-xs text-[#a7b8c4]/70">
                {track.source === 'itunes' || track.preview
                  ? 'Preview 30 detik'
                  : track.source === 'youtube'
                    ? 'YouTube'
                    : 'Spotify'}
              </p>
              <button
                type="button"
                onClick={onToggleFavorite}
                className="mt-3 rounded-full border border-white/15 px-3 py-1 text-xs text-[#ece7db] transition hover:border-white/35 hover:bg-white/10"
              >
                {isFavorite ? 'Tersimpan' : 'Simpan'}
              </button>
            </div>
          </div>

          <div className="mt-5">
            <div
              role="slider"
              aria-label="Posisi lagu"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={progress}
              tabIndex={0}
              onClick={handleSeek}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') onSeek(Math.min(duration, progress + 5));
                if (e.key === 'ArrowLeft') onSeek(Math.max(0, progress - 5));
              }}
              className="h-1.5 w-full cursor-pointer rounded-full bg-white/15"
            >
              <div
                className="h-full rounded-full bg-[#93b8a4]"
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs tabular-nums text-[#a7b8c4]">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={onPrev}
              disabled={!hasNext}
              aria-label="Lagu sebelumnya"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#ece7db] transition hover:bg-white/10 disabled:opacity-30"
            >
              ‹‹
            </button>
            <button
              type="button"
              onClick={onToggle}
              disabled={loading}
              aria-label={isPlaying ? 'Jeda' : 'Putar'}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ece7db] text-lg text-[#0c1a2a] transition hover:bg-white disabled:opacity-50"
            >
              {loading ? '…' : isPlaying ? '❚❚' : '▶'}
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext}
              aria-label="Lagu berikutnya"
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-[#ece7db] transition hover:bg-white/10 disabled:opacity-30"
            >
              ››
            </button>
          </div>

          {error && <p className="mt-3 text-center text-xs leading-relaxed text-[#e8a598]">{error}</p>}
        </div>
      )}
    </div>
  );
}
