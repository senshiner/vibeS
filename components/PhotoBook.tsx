'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deletePhoto,
  downscaleImage,
  getAllPhotos,
  newPhotoId,
  savePhoto,
  updatePhoto,
  type StoredPhoto,
} from '@/lib/photos';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useMusicStore } from '@/store/musicStore';
import { PlayerCard } from '@/components/PlayerCard';
import { DraggableCard } from '@/components/DraggableCard';

interface ViewPhoto extends StoredPhoto {
  objectUrl: string;
}

/**
 * Photo book: halaman ala polaroid dari foto pengguna sendiri.
 *
 * - Foto diunggah dari perangkat, dikecilkan, lalu disimpan di
 *   IndexedDB browser ini. Tidak ada foto contoh, tidak ada foto
 *   yang dikirim ke server.
 * - Foto tampil mengikuti rasio aslinya, tidak pernah di-crop.
 * - Kartu musik di atas halaman bisa digeser, supaya pengguna
 *   sendiri yang menaruhnya di tempat yang tidak menutupi subjek.
 */
export function PhotoBook() {
  const [photos, setPhotos] = useState<ViewPhoto[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  const player = useAudioPlayer();
  const favorites = useMusicStore((s) => s.favorites);
  const isFavorite = useMusicStore((s) => s.isFavorite);
  const addFavorite = useMusicStore((s) => s.addFavorite);
  const removeFavorite = useMusicStore((s) => s.removeFavorite);

  const load = useCallback(async () => {
    try {
      const stored = await getAllPhotos();
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
      setPhotos(
        stored.map((p) => {
          const objectUrl = URL.createObjectURL(p.blob);
          urlsRef.current.push(objectUrl);
          return { ...p, objectUrl };
        }),
      );
    } catch {
      setError('Foto tidak bisa dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, [load]);

  // Indeks dijaga tetap valid saat render, bukan lewat efek.
  const safeIndex = Math.min(index, Math.max(0, photos.length - 1));
  const current = photos[safeIndex] ?? null;

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const blob = await downscaleImage(file);
        await savePhoto({
          id: newPhotoId(),
          blob,
          caption: '',
          createdAt: Date.now(),
          cardX: 8,
          cardY: 8,
        });
      }
      await load();
      setIndex(photos.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Foto gagal diunggah.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleMoveCard = (x: number, y: number) => {
    if (!current) return;
    setPhotos((prev) => prev.map((p) => (p.id === current.id ? { ...p, cardX: x, cardY: y } : p)));
  };

  const handleDragEnd = () => {
    if (!current) return;
    void updatePhoto(current.id, { cardX: current.cardX, cardY: current.cardY });
  };

  const handleCaption = (caption: string) => {
    if (!current) return;
    setPhotos((prev) => prev.map((p) => (p.id === current.id ? { ...p, caption } : p)));
    void updatePhoto(current.id, { caption });
  };

  const handleDelete = async () => {
    if (!current) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await deletePhoto(current.id);
    setConfirmDelete(false);
    await load();
  };

  const currentIsFavorite = player.current ? isFavorite(player.current.id) : false;

  const handleToggleCurrentFavorite = () => {
    if (!player.current) return;
    const fav = {
      id: player.current.url,
      title: player.current.title,
      artist: player.current.artist,
      coverUrl: player.current.coverUrl,
      url: player.current.url,
      source: player.current.source,
    };
    if (isFavorite(fav.id)) removeFavorite(fav.id);
    else addFavorite(fav);
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-[#a7b8c4]">Memuat photo book...</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-light tracking-wide text-[#ece7db]">Photo Book</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#a7b8c4]">
          Unggah foto, geser kartu musiknya.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleUpload(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full bg-[#ece7db] px-5 py-2.5 text-sm font-medium text-[#0c1a2a] transition hover:bg-white disabled:opacity-50"
        >
          {uploading ? 'Mengunggah...' : 'Unggah foto'}
        </button>
        <p className="text-xs leading-relaxed text-[#a7b8c4]">
          Foto hanya di browser ini.
        </p>
      </div>

      {error && <p className="text-sm text-[#e8a598]">{error}</p>}

      {photos.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
          <p className="text-sm leading-relaxed text-[#a7b8c4]">
            Belum ada foto. Unggah dulu.
          </p>
        </div>
      ) : (
        current && (
          <div>
            <div className="relative mx-auto max-w-xl">
              <div className="rounded-md bg-[#f4efe4] p-4 pb-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.objectUrl}
                  alt={current.caption || 'Foto di photo book'}
                  className="mx-auto max-h-[58vh] w-auto max-w-full rounded-sm object-contain"
                />
                <input
                  key={current.id}
                  type="text"
                  defaultValue={current.caption}
                  onBlur={(e) => handleCaption(e.target.value)}
                  placeholder="Tulis caption di sini..."
                  aria-label="Caption foto"
                  className="mt-4 w-full bg-transparent text-center text-sm text-[#3d3a33] placeholder:text-[#3d3a33]/50 focus:outline-none"
                />
              </div>

              <DraggableCard
                x={current.cardX}
                y={current.cardY}
                onMove={handleMoveCard}
                onDragEnd={handleDragEnd}
                label="Kartu musik, geser untuk memindahkan"
              >
                <div className="rounded-2xl border border-white/10 bg-[#0c1a2a]/90 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
                  <p className="mb-2 text-center text-[11px] tracking-wide text-[#a7b8c4]">
                    Geser kartu ini
                  </p>
                  <PlayerCard
                    compact
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
                </div>
              </DraggableCard>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setIndex((i) => Math.max(0, i - 1));
                }}
                disabled={safeIndex === 0}
                aria-label="Halaman sebelumnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg text-[#ece7db] transition hover:bg-white/10 disabled:opacity-30"
              >
                ‹
              </button>
              <span className="text-sm tabular-nums text-[#a7b8c4]">
                {safeIndex + 1} / {photos.length}
              </span>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  setIndex((i) => Math.min(photos.length - 1, i + 1));
                }}
                disabled={safeIndex === photos.length - 1}
                aria-label="Halaman berikutnya"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-lg text-[#ece7db] transition hover:bg-white/10 disabled:opacity-30"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className={`rounded-full border px-4 py-2 text-xs transition ${
                  confirmDelete
                    ? 'border-[#e8a598] bg-[#e8a598]/15 text-[#e8a598]'
                    : 'border-white/15 text-[#a7b8c4] hover:border-white/30'
                }`}
              >
                {confirmDelete ? 'Ketuk lagi untuk hapus' : 'Hapus foto ini'}
              </button>
            </div>

            {favorites.length === 0 && (
              <p className="mt-4 text-center text-xs leading-relaxed text-[#a7b8c4]">
                Pilih lagu dulu di halaman Musik.
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
