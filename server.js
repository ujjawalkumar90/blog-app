require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./db');
const { router: authRoutes, requireAuth } = require('./auth');
const { Post } = require('./models');

const app = express();
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', (req, res, next) => { connectDB().then(() => next(), next); });

// Wrap async handlers so errors reach the error handler (Express 4)
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);
authRoutes.stack.forEach((layer) => layer.route.stack.forEach((s) => { s.handle = wrap(s.handle); }));
app.use('/api/auth', authRoutes);

const withAuthor = (query) => query.populate('author', 'name'); // never expose email or password

function validPost(req, res, next) {
  const { title, content } = req.body;
  const ok = (v, max) => typeof v === 'string' && v.trim() && v.trim().length <= max;
  if (!ok(title, 120) || !ok(content, 5000)) {
    return res.status(400).json({ error: 'Title (max 120) and content (max 5000) are required' });
  }
  next();
}

// Loads the post and allows only its author to change it
const ownPost = wrap(async (req, res, next) => {
  const post = mongoose.isValidObjectId(req.params.id) && await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (String(post.author) !== req.user.id) {
    return res.status(403).json({ error: 'You can only change your own posts' });
  }
  req.post = post;
  next();
});

app.get('/api/posts', wrap(async (req, res) => {
  res.json(await withAuthor(Post.find().sort({ createdAt: -1 })));
}));

app.get('/api/posts/:id', wrap(async (req, res) => {
  const post = mongoose.isValidObjectId(req.params.id) && await withAuthor(Post.findById(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
}));

app.get('/api/users/:id/posts', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found' });
  res.json(await withAuthor(Post.find({ author: req.params.id }).sort({ createdAt: -1 })));
}));

app.post('/api/posts', requireAuth, validPost, wrap(async (req, res) => {
  const { title, content } = req.body;
  res.status(201).json(await Post.create({ title, content, author: req.user.id }));
}));

app.put('/api/posts/:id', requireAuth, validPost, ownPost, wrap(async (req, res) => {
  req.post.set({ title: req.body.title, content: req.body.content });
  res.json(await req.post.save());
}));

app.delete('/api/posts/:id', requireAuth, ownPost, wrap(async (req, res) => {
  await req.post.deleteOne();
  res.json({ message: 'Post deleted' });
}));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? 'Bad request' : 'Server error' });
});

if (require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Blog app on http://localhost:${port}`));
}
module.exports = app;
