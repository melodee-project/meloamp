import { useEffect } from 'react';
import { Song } from '../queueStore';

interface TrayUpdateDeps {
  currentSong: Song | undefined;
  playing: boolean;
}

const extractArtistName = (song: Song | undefined): string => {
  if (!song) return '';
  if (typeof song.artist === 'object' && song.artist?.name) return song.artist.name;
  return '';
};

export function useTrayUpdate({ currentSong, playing }: TrayUpdateDeps) {
  useEffect(() => {
    if (!window.meloampAPI?.updateTray) return;
    if (currentSong) {
      window.meloampAPI.updateTray({
        title: currentSong.title || '',
        artist: extractArtistName(currentSong),
        playing,
      });
    } else {
      window.meloampAPI.updateTray(null);
    }
  }, [currentSong, playing]);
}
