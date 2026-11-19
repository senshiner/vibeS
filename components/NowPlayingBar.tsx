'use client';

import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { formatTime } from '@/lib/format';

/**
 * Bar kecil di bawah layar. Muncul saat ada lagu yang sedang dimuat
 * atau diputar, supaya musik tetap terkendali dari halaman mana pun.
 */
export function NowPlayingBar() {
  const { current, isPlaying, progress, duration, toggle, next, hasNext } = useAudioPlayer();

  if (!current) return null;

  const ratio = duration > 0 ? Math.min(1, progress / duration) : 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a141f]/90 backdrop-blur-md">
      <div className="h-0.5 w-full bg-white/10">
        <div className="h-full bg-[#93b8a4]" style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Jeda' : 'Putar'}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ece7db] text-sm text-[#0c1a2a]"
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[#ece7db]">{current.title}</p>
          <p className="truncate text-xs text-[#a7b8c4]">
            {current.artist} · {formatTime(progress)} / {formatTime(duration)}
          </p>
        </div>
        <button
          type="button"
          onClick={next}
          disabled={!hasNext}
          aria-label="Lagu berikutnya"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base text-[#ece7db] hover:bg-white/10 disabled:opacity-30"
        >
          ››
        </button>
      </div>
    </div>
  );
}
