const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const db = new sqlite3.Database('data.db');

app.use(express.json());
app.use(express.static('public'));

// initialize database table
const initSql = `CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    researcher TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`;
db.run(initSql);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
