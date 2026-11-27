const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const sign = (user) =>
  jwt.sign({ id: user.id, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
      !/^\S+@\S+\.\S+$/.test(email) || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Name, valid email and password (6+ characters) are required' });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: sign(user), user: { id: user.id, name: user.name } });
});

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Please log in first' });
  }
}

module.exports = { router, requireAuth };
