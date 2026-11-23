// database/db.js
// Opens (or creates) the SQLite database and sets up the tables.

const path = require('path');
const Database = require('better-sqlite3');

// attendance.db will be created in the main project folder
const dbPath = path.join(__dirname, '..', 'attendance.db');
const db = new Database(dbPath);

// Turn on foreign keys (SQLite has them OFF by default)
db.pragma('foreign_keys = ON');

