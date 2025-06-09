const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const SECRET = process.env.JWT_SECRET || 'devsecret';

const app = express();
const db = new sqlite3.Database('data.db');

app.use(express.json());
app.use(express.static('public'));

// initialize database tables
const initEntries = `CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    researcher TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
db.run(initEntries);

const initForms = `CREATE TABLE IF NOT EXISTS forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    fields TEXT NOT NULL
)`;
db.run(initForms);

const initFormEntries = `CREATE TABLE IF NOT EXISTS form_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    form_id INTEGER NOT NULL,
    researcher TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(form_id) REFERENCES forms(id)
)`;
db.run(initFormEntries);

const initUsers = `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
)`;
db.run(initUsers);

function authenticate(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Missing token' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const hash = await bcrypt.hash(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  stmt.run(username, hash, function(err) {
    if (err) {
      return res.status(500).json({ error: 'User exists' });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err || !row) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, row.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: row.id, username: row.username }, SECRET);
    res.json({ token });
  });
});

app.get('/api/data', authenticate, (req, res) => {
  db.all('SELECT * FROM entries ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/data', authenticate, (req, res) => {
  const { researcher, data } = req.body;
  if (!researcher || !data) {
    return res.status(400).json({ error: 'researcher and data are required' });
  }
  const stmt = db.prepare('INSERT INTO entries (researcher, data) VALUES (?, ?)');
  stmt.run(researcher, data, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

// ----- Form APIs -----
app.get('/api/forms', authenticate, (req, res) => {
  db.all('SELECT * FROM forms', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const forms = rows.map(r => ({ id: r.id, name: r.name, fields: JSON.parse(r.fields) }));
    res.json(forms);
  });
});

app.post('/api/forms', authenticate, (req, res) => {
  const { name, fields } = req.body;
  if (!name || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'name and fields are required' });
  }
  const stmt = db.prepare('INSERT INTO forms (name, fields) VALUES (?, ?)');
  stmt.run(name, JSON.stringify(fields), function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

app.get('/api/forms/:id/entries', authenticate, (req, res) => {
  const formId = req.params.id;
  db.all('SELECT * FROM form_entries WHERE form_id = ? ORDER BY timestamp DESC', [formId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/forms/:id/entries', authenticate, (req, res) => {
  const formId = req.params.id;
  const { researcher, data } = req.body;
  if (!researcher || typeof data !== 'object') {
    return res.status(400).json({ error: 'researcher and data object are required' });
  }
  const stmt = db.prepare('INSERT INTO form_entries (form_id, researcher, data) VALUES (?, ?, ?)');
  stmt.run(formId, researcher, JSON.stringify(data), function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
  stmt.finalize();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
