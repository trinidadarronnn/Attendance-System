// database/db.js
// Opens (or creates) the SQLite database and sets up the tables.

const path = require('path');
const Database = require('better-sqlite3');

// attendance.db will be created in the main project folder
const dbPath = path.join(__dirname, '..', 'attendance.db');
const db = new Database(dbPath);

// Turn on foreign keys (SQLite has them OFF by default)
db.pragma('foreign_keys = ON');

// Create the tables only if they don't exist yet
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_employee_id TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    department TEXT NOT NULL,
    year_level_or_position TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_employee_id TEXT NOT NULL,
    attendance_date TEXT NOT NULL,
    time_in TEXT NOT NULL,
    time_out TEXT,
    status TEXT NOT NULL DEFAULT 'Present'
      CHECK (status IN ('Present', 'Late', 'Completed')),
    FOREIGN KEY (student_employee_id)
      REFERENCES students (student_employee_id)
      ON UPDATE CASCADE
      ON DELETE CASCADE,
    UNIQUE (student_employee_id, attendance_date)
  );
`);

module.exports = db;