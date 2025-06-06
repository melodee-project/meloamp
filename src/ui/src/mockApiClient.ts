// mockApiClient.ts - Client for using the mock API in the React app

const MOCK_TOKEN = btoa('melodee:mocktoken');

export async function mockAuthenticate({ email, password }: { email: string; password: string }) {
  await new Promise(r => setTimeout(r, 500)); // Simulate network delay
  if (email === 'melodee@home.arpa' && password === 'password') {
    return { token: MOCK_TOKEN };
  } else {
    const error: any = new Error('Invalid credentials');
    error.response = { data: { message: 'Invalid credentials' }, status: 401 };
    throw error;
  }
}

export async function mockApiRequest(path: string, options: any = {}) {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 300));
  // Add more mock endpoints as needed
  if (path === '/albums') {
    const page = options.params?.page || 1;
    const pageSize = options.params?.pageSize || 20;
    const total = 500;
    const albums = Array.from({ length: pageSize }, (_, i) => ({
      id: (page-1)*pageSize + i + 1,
      title: `Mock Album ${(page-1)*pageSize + i + 1}`,
      artist: `Mock Artist ${(page-1)*pageSize + i + 1}`,
      cover: `https://picsum.photos/seed/${(page-1)*pageSize + i + 1}/200/200`,
    }));
    return { data: { data: albums, page, pageSize, total } };
  }
  if (path === '/artists') {
    const page = options.params?.page || 1;
    const pageSize = options.params?.pageSize || 20;
    const total = 500;
    const artists = Array.from({ length: pageSize }, (_, i) => ({
      id: (page-1)*pageSize + i + 1,
      name: `Mock Artist ${(page-1)*pageSize + i + 1}`,
      imageUrl: `https://picsum.photos/seed/artist${(page-1)*pageSize + i + 1}/200/200`,
      thumbnailUrl: `https://picsum.photos/seed/artistthumb${(page-1)*pageSize + i + 1}/100/100`,
    }));
    return { data: { data: artists, page, pageSize, total } };
  }
  if (path === '/songs') {
    const page = options.params?.page || 1;
    const pageSize = options.params?.pageSize || 20;
    const total = 500;
    const songs = Array.from({ length: pageSize }, (_, i) => ({
      id: (page-1)*pageSize + i + 1,
      title: `Mock Song ${(page-1)*pageSize + i + 1}`,
      artist: { name: `Mock Artist ${(page-1)*pageSize + i + 1}` },
      imageUrl: `https://picsum.photos/seed/song${(page-1)*pageSize + i + 1}/200/200`,
      thumbnailUrl: `https://picsum.photos/seed/songthumb${(page-1)*pageSize + i + 1}/100/100`,
    }));
    return { data: { data: songs, page, pageSize, total } };
  }
  if (path === '/artists/recent') {
    const artists = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Recent Artist ${i + 1}`,
      imageUrl: `https://picsum.photos/seed/recentartist${i + 1}/200/200`,
      thumbnailUrl: `https://picsum.photos/seed/recentartistthumb${i + 1}/100/100`,
    }));
    return { data: { data: artists } };
  }
  if (path === '/albums/recent') {
    const albums = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      title: `Recent Album ${i + 1}`,
      artist: `Recent Artist ${i + 1}`,
      cover: `https://picsum.photos/seed/recentalbum${i + 1}/200/200`,
    }));
    return { data: { data: albums } };
  }
  if (path === '/users/playlists') {
    const playlists = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Playlist ${i + 1}`,
      imageUrl: `https://picsum.photos/seed/playlist${i + 1}/200/200`,
    }));
    return { data: { data: playlists } };
  }
  if (path.startsWith('/playlists/') && path.endsWith('/songs')) {
    const songs = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Playlist Song ${i + 1}`,
      artist: { name: `Playlist Artist ${i + 1}` },
      imageUrl: `https://picsum.photos/seed/playlistsong${i + 1}/200/200`,
      thumbnailUrl: `https://picsum.photos/seed/playlistsongthumb${i + 1}/100/100`,
    }));
    return { data: { data: songs } };
  }
  if (path === '/users/me') {
    return { data: { id: 1, name: 'Demo User', email: 'melodee@home.arpa', avatar: 'https://picsum.photos/seed/useravatar/200/200' } };
  }
  // Add more endpoints as needed
  throw new Error('Mock endpoint not implemented: ' + path);
}

export default {
  mockAuthenticate,
  mockApiRequest,
};
