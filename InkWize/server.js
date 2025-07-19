require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const https = require('https');

const app = express();
const PORT = 3100;

// In-memory user storage (for demo; use a DB in production)
const users = [];

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Session config (not strictly needed for JWT, but included for completeness)
app.use(session({
  secret: process.env.SESSION_SECRET || 'inkwize-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

const JWT_SECRET = process.env.JWT_SECRET || 'inkwize-jwt-secret';

// JWT auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: users.length + 1, name, email, password: hashedPassword, createdAt: new Date().toISOString() };
    users.push(newUser);
    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({ message: 'User registered', user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ message: 'Login successful', user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  // For JWT, logout is handled client-side (token removal)
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ user: userWithoutPassword });
});

// --- COMIC VINE PROXY ROUTES ---
function proxyRequest(url, res) {
  const urlObj = new URL(url.replace('http://', 'https://'));
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname + urlObj.search,
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InkWize/1.0)' }
  };
  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', (chunk) => { data += chunk; });
    response.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseError) {
        res.status(500).json({ error: 'Failed to parse Comic Vine API response', details: data });
      }
    });
  });
  request.on('error', (error) => {
    res.status(500).json({ error: 'Failed to fetch from Comic Vine API', details: error.message });
  });
  request.end();
}

app.get('/api/comics', (req, res) => {
  const apiKey = process.env.COMICVINE_API_KEY || 'fa935a137adcef098bfc6b13e8d20c529cedfe29';
  const limit = req.query.limit ? `&limit=${parseInt(req.query.limit)}` : '';
  // Attempt to filter for English comics using Comic Vine's filter param (if supported)
  const url = `http://comicvine.gamespot.com/api/issues/?api_key=${apiKey}&format=json${limit}&filter=language:en`;
  proxyRequest(url, {
    json: (data) => {
      // Filter for English comics if language field is present
      if (data && data.results) {
        data.results = data.results.filter(comic => !comic.language || comic.language === 'en');
      }
      res.json(data);
    },
    status: (...args) => res.status(...args),
    send: (...args) => res.send(...args)
  });
});

app.get('/api/search', (req, res) => {
  const apiKey = process.env.COMICVINE_API_KEY || 'fa935a137adcef098bfc6b13e8d20c529cedfe29';
  const query = encodeURIComponent(req.query.q || '');
  if (!query) return res.status(400).json({ error: 'Missing search query' });
  // Attempt to filter for English comics using Comic Vine's filter param (if supported)
  const url = `http://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&query=${query}&resources=issue&filter=language:en`;
  proxyRequest(url, {
    json: (data) => {
      if (data && data.results) {
        data.results = data.results.filter(comic => !comic.language || comic.language === 'en');
      }
      res.json(data);
    },
    status: (...args) => res.status(...args),
    send: (...args) => res.send(...args)
  });
});

app.get('/api/comic/:id', (req, res) => {
  const apiKey = process.env.COMICVINE_API_KEY || 'fa935a137adcef098bfc6b13e8d20c529cedfe29';
  const comicId = req.params.id;
  const url = `http://comicvine.gamespot.com/api/issue/4000-${comicId}/?api_key=${apiKey}&format=json`;
  proxyRequest(url, {
    json: (data) => {
      // Only return if language is English or not specified
      if (data && data.results && (data.results.language === 'en' || !data.results.language)) {
        res.json(data);
      } else {
        res.status(404).json({ error: 'Comic not found in English.' });
      }
    },
    status: (...args) => res.status(...args),
    send: (...args) => res.send(...args)
  });
});

// --- STATIC & HEALTH ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'InkWize.html'));
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 