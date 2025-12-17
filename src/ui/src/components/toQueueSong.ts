// src/ui/src/components/toQueueSong.ts
// Helper to normalize API Song to queueStore Song
import { Song as ApiSong, Artist, Album } from '../apiModels';

const EMPTY_ARTIST: Artist = {
  id: '',
  name: 'Unknown Artist',
  userStarred: false,
  userRating: 0,
  albumCount: 0,
  songCount: 0,
  createdAt: '',
  updatedAt: '',
};

const EMPTY_ALBUM: Album = {
  id: '',
  artist: EMPTY_ARTIST,
  name: 'Unknown Album',
  releaseYear: 0,
  userStarred: false,
  userRating: 0,
  songCount: 0,
  durationMs: 0,
  durationFormatted: '',
  createdAt: '',
  updatedAt: '',
  genre: '',
};

export function toQueueSong(song: ApiSong) {
  // Append JWT to stream URL to fix audio element auth (can't send headers)
  let streamUrl = song.streamUrl || '';
  if (streamUrl) {
    try {
      const jwt = localStorage.getItem('jwt');
      if (jwt) {
        const url = new URL(streamUrl, window.location.origin);
        url.searchParams.set('jwt', jwt);
        streamUrl = url.toString();
      }
    } catch (e) {
      console.warn('[toQueueSong] Failed to append JWT to stream URL:', e);
    }
  }
  
  return {
    id: song.id,
    title: song.title,
    artist: song.artist ? { ...song.artist } : EMPTY_ARTIST,
    album: song.album ? { 
      ...song.album,
      // Ensure imageUrl is preserved for full-screen display
      imageUrl: song.album.imageUrl || song.album.thumbnailUrl 
    } : EMPTY_ALBUM,
    imageUrl: song.imageUrl || song.thumbnailUrl,
    url: streamUrl,
  durationMs: song.durationMs,
  userStarred: song.userStarred ?? false,
  userRating: song.userRating ?? 0,
  };
}
