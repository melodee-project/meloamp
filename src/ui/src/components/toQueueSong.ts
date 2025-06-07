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
  return {
    id: song.id,
    title: song.title,
    artist: song.artist ? { ...song.artist } : EMPTY_ARTIST,
    album: song.album ? { ...song.album } : EMPTY_ALBUM,
    imageUrl: song.imageUrl || song.thumbnailUrl,
    url: song.streamUrl || '',
    durationMs: song.durationMs,
  };
}
