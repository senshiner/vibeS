export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  spotifyUrl: string; // URL track Spotify (bisa dari share link)
}

export interface UserData {
  photoUrl: string | null;
  wish: string;
}
