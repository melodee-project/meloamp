// mockApi.js - Simple mock API for development
const faker = require('faker');
const express = require('express');
const app = express();
const PORT = 4000;

function randomImage() {
  // Use unsplash.it for random images
  return `https://picsum.photos/seed/${Math.floor(Math.random()*10000)}/200/200`;
}

app.use(express.json());

app.get('/albums', (req, res) => {
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

app.post('/user/authenticate', (req, res) => {
  const { email, password } = req.body;
  if (email === 'meloamp@home.arpa' && password === 'password') {
    // Generate a fake JWT token (not secure, for mock only)
    const token = Buffer.from(`${email}:mocktoken`).toString('base64');
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
