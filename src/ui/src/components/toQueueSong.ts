// src/ui/src/components/toQueueSong.ts
// Helper to normalize API Song to queueStore Song
import { Song } from '../apiModels';

export function toQueueSong(song: Song) {
  return {
    id: song.id,
    title: song.title,
    artist: { name: song.artist?.name || '' },
    imageUrl: song.imageUrl || song.thumbnailUrl,
    url: song.streamUrl || '',
  };
}
