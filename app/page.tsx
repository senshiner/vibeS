'use client';

import { useState } from 'react';
import { AmbientScene } from '@/components/AmbientScene';
import { MusicSection } from '@/components/MusicSection';
import { PhotoBook } from '@/components/PhotoBook';
import { Companion } from '@/components/Companion';
import { NowPlayingBar } from '@/components/NowPlayingBar';
import { audioController } from '@/lib/audio';
import { useMusicStore } from '@/store/musicStore';

type View = 'beranda' | 'musik' | 'foto' | 'teman';

const NAV: Array<{ id: View; label: string }> = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'musik', label: 'Musik' },
  { id: 'foto', label: 'Photo Book' },
  { id: 'teman', label: 'Teman' },
];

const CARDS: Array<{ view: View; title: string; text: string }> = [
  {
    view: 'musik',
    title: 'Musik',
    text: 'Cari lagu yang menenangkan dan simpan yang kamu suka ke favorit.',
  },
  {
    view: 'foto',
    title: 'Photo Book',
    text: 'Halaman polaroid dari fotomu sendiri, dengan kartu musik yang bisa digeser.',
  },
  {
    view: 'teman',
    title: 'Teman',
    text: 'Pendamping yang mendengarkan saat harimu terasa berat, plus latihan napas.',
  },
];

export default function Home() {
  const [view, setView] = useState<View>('beranda');
  const favorites = useMusicStore((s) => s.favorites);

  const handlePlayFavorite = () => {
    setView('musik');
    const first = favorites[0];
    if (first) void audioController.play(first, favorites);
  };

  return (
    <div className="relative min-h-screen">
      <AmbientScene />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-28 pt-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setView('beranda')}
            className="text-left"
            aria-label="vibeS, kembali ke beranda"
          >
            <span className="text-xl font-medium tracking-wide text-[#ece7db]">vibeS</span>
            <span className="block text-xs tracking-widest text-[#a7b8c4]">ruang tenang</span>
          </button>
          <nav aria-label="Navigasi utama" className="flex flex-wrap gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={view === item.id ? 'page' : undefined}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  view === item.id
                    ? 'bg-white/[0.12] text-[#ece7db]'
                    : 'text-[#a7b8c4] hover:bg-white/[0.06] hover:text-[#ece7db]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="mt-10 flex-1 sm:mt-14">
          {view === 'beranda' && (
            <div className="animate-fade-up">
              <p className="text-xs tracking-[0.25em] text-[#93b8a4]">TENANG, PELAN, UNTUK SIAPA SAJA</p>
              <h1 className="mt-4 max-w-xl text-4xl font-light leading-snug text-[#ece7db] sm:text-5xl">
                Ruang tenang untuk siapa saja.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a7b8c4]">
                Tidak ada yang perlu dikejar di sini. Duduk sebentar, dengarkan lagu
                favoritmu, buka foto yang kamu sayang, atau cerita ke Teman.
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                {CARDS.map((card) => (
                  <button
                    key={card.view}
                    type="button"
                    onClick={() => setView(card.view)}
                    className="animate-float-slow rounded-3xl border border-white/10 bg-white/[0.05] p-5 text-left backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    <h2 className="text-base font-medium text-[#ece7db]">{card.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#a7b8c4]">{card.text}</p>
                    <span className="mt-4 block text-xs tracking-wide text-[#93b8a4]">Buka ›</span>
                  </button>
                ))}
              </div>

              <p className="mt-12 max-w-xl text-xs leading-relaxed text-[#a7b8c4]/80">
                vibeS menyimpan favorit lagu dan fotomu di browser ini saja. Tidak ada
                akun, tidak ada yang diunggah ke server.
              </p>
            </div>
          )}

          {view === 'musik' && (
            <div key="musik" className="animate-fade-up">
              <MusicSection />
            </div>
          )}
          {view === 'foto' && (
            <div key="foto" className="animate-fade-up">
              <PhotoBook />
            </div>
          )}
          {view === 'teman' && (
            <div key="teman" className="animate-fade-up">
              <Companion onPlayFavorite={handlePlayFavorite} onOpenPhotos={() => setView('foto')} />
            </div>
          )}
        </main>

        <footer className="mt-16 border-t border-white/10 pt-5">
          <p className="text-xs leading-relaxed text-[#a7b8c4]">
            vibeS adalah ruang tenang, bukan pengganti bantuan profesional. Kalau kamu
            sedang dalam krisis, hubungi 119 lalu tekan 8 (Healing119, Kemenkes, gratis,
            24 jam) atau buka healing119.id.
          </p>
        </footer>
      </div>

      <NowPlayingBar />
    </div>
  );
}
