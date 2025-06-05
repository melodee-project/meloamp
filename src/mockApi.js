// mockApi.js - Simple mock API for development
const faker = require('faker');
const express = require('express');
const app = express();
const PORT = 4000;

function randomImage() {
  // Use unsplash.it for random images
  return `https://picsum.photos/seed/${Math.floor(Math.random()*10000)}/200/200`;
}

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

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
