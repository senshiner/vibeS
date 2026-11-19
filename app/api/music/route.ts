import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DELIRIUS_API = 'https://api.delirius.store';
const NEXRAY_API = 'https://api.nexray.eu.cc';
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_PREFIX = 'https://itunes.apple.com/lookup?id=';

/**
 * Pencarian utama: nexray Spotify search (metadata + cover asli).
 * Delirius sudah tidak bisa dijangkau dari VM ini, jadi ia bukan
 * lagi sumber pencarian. Audio: Delirius download dulu (lagu full),
 * kalau gagal pakai preview iTunes 30 detik yang dicocokkan dari
 * judul + artis. Cadangan pencarian terakhir: iTunes Search API.
 *
 * Pesan gagal dibedakan dengan jujur: layanan tidak bisa dijangkau
 * (503) vs memang tidak ada hasil (404). Jangan pernah membalas
 * "tidak ada hasil" saat yang gagal adalah layanannya.
 */

interface NexrayResult {
  title: string;
  artist: string;
  thumbnail?: string;
  url: string;
}

interface NexrayTrack {
  title: string;
  artist: string;
  coverUrl: string;
  url: string;
}

interface ItunesApiResult {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  kind?: string;
}

interface ItunesTrack {
  title: string;
  artist: string;
  coverUrl: string;
  url: string;
  audioUrl: string;
}

// Cache kecil (60 detik) supaya lima panggilan paralel untuk satu kata
// kunci tidak menembak API yang sama lima kali.
const CACHE_TTL_MS = 60_000;
const nexrayCache = new Map<string, { at: number; tracks: NexrayTrack[] }>();
const itunesCache = new Map<string, { at: number; tracks: ItunesTrack[] }>();

async function searchNexray(q: string): Promise<NexrayTrack[]> {
  const key = q.trim().toLowerCase();
  const cached = nexrayCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tracks;
  const res = await axios.get(`${NEXRAY_API}/search/spotify`, {
    params: { q },
    timeout: 10_000,
  });
  const results: NexrayResult[] = res.data?.result ?? [];
  const tracks = results
    .filter((r) => r.title && r.url)
    .map((r) => ({
      title: r.title,
      artist: r.artist || '',
      coverUrl: r.thumbnail || '',
      url: r.url,
    }));
  nexrayCache.set(key, { at: Date.now(), tracks });
  return tracks;
}

async function searchItunes(q: string): Promise<ItunesTrack[]> {
  const key = q.trim().toLowerCase();
  const cached = itunesCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.tracks;
  const res = await axios.get(ITUNES_SEARCH_API, {
    params: { term: q, media: 'music', entity: 'song', limit: 5 },
    timeout: 10_000,
  });
  const results: ItunesApiResult[] = (res.data?.results ?? []).filter(
    (r: ItunesApiResult) => r.kind === 'song' && r.previewUrl && r.trackName,
  );
  const tracks = results.map((r) => ({
    title: r.trackName,
    artist: r.artistName || '',
    coverUrl: (r.artworkUrl100 || '').replace('100x100bb', '600x600bb'),
    url: `${ITUNES_LOOKUP_PREFIX}${r.trackId}`,
    audioUrl: r.previewUrl as string,
  }));
  itunesCache.set(key, { at: Date.now(), tracks });
  return tracks;
}

async function itunesPreviewUrl(lookupUrl: string): Promise<string | null> {
  const res = await axios.get(lookupUrl, { timeout: 10_000 });
  const result = res.data?.results?.[0];
  return result?.previewUrl || null;
}

async function itunesPreviewFor(title: string, artist: string): Promise<string | null> {
  const tracks = await searchItunes(`${title} ${artist}`.trim());
  return tracks[0]?.audioUrl || null;
}

async function deliriusDownload(
  url: string,
  source: 'youtube' | 'spotify',
): Promise<string | null> {
  const downloadUrl =
    source === 'spotify'
      ? `${DELIRIUS_API}/download/spotifydl?url=${encodeURIComponent(url)}`
      : `${DELIRIUS_API}/download/ytmp3?url=${encodeURIComponent(url)}`;
  try {
    const res = await axios.get(downloadUrl, { timeout: 15_000 });
    return res.data.data?.download || null;
  } catch (error: unknown) {
    console.error('Delirius download error:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const urlParam = searchParams.get('url');
  const source = searchParams.get('source') || 'spotify';
  const index = parseInt(searchParams.get('index') || '0', 10);
  const title = searchParams.get('title') || '';
  const artist = searchParams.get('artist') || '';

  if (urlParam) {
    // Lagu preview iTunes: audio di-resolve ulang dari lookup, karena
    // favorit hanya menyimpan metadata, bukan link audio.
    if (source === 'itunes' || urlParam.startsWith(ITUNES_LOOKUP_PREFIX)) {
      try {
        const previewUrl = await itunesPreviewUrl(urlParam);
        if (!previewUrl) {
          return NextResponse.json({ error: 'Gagal mendapatkan audio' }, { status: 500 });
        }
        return NextResponse.json({ audioUrl: previewUrl, preview: true });
      } catch (error: unknown) {
        console.error('iTunes lookup error:', error instanceof Error ? error.message : error);
        return NextResponse.json(
          { error: 'Layanan musik tidak bisa dijangkau' },
          { status: 503 },
        );
      }
    }

    // Lagu full via Delirius dulu, preview iTunes kalau gagal.
    const audioUrl = await deliriusDownload(
      urlParam,
      source === 'youtube' ? 'youtube' : 'spotify',
    );
    if (audioUrl) return NextResponse.json({ audioUrl, preview: false });
    if (title && artist) {
      try {
        const previewUrl = await itunesPreviewFor(title, artist);
        if (previewUrl) return NextResponse.json({ audioUrl: previewUrl, preview: true });
      } catch (error: unknown) {
        console.error('iTunes fallback error:', error instanceof Error ? error.message : error);
      }
    }
    return NextResponse.json(
      { error: 'Layanan musik tidak bisa dijangkau' },
      { status: 503 },
    );
  }

  if (q) {
    // Pencarian utama: nexray. Tidak ada audio di tahap ini, audio
    // di-resolve saat diputar lewat ?url=.
    let nexrayFailed = false;
    try {
      const tracks = await searchNexray(q);
      if (tracks.length > 0) {
        const track = tracks[index] || tracks[0];
        return NextResponse.json({ ...track, source: 'spotify' });
      }
    } catch (error: unknown) {
      console.error('Nexray search error:', error instanceof Error ? error.message : error);
      nexrayFailed = true;
    }

    // Cadangan: iTunes, preview 30 detik.
    try {
      const tracks = await searchItunes(q);
      if (tracks.length === 0) {
        return NextResponse.json({ error: 'Tidak ada hasil' }, { status: 404 });
      }
      const track = tracks[index] || tracks[0];
      return NextResponse.json({ ...track, source: 'itunes', preview: true });
    } catch (error: unknown) {
      console.error('iTunes search error:', error instanceof Error ? error.message : error);
      if (nexrayFailed) {
        return NextResponse.json(
          { error: 'Layanan musik tidak bisa dijangkau' },
          { status: 503 },
        );
      }
      return NextResponse.json({ error: 'Tidak ada hasil' }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'Parameter q atau url diperlukan' }, { status: 400 });
}
