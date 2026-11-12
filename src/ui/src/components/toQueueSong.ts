// src/ui/src/components/toQueueSong.ts
// Normalize an API `Song` into the queue's `Song` shape.
//
// Note: the stream URL is stored *without* credentials. `Player` injects the
// current JWT at playback time (`utils/streamUrl.ts`) so that persisted queue
// state never contains tokens and refreshed tokens take effect immediately.
import { Song as ApiSong, Artist, Album } from '../apiModels';
import { Song } from '../queueStore';
import { stripStreamAuth } from '../utils/streamUrl';

const EMPTY_ARTIST: Artist = {
  id: '',
  name: 'Unknown Artist',
  thumbnailUrl: '',
  imageUrl: '',
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
  thumbnailUrl: '',
  imageUrl: '',
  releaseYear: 0,
  userStarred: false,
  userRating: 0,
  songCount: 0,
  durationMs: 0,
  durationFormatted: '',
  createdAt: '',
  updatedAt: '',
  genre: null,
};

export function toQueueSong(song: ApiSong): Song {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist
      ? { id: song.artist.id, name: song.artist.name, imageUrl: song.artist.imageUrl }
      : EMPTY_ARTIST,
    album: song.album
      ? {
        id: song.album.id,
        name: song.album.name,
        imageUrl: song.album.imageUrl || song.album.thumbnailUrl,
        releaseYear: song.album.releaseYear,
      }
      : EMPTY_ALBUM,
    imageUrl: song.imageUrl || song.thumbnailUrl,
    url: stripStreamAuth(song.streamUrl || ''),
    durationMs: song.durationMs,
    userStarred: song.userStarred ?? false,
    userRating: song.userRating ?? 0,
  };
}
