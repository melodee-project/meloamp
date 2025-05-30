import { fetch } from '@tauri-apps/plugin-http';
import type { Album, Artist, Playlist, Song } from './types/music';
import type { User } from './types/user';

// Define the client options type according to Tauri v2 HTTP plugin
interface ClientOptions {
  danger?: {
    acceptInvalidCerts?: boolean;
    acceptInvalidHostnames?: boolean;
  };
}

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

  // Image proxy method to handle self-signed SSL certificates
  async getImageBlob(imageUrl: string): Promise<string> {
    try {
      const response = await fetch(imageUrl, {
        method: 'GET',
        connectTimeout: 30000,
        danger: {
          acceptInvalidCerts: true,
          acceptInvalidHostnames: true
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.status}`);
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to load image through proxy:', error);
      return '/placeholder-music.png'; // Return fallback
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.baseUrl) {
      throw new Error('API base URL not configured. Please authenticate first.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log(`Making ${options.method || 'GET'} request to:`, url);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      // Configure dangerous settings for self-signed certificates
      const response = await fetch(url, {
        ...options,
        headers,
        // Use Tauri v2 HTTP plugin client options format
        connectTimeout: 30000,
        danger: {
          acceptInvalidCerts: true,
          acceptInvalidHostnames: true
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text() as unknown as T;
      }
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
    const fullUrl = this.getFullUrl('/users/authenticate');
    console.log('Full authentication URL:', fullUrl);
    
    const response = await this.request<{ token: string; user: User }>('/users/authenticate', {
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
    return this.request<User>('/users/me');
  }

  // Artists
  async getArtists(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Artist>> {
    return this.request<PaginatedResponse<Artist>>(`/artists?page=${page}&pageSize=${pageSize}`);
  }

  async getArtist(id: string): Promise<Artist> {
    return this.request<Artist>(`/artist/${id}`);
  }

  async getRecentArtists(limit: number = 10): Promise<Artist[]> {
    const response = await this.request<PaginatedResponse<Artist>>(`/artists/recent?limit=${limit}`, {
      method: 'POST'
    });
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
    const response = await this.request<PaginatedResponse<Album>>(`/albums/recent?limit=${limit}`, {
      method: 'POST'
    });
    return response.data;
  }

  async getArtistAlbums(artistId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Album>> {
    return this.request<PaginatedResponse<Album>>(`/artists/${artistId}/albums?page=${page}&pageSize=${pageSize}`, {
      method: 'POST'
    });
  }

  // Songs
  async getSongs(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Song>> {
    return this.request<PaginatedResponse<Song>>(`/songs?page=${page}&pageSize=${pageSize}`);
  }

  async getSong(id: string): Promise<Song> {
    return this.request<Song>(`/song/${id}`);
  }

  async getRecentSongs(limit: number = 10): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/songs/recent?limit=${limit}`, {
      method: 'POST'
    });
    return response.data;
  }

  async getAlbumSongs(albumId: string): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/albums/${albumId}/songs`, {
      method: 'POST'
    });
    return response.data;
  }

  async getArtistSongs(artistId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Song>> {
    return this.request<PaginatedResponse<Song>>(`/artists/${artistId}/songs?page=${page}&pageSize=${pageSize}`, {
      method: 'POST'
    });
  }

  // Playlists
  async getPlaylists(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<Playlist>> {
    return this.request<PaginatedResponse<Playlist>>(`/playlists?page=${page}&pageSize=${pageSize}`);
  }

  async getPlaylist(id: string): Promise<Playlist> {
    return this.request<Playlist>(`/playlist/${id}`);
  }

  async getPlaylistSongs(playlistId: string): Promise<Song[]> {
    const response = await this.request<PaginatedResponse<Song>>(`/playlist/${playlistId}/songs`, {
      method: 'POST'
    });
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