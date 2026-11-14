import api, { buildEndpoint, unwrapApiResponse } from './api';
import { API_ROUTES } from './apiRoutes';
import { SearchResultData, Song } from './apiModels';
import { getErrorStatus } from './utils/errors';
import { M3uEntry } from './utils/m3u';

const normalize = (value: string | undefined): string =>
  (value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

async function resolveEntry(entry: M3uEntry): Promise<string | null> {
  if (entry.songId) {
    try {
      const response = await api.get(buildEndpoint(API_ROUTES.songs.detail, { id: entry.songId }));
      const song = unwrapApiResponse<Song>(response.data);
      if (song?.id === entry.songId) return song.id;
    } catch (error) {
      if (getErrorStatus(error) !== 404) throw error;
    }
  }
  if (!entry.title) return null;

  const matches = new Set<string>();
  const pageSize = 100;
  for (let songPage = 1; ; songPage += 1) {
    const response = await api.post(API_ROUTES.search.basic, {
      query: entry.title, type: 'songs', songPage, pageSize,
    });
    const result = unwrapApiResponse<SearchResultData>(response.data);
    const songs = result?.songs ?? [];
    for (const song of songs) {
      if (normalize(song.title) === normalize(entry.title)
        && (!entry.artist || normalize(song.artist?.name) === normalize(entry.artist))
        && (!entry.album || normalize(song.album?.name) === normalize(entry.album))) {
        matches.add(song.id);
      }
    }
    // Ambiguous metadata must not silently import the wrong recording.
    if (matches.size > 1) return null;
    if (!songs.length || songPage * pageSize >= (result?.totalSongs ?? songs.length)) break;
  }
  return matches.size === 1 ? [...matches][0] : null;
}

/** Resolve library IDs in file order, preserving repeated playlist entries. */
export async function matchPlaylistEntries(entries: M3uEntry[]): Promise<{ songIds: string[]; unmatched: M3uEntry[] }> {
  const songIds: string[] = [];
  const unmatched: M3uEntry[] = [];
  const cache = new Map<string, string | null>();
  for (const entry of entries) {
    const key = JSON.stringify([entry.songId, entry.artist, entry.title, entry.album]);
    if (!cache.has(key)) cache.set(key, await resolveEntry(entry));
    const id = cache.get(key);
    if (id) songIds.push(id);
    else unmatched.push(entry);
  }
  return { songIds, unmatched };
}
