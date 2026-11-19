export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  url: string;          // link sumber (YouTube/Spotify)
  source: 'youtube' | 'spotify';
  audioUrl?: string;    // hasil download (akan diisi saat diputar)
}
