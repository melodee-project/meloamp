import { fetch } from '@tauri-apps/plugin-http';

export interface AuthCredentials {
  serverUrl: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface Artist {
  id: string;
  name: string;
  image?: string;
  albumCount: number;
  songCount: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  image?: string;
  year?: number;
  songCount: number;
  duration: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  duration: number;
  track?: number;
  year?: number;
  genre?: string;
  streamUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  songCount: number;
  duration: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

class ApiService {
  private baseUrl: string = '';
  private token: string = '';

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async login(credentials: AuthCredentials): Promise<{ token: string; user: User }> {
    this.setBaseUrl(credentials.serverUrl);
    
    const response = await this.request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    this.setToken(response.token);
    return response;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/auth/profile');
  }

  // Artists
  async getArtists(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Artist>> {
    return this.request<PaginatedResponse<Artist>>(`/artists?page=${page}&pageSize=${pageSize}`);
  }

  async getArtist(id: string): Promise<Artist> {
    return this.request<Artist>(`/artists/${id}`);
  }

  async getRecentArtists(limit: number = 10): Promise<Artist[]> {
    const response = await this.request<PaginatedResponse<Artist>>(`/artists/recent?limit=${limit}`);
    return response.data;
  }

  // Albums
  async getAlbums(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Album>> {
    return this.request<PaginatedResponse<Album>>(`/albums?page=${page}&pageSize=${pageSize}`);
  }

  async getAlbum(id: string): Promise<Album> {
    return this.request<Album>(`/albums/${id}`);
  }

  async getRecentAlbums(limit: number = 10): Promise<Album[]> {
    const response = await this.request<PaginatedResponse<Album>>(`/albums/recent?limit=${limit}`);
    return response.data;
  }

  async getArtistAlbums(artistId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Album>> {
    return this.request<PaginatedResponse<Album>>(`/artists/${artistId}/albums?page=${page}&pageSize=${pageSize}`);
  }

  // Songs
  async getSongs(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Song>> {
    return this.request<PaginatedResponse<Song>>(`/songs?page=${page}&pageSize=${pageSize}`);
  }

  async getSong(id: string): Promise<Song> {
    return this.request<Song>(`/songs/${id}`);
  }

  async getRecentSongs(limit: number = 10): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/songs/recent?limit=${limit}`);
    return response.data;
  }

  async getAlbumSongs(albumId: string): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/albums/${albumId}/songs`);
    return response.data;
  }

  async getArtistSongs(artistId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Song>> {
    return this.request<PaginatedResponse<Song>>(`/artists/${artistId}/songs?page=${page}&pageSize=${pageSize}`);
  }

  // Playlists
  async getPlaylists(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Playlist>> {
    return this.request<PaginatedResponse<Playlist>>(`/playlists?page=${page}&pageSize=${pageSize}`);
  }

  async getPlaylist(id: string): Promise<Playlist> {
    return this.request<Playlist>(`/playlists/${id}`);
  }

  async getPlaylistSongs(playlistId: string): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/playlists/${playlistId}/songs`);
    return response.data;
  }

  async createPlaylist(name: string, description?: string, isPublic: boolean = false): Promise<Playlist> {
    return this.request<Playlist>('/playlists', {
      method: 'POST',
      body: JSON.stringify({ name, description, isPublic }),
    });
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist> {
    return this.request<Playlist>(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.request<void>(`/playlists/${id}`, {
      method: 'DELETE',
    });
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    await this.request<void>(`/playlists/${playlistId}/songs`, {
      method: 'POST',
      body: JSON.stringify({ songId }),
    });
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
    await this.request<void>(`/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
    });
  }

  // Search
  async search(query: string, type?: 'artists' | 'albums' | 'songs' | 'playlists'): Promise<{
    artists: Artist[];
    albums: Album[];
    songs: Song[];
    playlists: Playlist[];
  }> {
    const params = new URLSearchParams({ q: query });
    if (type) params.append('type', type);
    
    return this.request<{
      artists: Artist[];
      albums: Album[];
      songs: Song[];
      playlists: Playlist[];
    }>(`/search?${params.toString()}`);
  }
}

export const api = new ApiService(); 