const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
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

app.get('/api/data', (req, res) => {
  db.all('SELECT * FROM entries ORDER BY timestamp DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/data', (req, res) => {
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
app.get('/api/forms', (req, res) => {
  db.all('SELECT * FROM forms', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const forms = rows.map(r => ({ id: r.id, name: r.name, fields: JSON.parse(r.fields) }));
    res.json(forms);
  });
});

app.post('/api/forms', (req, res) => {
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

app.get('/api/forms/:id/entries', (req, res) => {
  const formId = req.params.id;
  db.all('SELECT * FROM form_entries WHERE form_id = ? ORDER BY timestamp DESC', [formId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post('/api/forms/:id/entries', (req, res) => {
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
