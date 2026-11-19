import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DELIRIUS_API = 'https://api.delirius.store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const urlParam = searchParams.get('url');
  const source = searchParams.get('source') || 'youtube';
  const index = parseInt(searchParams.get('index') || '0', 10);

  if (urlParam) {
    try {
      let downloadUrl = '';
      if (source === 'spotify') {
        downloadUrl = `${DELIRIUS_API}/download/spotifydl?url=${encodeURIComponent(urlParam)}`;
      } else {
        downloadUrl = `${DELIRIUS_API}/download/ytmp3?url=${encodeURIComponent(urlParam)}`;
      }
      const res = await axios.get(downloadUrl);
      const audioUrl = res.data.data?.download || '';
      if (!audioUrl) {
        return NextResponse.json({ error: 'Gagal mendapatkan audio' }, { status: 500 });
      }
      return NextResponse.json({ audioUrl });
    } catch (error: unknown) {
      console.error('Download error:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Gagal download' }, { status: 500 });
    }
  }

  if (q) {
    try {
      let searchUrl = '';
      if (source === 'spotify') {
        searchUrl = `${DELIRIUS_API}/search/spotify?q=${encodeURIComponent(q)}`;
      } else {
        searchUrl = `${DELIRIUS_API}/search/ytsearch?q=${encodeURIComponent(q)}`;
      }
      const searchRes = await axios.get(searchUrl);
      const searchData = searchRes.data;
      if (!searchData.data || searchData.data.length === 0) {
        return NextResponse.json({ error: 'Tidak ada hasil' }, { status: 404 });
      }
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
      const downloadRes = await axios.get(downloadUrl);
      const audioUrl = downloadRes.data.data?.download || '';
      if (!audioUrl) {
        return NextResponse.json({ error: 'Gagal mendapatkan audio' }, { status: 500 });
      }

      return NextResponse.json({
        title,
        artist,
        coverUrl,
        url,
        source,
        audioUrl,
      });
    } catch (error: unknown) {
      console.error('Search error:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Parameter q atau url diperlukan' }, { status: 400 });
}
