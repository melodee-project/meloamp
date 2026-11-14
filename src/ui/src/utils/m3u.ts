export interface M3uEntry {
  reference: string;
  songId?: string;
  artist?: string;
  title?: string;
  album?: string;
}

function referenceSongId(reference: string): string | undefined {
  const direct = reference.match(/^meloamp:song:(.+)$/i);
  if (direct) return direct[1];
  try {
    const url = new URL(reference, 'http://localhost');
    const queryId = url.searchParams.get('songId') || url.searchParams.get('songApiKey');
    if (queryId) return queryId;
    const pathId = url.pathname.match(/\/(?:songs?|stream)\/(?:stream\/)?([^/]+)(?:\/stream)?(?:\/|$)/i);
    return pathId ? decodeURIComponent(pathId[1]) : undefined;
  } catch {
    return undefined;
  }
}

const lineText = (value: string): string => value.replace(/[\r\n]+/g, ' ');

/** Include library IDs so exported playlists can be imported after URLs expire. */
export function serializeM3u(name: string, songs: Song[]): string {
  const lines = ['#EXTM3U', `#PLAYLIST:${lineText(name)}`];
  for (const song of songs) {
    const artist = song.artist?.name;
    const label = artist ? `${artist} - ${song.title}` : song.title;
    lines.push(`#EXTINF:${Math.round((song.durationMs || 0) / 1000)},${lineText(label)}`);
    if (song.album?.name) lines.push(`#EXTALB:${lineText(song.album.name)}`);
    lines.push(`#MELOAMP-SONG-ID:${lineText(song.id)}`);
    lines.push(song.streamUrl ? stripStreamAuth(song.streamUrl) : `meloamp:song:${song.id}`);
  }
  return lines.join('\n');
}

/** Parse extended M3U metadata without ever fetching its stream references. */
export function parseM3u(content: string): M3uEntry[] {
  const entries: M3uEntry[] = [];
  let metadata: Partial<M3uEntry> = {};
  for (const raw of content.replace(/^\uFEFF/, '').split(/\r\n|\n|\r/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^#EXTINF:/i.test(line)) {
      const label = line.slice(line.indexOf(',') + 1).trim();
      const separator = label.indexOf(' - ');
      metadata = separator < 0
        ? { title: label }
        : { artist: label.slice(0, separator).trim(), title: label.slice(separator + 3).trim() };
    } else if (/^#EXTALB:/i.test(line)) {
      metadata.album = line.slice(line.indexOf(':') + 1).trim();
    } else if (/^#MELOAMP-SONG-ID:/i.test(line)) {
      metadata.songId = line.slice(line.indexOf(':') + 1).trim();
    } else if (/^# Song ID:/i.test(line)) {
      entries.push({ ...metadata, reference: line, songId: line.slice(line.indexOf(':') + 1).trim() });
      metadata = {};
    } else if (!line.startsWith('#')) {
      const entry = { ...metadata, reference: line, songId: metadata.songId || referenceSongId(line) };
      if (!entry.title) {
        // Basic M3U files may contain only local media filenames.
        const filename = line.split(/[\\/]/).pop() ?? '';
        const label = filename.replace(/\.(mp3|flac|ogg|opus|wav|m4a|aac)$/i, '');
        if (label !== filename) {
          const separator = label.indexOf(' - ');
          entry.title = separator < 0 ? label : label.slice(separator + 3);
          if (separator >= 0) entry.artist = label.slice(0, separator);
        }
      }
      entries.push(entry);
      metadata = {};
    }
  }
  return entries;
}
import { Song } from '../apiModels';
import { stripStreamAuth } from './streamUrl';

