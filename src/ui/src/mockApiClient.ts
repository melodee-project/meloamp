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
  // Add more endpoints as needed
  throw new Error('Mock endpoint not implemented: ' + path);
}

export default {
  mockAuthenticate,
  mockApiRequest,
};
