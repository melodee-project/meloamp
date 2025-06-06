// mockApi.js - Simple mock API for development
const { faker } = require('@faker-js/faker');
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 4000;

function randomImage() {
  // Use unsplash.it for random images
  return `https://picsum.photos/seed/${Math.floor(Math.random()*10000)}/200/200`;
}

app.use(cors());
app.use(express.json());

const router = express.Router();

router.get('/albums', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const total = 500;
  const albums = Array.from({ length: pageSize }, (_, i) => ({
    id: (page-1)*pageSize + i + 1,
    title: faker.commerce.productName(),
    artist: faker.name.findName(),
    cover: randomImage(),
  }));
  res.json({
    data: albums,
    page,
    pageSize,
    total,
  });
});

router.post('/user/authenticate', (req, res) => {
  const { email, password } = req.body;
  if (email === 'meloamp@home.arpa' && password === 'password') {
    // Generate a fake JWT token (not secure, for mock only)
    const token = Buffer.from(`${email}:mocktoken`).toString('base64');
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

router.get('/artists', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const total = 500;
  const artists = Array.from({ length: pageSize }, (_, i) => ({
    id: (page-1)*pageSize + i + 1,
    name: faker.name.findName(),
    imageUrl: randomImage(),
    thumbnailUrl: randomImage(),
  }));
  res.json({
    data: artists,
    page,
    pageSize,
    total,
  });
});

router.get('/songs', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const total = 500;
  const songs = Array.from({ length: pageSize }, (_, i) => ({
    id: (page-1)*pageSize + i + 1,
    title: faker.commerce.productName(),
    artist: { name: faker.name.findName() },
    imageUrl: randomImage(),
    thumbnailUrl: randomImage(),
  }));
  res.json({
    data: songs,
    page,
    pageSize,
    total,
  });
});

router.get('/artists/recent', (req, res) => {
  const artists = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: faker.name.findName(),
    imageUrl: randomImage(),
    thumbnailUrl: randomImage(),
  }));
  res.json({ data: artists });
});

router.get('/albums/recent', (req, res) => {
  const albums = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: faker.commerce.productName(),
    artist: faker.name.findName(),
    cover: randomImage(),
  }));
  res.json({ data: albums });
});

router.get('/users/playlists', (req, res) => {
  const playlists = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `Playlist ${i + 1}`,
    imageUrl: randomImage(),
  }));
  res.json({ data: playlists });
});

router.get('/playlists/:id/songs', (req, res) => {
  const songs = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    title: faker.commerce.productName(),
    artist: { name: faker.name.findName() },
    imageUrl: randomImage(),
    thumbnailUrl: randomImage(),
  }));
  res.json({ data: songs });
});

router.get('/users/me', (req, res) => {
  res.json({
    id: 1,
    name: 'Demo User',
    email: 'melodee@home.arpa',
    avatar: randomImage(),
  });
});

app.use('/', router);
app.use('/api/v1', router);

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
