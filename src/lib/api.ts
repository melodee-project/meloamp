import { fetch } from '@tauri-apps/plugin-http';
import type { Album, Artist, Playlist, Song } from './types/music';
import type { User } from './types/user';

export interface AuthCredentials {
  serverUrl: string;
  email: string;
  password: string;
}

export interface SearchResults {
	meta: PaginationMeta;
	data: SearchResultData;
}

export interface SearchResultData {
	artists: Artist[];
	albums: Album[];
	songs: Song[];
	playlists: Playlist[];
}

export interface PaginationMeta {
	totalCount: number;
	pageSize: number;
	currentPage: number;
	totalPages: number;
	hasPreviousPage: boolean;
	hasNextPage: boolean;
}

export interface LoginResponse {
	user: User;
	token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
	meta: PaginationMeta;
}

class ApiService {
  private baseUrl: string = '';
  private token: string = '';

  setBaseUrl(url: string) {
    // Ensure the URL ends with /api/v1 (no trailing slash)
    let cleanUrl = url.trim();
    
    // Remove trailing slash if present
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    // Ensure it ends with /api/v1
    if (!cleanUrl.endsWith('/api/v1')) {
      if (cleanUrl.endsWith('/api')) {
        cleanUrl += '/v1';
      } else if (!cleanUrl.includes('/api')) {
        cleanUrl += '/api/v1';
      }
    }
    
    this.baseUrl = cleanUrl;
    console.log('API Base URL set to:', this.baseUrl);
  }

  setToken(token: string) {
    this.token = token;
  }

  // Test method to verify URL construction
  getFullUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  // Get current base URL for debugging
  getCurrentBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check if baseUrl is properly set
    if (!this.baseUrl || this.baseUrl.includes('localhost:1420')) {
      console.error('API baseUrl is not properly configured:', this.baseUrl);
      throw new Error('API configuration error: Base URL not set or invalid. Please login again.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making API request to:', url);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    console.log('Request headers:', headers);
    console.log('Request options:', options);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  async login(credentials: AuthCredentials): Promise<{ token: string; user: User }> {
    console.log('Login attempt with credentials:', { 
      serverUrl: credentials.serverUrl, 
      email: credentials.email 
    });
    
    this.setBaseUrl(credentials.serverUrl);
    
    // Log the full URL that will be used
    const fullUrl = this.getFullUrl('/user/authenticate');
    console.log('Full authentication URL:', fullUrl);
    
    const response = await this.request<{ token: string; user: User }>('/user/authenticate', {
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
    return this.request<User>('/user/me');
  }

  // Artists
  async getArtists(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Artist>> {
    return this.request<PaginatedResponse<Artist>>(`/artists?page=${page}&pageSize=${pageSize}`);
  }

  async getArtist(id: string): Promise<Artist> {
    return this.request<Artist>(`/artist/${id}`);
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
    return this.request<Album>(`/album/${id}`);
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
    return this.request<Song>(`/song/${id}`);
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
    return this.request<Playlist>(`/playlist/${id}`);
  }

  async getPlaylistSongs(playlistId: string): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/playlist/${playlistId}/songs`);
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