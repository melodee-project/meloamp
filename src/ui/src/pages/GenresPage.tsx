/**
 * GenresPage - Browse music by genre
 */
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Card, 
  CardContent,
  CardActionArea,
  Alert,
  Chip
} from '@mui/material';
import { MusicNote, Category } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { Artist, Album, Song, PaginatedResponse } from '../apiModels';
import ArtistCard from '../components/ArtistCard';
import AlbumCard from '../components/AlbumCard';
import SongCard from '../components/SongCard';

interface Genre {
  id: string;
  name: string;
  artistCount?: number;
  albumCount?: number;
  songCount?: number;
}

export default function GenresPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { genreId } = useParams<{ genreId?: string }>();
  
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch genres list
  useEffect(() => {
    const fetchGenres = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await api.get<{ data: Genre[] } | Genre[]>('/genres');
        const genreData = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
        setGenres(genreData);
      } catch (err: any) {
        // If endpoint doesn't exist, show placeholder genres from albums/artists
        if (err?.response?.status === 404) {
          // Try to aggregate genres from albums (fallback approach)
          try {
            const albumRes = await api.get<PaginatedResponse<Album>>('/albums', { params: { pageSize: 100 } });
            const albumGenres = new Set<string>();
            (albumRes.data.data || []).forEach(album => {
              if (album.genre) albumGenres.add(album.genre);
              // Check for genres array if it exists on the response
              const albumAny = album as any;
              if (albumAny.genres && Array.isArray(albumAny.genres)) {
                albumAny.genres.forEach((g: string) => albumGenres.add(g));
              }
            });
            
            const aggregatedGenres: Genre[] = Array.from(albumGenres)
              .filter(g => g && g.trim())
              .map(g => ({ id: g.toLowerCase().replace(/\s+/g, '-'), name: g }));
            
            setGenres(aggregatedGenres);
          } catch {
            setGenres([]);
          }
        } else {
          setError(err?.response?.data?.message || t('common.error'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [t]);

  // Fetch genre details when genreId changes
  useEffect(() => {
    if (!genreId) {
      setSelectedGenre(null);
      setArtists([]);
      setAlbums([]);
      setSongs([]);
      return;
    }

    const fetchGenreDetails = async () => {
      setDetailLoading(true);
      
      // Find genre from list
      const genre = genres.find(g => g.id === genreId || g.name.toLowerCase().replace(/\s+/g, '-') === genreId);
      if (genre) {
        setSelectedGenre(genre);
      }

      try {
        // Try to fetch genre-specific content
        // If server supports genre endpoints:
        const [artistsRes, albumsRes, songsRes] = await Promise.allSettled([
          api.get<PaginatedResponse<Artist>>(`/genres/${genreId}/artists`, { params: { pageSize: 20 } }),
          api.get<PaginatedResponse<Album>>(`/genres/${genreId}/albums`, { params: { pageSize: 20 } }),
          api.get<PaginatedResponse<Song>>(`/genres/${genreId}/songs`, { params: { pageSize: 20 } })
        ]);

        if (artistsRes.status === 'fulfilled') {
          setArtists(artistsRes.value.data.data || []);
        }
        if (albumsRes.status === 'fulfilled') {
          setAlbums(albumsRes.value.data.data || []);
        }
        if (songsRes.status === 'fulfilled') {
          setSongs(songsRes.value.data.data || []);
        }
      } catch {
        // Fallback: filter locally (less efficient but works without API support)
        // This requires fetching all content which is expensive
      } finally {
        setDetailLoading(false);
      }
    };

    if (genres.length > 0) {
      fetchGenreDetails();
    }
  }, [genreId, genres]);

  // Genre grid view
  const renderGenreList = () => (
    <>
      <Typography variant="h5" gutterBottom>
        {t('genres.title', 'Browse by Genre')}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : genres.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <Category sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="body1">
            {t('genres.noGenres', 'No genres found. Genre browsing requires server support.')}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {genres.map((genre) => (
            <Box key={genre.id} sx={{ flex: '1 1 150px', maxWidth: 200, minWidth: 140 }}>
              <Card>
                <CardActionArea onClick={() => navigate(`/genres/${genre.id}`)}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <MusicNote sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle1" noWrap>
                      {genre.name}
                    </Typography>
                    {(genre.artistCount || genre.albumCount || genre.songCount) && (
                      <Typography variant="caption" color="text.secondary">
                        {genre.albumCount && `${genre.albumCount} albums`}
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          ))}
        </Box>
      )}
    </>
  );

  // Genre detail view
  const renderGenreDetail = () => (
    <>
      <Box sx={{ mb: 3 }}>
        <Chip 
          label={t('genres.backToGenres', '← All Genres')} 
          onClick={() => navigate('/genres')}
          sx={{ mb: 2 }}
        />
        <Typography variant="h5" gutterBottom>
          {selectedGenre?.name || genreId}
        </Typography>
      </Box>

      {detailLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Artists */}
          {artists.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('genres.artists', 'Artists')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {artists.map((artist) => (
                  <Box key={artist.id} sx={{ flex: '1 1 200px', maxWidth: 250 }}>
                    <ArtistCard artist={artist} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('genres.albums', 'Albums')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {albums.map((album) => (
                  <Box key={album.id} sx={{ flex: '1 1 200px', maxWidth: 250 }}>
                    <AlbumCard album={album} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Songs */}
          {songs.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('genres.songs', 'Songs')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {songs.map((song) => (
                  <Box key={song.id} sx={{ width: 300 }}>
                    <SongCard song={song} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {artists.length === 0 && albums.length === 0 && songs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <Typography variant="body1">
                {t('genres.noContent', 'No content found for this genre.')}
              </Typography>
            </Box>
          )}
        </>
      )}
    </>
  );

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {genreId ? renderGenreDetail() : renderGenreList()}
    </Box>
  );
}
