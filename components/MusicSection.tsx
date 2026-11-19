'use client';

import { useState } from 'react';
import { useMusicStore } from '@/store/musicStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { PlayerCard } from '@/components/PlayerCard';
import type { FavoriteTrack, MusicTrack } from '@/types';

type Source = 'youtube' | 'spotify';

interface SearchResult {
  title: string;
  artist: string;
  coverUrl: string;
  url: string;
  source: Source;
  audioUrl: string;
}

function toFavorite(track: MusicTrack | FavoriteTrack): FavoriteTrack {
  return {
    id: track.url,
    title: track.title,
    artist: track.artist,
    coverUrl: track.coverUrl,
    url: track.url,
    source: track.source,
  };
}

function CoverThumb({ coverUrl, title }: { coverUrl: string; title: string }) {
  const [failed, setFailed] = useState(false);
  if (!coverUrl || failed) {
    return (
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#93b8a4,#2c4a5a)] text-lg text-[#ece7db]/90">
        {title.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={coverUrl}
      alt=""
      className="h-12 w-12 shrink-0 rounded-xl object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Musik: cari lagu, putar, dan simpan favorit.
 * Favorit disimpan di browser (localStorage) sebagai metadata saja.
 * Audio selalu diminta ulang saat diputar, karena link download
 * dari API bisa kedaluwarsa.
 */
export function MusicSection() {
  const favorites = useMusicStore((s) => s.favorites);
  const addFavorite = useMusicStore((s) => s.addFavorite);
  const removeFavorite = useMusicStore((s) => s.removeFavorite);
  const isFavorite = useMusicStore((s) => s.isFavorite);

  const player = useAudioPlayer();

  const [query, setQuery] = useState('');
  const [source, setSource] = useState<Source>('youtube');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    setSearched(true);
    try {
      const found = await Promise.all(
        [0, 1, 2, 3, 4].map(async (index): Promise<MusicTrack | null> => {
          try {
            const res = await fetch(
              `/api/music?q=${encodeURIComponent(q)}&source=${source}&index=${index}`,
            );
            if (!res.ok) return null;
            const data = (await res.json()) as SearchResult;
            if (!data.url) return null;
            return {
              id: `search-${Date.now()}-${index}`,
              title: data.title,
              artist: data.artist,
              coverUrl: data.coverUrl || '',
              url: data.url,
              source: data.source,
              audioUrl: data.audioUrl,
            } satisfies MusicTrack;
          } catch {
            return null;
          }
        }),
      );
      const unique = found.filter(
        (t, i, arr): t is MusicTrack => t !== null && arr.findIndex((x) => x?.url === t.url) === i,
      );
      setResults(unique);
      if (unique.length === 0) {
        setSearchError('Tidak ada hasil. Coba kata kunci lain, atau ganti sumber.');
      }
    } catch {
      setSearchError('Pencarian gagal. Layanan musik sedang tidak bisa dijangkau, coba lagi nanti.');
    } finally {
      setSearching(false);
    }
  };

  const currentIsFavorite = player.current ? isFavorite(player.current.id) : false;

  const handleToggleCurrentFavorite = () => {
    if (!player.current) return;
    const fav = toFavorite(player.current);
    if (isFavorite(fav.id)) removeFavorite(fav.id);
    else addFavorite(fav);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-light tracking-wide text-[#ece7db]">Musik</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#a7b8c4]">
          Cari lagu yang menenangkan, putar, lalu simpan yang kamu suka ke favorit.
          Favoritmu tersimpan di browser ini.
        </p>
      </header>

      <PlayerCard
        track={player.current}
        isPlaying={player.isPlaying}
        progress={player.progress}
        duration={player.duration}
        loading={player.loading}
        error={player.error}
        isFavorite={currentIsFavorite}
        hasNext={player.hasNext}
        onToggle={player.toggle}
        onNext={player.next}
        onPrev={player.prev}
        onSeek={player.seek}
        onToggleFavorite={handleToggleCurrentFavorite}
      />

      <section aria-label="Cari lagu">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
            placeholder="Cari judul lagu atau artis..."
            aria-label="Cari judul lagu atau artis"
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-[#ece7db] placeholder:text-[#a7b8c4]/60 focus:border-[#93b8a4]/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={searching || !query.trim()}
            className="rounded-full bg-[#ece7db] px-5 py-3 text-sm font-medium text-[#0c1a2a] transition hover:bg-white disabled:opacity-50"
          >
            {searching ? 'Mencari...' : 'Cari'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[#a7b8c4]">
          <span>Sumber:</span>
          {(['youtube', 'spotify'] as Source[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              aria-pressed={source === s}
              className={`rounded-full border px-3 py-1 capitalize transition ${
                source === s
                  ? 'border-[#93b8a4] bg-[#93b8a4]/20 text-[#ece7db]'
                  : 'border-white/15 text-[#a7b8c4] hover:border-white/30'
              }`}
            >
              {s === 'youtube' ? 'YouTube' : 'Spotify'}
            </button>
          ))}
        </div>
        {searchError && <p className="mt-3 text-sm text-[#e8a598]">{searchError}</p>}
      </section>

      {searched && results.length > 0 && (
        <section aria-label="Hasil pencarian">
          <h2 className="mb-3 text-sm font-medium tracking-wide text-[#ece7db]">Hasil pencarian</h2>
          <ul className="space-y-2">
            {results.map((track) => (
              <li
                key={track.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
              >
                <CoverThumb coverUrl={track.coverUrl} title={track.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#ece7db]">{track.title}</p>
                  <p className="truncate text-xs text-[#a7b8c4]">{track.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void player.play(track, [track])}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#ece7db] transition hover:bg-white/10"
                >
                  Putar
                </button>
                <button
                  type="button"
                  onClick={() => addFavorite(toFavorite(track))}
                  disabled={isFavorite(track.url)}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#ece7db] transition hover:bg-white/10 disabled:opacity-40"
                >
                  {isFavorite(track.url) ? 'Tersimpan' : 'Simpan'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Lagu favorit">
        <h2 className="mb-3 text-sm font-medium tracking-wide text-[#ece7db]">
          Favoritmu {favorites.length > 0 && `(${favorites.length})`}
        </h2>
        {favorites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-5 text-sm leading-relaxed text-[#a7b8c4]">
            Belum ada lagu favorit. Cari lagu di atas, lalu ketuk Simpan.
            Favoritmu hanya tersimpan di browser ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {favorites.map((track) => (
              <li
                key={track.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3"
              >
                <CoverThumb coverUrl={track.coverUrl} title={track.title} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#ece7db]">{track.title}</p>
                  <p className="truncate text-xs text-[#a7b8c4]">{track.artist}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void player.play(track, favorites)}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#ece7db] transition hover:bg-white/10"
                >
                  Putar
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite(track.id)}
                  aria-label={`Hapus ${track.title} dari favorit`}
                  className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-[#e8a598] transition hover:bg-white/10"
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
