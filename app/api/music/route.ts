import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DELIRIUS_API = 'https://api.delirius.store';
const ITUNES_SEARCH_API = 'https://itunes.apple.com/search';
const ITUNES_LOOKUP_PREFIX = 'https://itunes.apple.com/lookup?id=';

/**
 * Jalur utama: Delirius (tidak resmi) untuk lagu full, sumber YouTube
 * (default) atau Spotify. Jalur cadangan: iTunes Search API, yang
 * mengembalikan preview 30 detik. Delirius sudah terbukti tidak bisa
 * dijangkau dari beberapa jaringan, jadi tanpa cadangan pencarian
 * mengembalikan nol hasil dan pengguna mengira lagunya tidak ada.
 *
 * Pesan gagal dibedakan dengan jujur: layanan tidak bisa dijangkau
 * (503) vs memang tidak ada hasil (404). Jangan pernah membalas
 * "tidak ada hasil" saat yang gagal adalah layanannya.
 */

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
// kunci tidak menembak iTunes lima kali.
const itunesCache = new Map<string, { at: number; tracks: ItunesTrack[] }>();
const ITUNES_CACHE_TTL_MS = 60_000;

async function searchItunes(q: string): Promise<ItunesTrack[]> {
  const key = q.trim().toLowerCase();
  const cached = itunesCache.get(key);
  if (cached && Date.now() - cached.at < ITUNES_CACHE_TTL_MS) return cached.tracks;
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const urlParam = searchParams.get('url');
  const source = searchParams.get('source') || 'youtube';
  const index = parseInt(searchParams.get('index') || '0', 10);

  if (urlParam) {
    // Lagu preview iTunes: audio di-resolve ulang dari lookup, karena
    // favorit hanya menyimpan metadata, bukan link audio.
    if (source === 'itunes' || urlParam.startsWith(ITUNES_LOOKUP_PREFIX)) {
      try {
        const previewUrl = await itunesPreviewUrl(urlParam);
        if (!previewUrl) {
          return NextResponse.json({ error: 'Gagal mendapatkan audio' }, { status: 500 });
        }
        return NextResponse.json({ audioUrl: previewUrl });
      } catch (error: unknown) {
        console.error('iTunes lookup error:', error instanceof Error ? error.message : error);
        return NextResponse.json(
          { error: 'Layanan musik tidak bisa dijangkau' },
          { status: 503 },
        );
      }
    }
    try {
      let downloadUrl = '';
      if (source === 'spotify') {
        downloadUrl = `${DELIRIUS_API}/download/spotifydl?url=${encodeURIComponent(urlParam)}`;
      } else {
        downloadUrl = `${DELIRIUS_API}/download/ytmp3?url=${encodeURIComponent(urlParam)}`;
      }
      const res = await axios.get(downloadUrl, { timeout: 15_000 });
      const audioUrl = res.data.data?.download || '';
      if (!audioUrl) {
        return NextResponse.json({ error: 'Gagal mendapatkan audio' }, { status: 500 });
      }
      return NextResponse.json({ audioUrl });
    } catch (error: unknown) {
      console.error('Download error:', error instanceof Error ? error.message : error);
      return NextResponse.json(
        { error: 'Layanan musik tidak bisa dijangkau' },
        { status: 503 },
      );
    }
  }

  if (q) {
    let deliriusFailed = false;
    try {
      let searchUrl = '';
      if (source === 'spotify') {
        searchUrl = `${DELIRIUS_API}/search/spotify?q=${encodeURIComponent(q)}`;
      } else {
        searchUrl = `${DELIRIUS_API}/search/ytsearch?q=${encodeURIComponent(q)}`;
      }
      const searchRes = await axios.get(searchUrl, { timeout: 15_000 });
      const searchData = searchRes.data;
      if (searchData.data && searchData.data.length > 0) {
        const result = searchData.data[index] || searchData.data[0];

        const title = result.title || '';
        let artist = '';
        let coverUrl = '';
        let url = '';
        if (source === 'spotify') {
          artist = result.artist || '';
          url = result.url || '';
          coverUrl = result.cover || '';
        } else {
          artist = result.author?.name || '';
          url = result.url || '';
          coverUrl = result.thumbnail || '';
        }

        let downloadUrl = '';
        if (source === 'spotify') {
          downloadUrl = `${DELIRIUS_API}/download/spotifydl?url=${encodeURIComponent(url)}`;
        } else {
          downloadUrl = `${DELIRIUS_API}/download/ytmp3?url=${encodeURIComponent(url)}`;
        }
        const downloadRes = await axios.get(downloadUrl, { timeout: 15_000 });
        const audioUrl = downloadRes.data.data?.download || '';
        if (audioUrl) {
          return NextResponse.json({
            title,
            artist,
            coverUrl,
            url,
            source,
            audioUrl,
          });
        }
        // Pencarian dapat, audio tidak: anggap Delirius gagal, lanjut ke cadangan.
        deliriusFailed = true;
      }
    } catch (error: unknown) {
      console.error('Search error:', error instanceof Error ? error.message : error);
      deliriusFailed = true;
    }

    // Cadangan: iTunes, preview 30 detik.
    try {
      const tracks = await searchItunes(q);
      if (tracks.length === 0) {
        return NextResponse.json({ error: 'Tidak ada hasil' }, { status: 404 });
      }
      const track = tracks[index] || tracks[0];
      return NextResponse.json({ ...track, source: 'itunes' });
    } catch (error: unknown) {
      console.error('iTunes search error:', error instanceof Error ? error.message : error);
      if (deliriusFailed) {
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
