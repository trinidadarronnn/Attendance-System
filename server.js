// server.js
// Main server file: Express + SQLite API

const express = require('express');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = 3000;

// Time (24-hour) after which a Time In counts as "Late"
const LATE_AFTER = '08:00:00';

// ---------- Middleware ----------
app.use(express.json()); // lets us read JSON sent by fetch()
app.use(express.static(path.join(__dirname, 'public'))); // serves /public

// ---------- Helper functions ----------
// Local date as YYYY-MM-DD
function getToday() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Local time as HH:MM:SS (24-hour)
function getNow() {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Trim a value safely
function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// ======================================================
//  STUDENTS / EMPLOYEES
// ======================================================

// Get all (with optional search by name or ID)
app.get('/api/students', (req, res) => {
  try {
    const search = `%${clean(req.query.search)}%`;
    const rows = db
      .prepare(
        `SELECT * FROM students
         WHERE full_name LIKE ? OR student_employee_id LIKE ?
         ORDER BY full_name ASC`
      )
      .all(search, search);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load records.' });
  }
});

// Add a new person
app.post('/api/students', (req, res) => {
  const id = clean(req.body.student_employee_id);
  const name = clean(req.body.full_name);
  const dept = clean(req.body.department);
  const level = clean(req.body.year_level_or_position);

  if (!id || !name || !dept || !level) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    db.prepare(
      `INSERT INTO students
       (student_employee_id, full_name, department, year_level_or_position)
       VALUES (?, ?, ?, ?)`
    ).run(id, name, dept, level);
    res.status(201).json({ message: 'Record added successfully.' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'That ID Number already exists.' });
    }
    res.status(500).json({ error: 'Failed to add record.' });
  }
});

// Edit a person (by database row id)
app.put('/api/students/:id', (req, res) => {
  const id = clean(req.body.student_employee_id);
  const name = clean(req.body.full_name);
  const dept = clean(req.body.department);
  const level = clean(req.body.year_level_or_position);

  if (!id || !name || !dept || !level) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const result = db
      .prepare(
        `UPDATE students
         SET student_employee_id = ?, full_name = ?,
             department = ?, year_level_or_position = ?
         WHERE id = ?`
      )
      .run(id, name, dept, level, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    res.json({ message: 'Record updated successfully.' });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'That ID Number already exists.' });
    }
    res.status(500).json({ error: 'Failed to update record.' });
  }
});

// Delete a person
app.delete('/api/students/:id', (req, res) => {
  try {
    const result = db
      .prepare('DELETE FROM students WHERE id = ?')
      .run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Record not found.' });
    }
    res.json({ message: 'Record deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete record.' });
  }
});

// ======================================================
//  ATTENDANCE: TIME IN / TIME OUT
// ======================================================

// Time In
app.post('/api/attendance/time-in', (req, res) => {
  const id = clean(req.body.student_employee_id);
  if (!id) {
    return res.status(400).json({ error: 'Please enter your ID Number.' });
  }

  try {
    const person = db
      .prepare('SELECT * FROM students WHERE student_employee_id = ?')
      .get(id);
    if (!person) {
      return res.status(404).json({ error: 'ID Number not found. Please contact the administrator.' });
    }

    const today = getToday();
    const existing = db
      .prepare('SELECT * FROM attendance WHERE student_employee_id = ? AND attendance_date = ?')
      .get(id, today);
    if (existing) {
      return res.status(409).json({ error: `${person.full_name}, you already timed in today at ${existing.time_in}.` });
    }

    const now = getNow();
    const status = now > LATE_AFTER ? 'Late' : 'Present';

    db.prepare(
      `INSERT INTO attendance (student_employee_id, attendance_date, time_in, status)
       VALUES (?, ?, ?, ?)`
    ).run(id, today, now, status);

    res.status(201).json({
      message: `Time In recorded for ${person.full_name} at ${now} (${status}).`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record Time In.' });
  }
});

// Time Out
app.post('/api/attendance/time-out', (req, res) => {
  const id = clean(req.body.student_employee_id);
  if (!id) {
    return res.status(400).json({ error: 'Please enter your ID Number.' });
  }

  try {
    const person = db
      .prepare('SELECT * FROM students WHERE student_employee_id = ?')
      .get(id);
    if (!person) {
      return res.status(404).json({ error: 'ID Number not found. Please contact the administrator.' });
    }

    const today = getToday();
    const record = db
      .prepare('SELECT * FROM attendance WHERE student_employee_id = ? AND attendance_date = ?')
      .get(id, today);

    if (!record) {
      return res.status(400).json({ error: `${person.full_name}, you have not timed in today.` });
    }
    if (record.time_out) {
      return res.status(409).json({ error: `${person.full_name}, you already timed out today at ${record.time_out}.` });
    }

    const now = getNow();
    db.prepare(
      `UPDATE attendance SET time_out = ?, status = 'Completed' WHERE id = ?`
    ).run(now, record.id);

    res.json({ message: `Time Out recorded for ${person.full_name} at ${now}. Goodbye!` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record Time Out.' });
  }
});

// ======================================================
//  ATTENDANCE RECORDS (with search + date filter)
// ======================================================
app.get('/api/attendance', (req, res) => {
  try {
    const search = `%${clean(req.query.search)}%`;
    const date = clean(req.query.date);

    let sql = `
      SELECT a.id, a.student_employee_id, s.full_name,
             a.attendance_date, a.time_in, a.time_out, a.status
      FROM attendance a
      JOIN students s ON s.student_employee_id = a.student_employee_id
      WHERE (s.full_name LIKE ? OR a.student_employee_id LIKE ?)
    `;
    const params = [search, search];

    if (date) {
      sql += ' AND a.attendance_date = ?';
      params.push(date);
    }
    sql += ' ORDER BY a.attendance_date DESC, a.time_in DESC';

    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load attendance records.' });
  }
});

// ======================================================
//  DASHBOARD
// ======================================================
app.get('/api/dashboard', (req, res) => {
  try {
    const today = getToday();

    const total = db.prepare('SELECT COUNT(*) AS n FROM students').get().n;
    const todayCount = db
      .prepare('SELECT COUNT(*) AS n FROM attendance WHERE attendance_date = ?')
      .get(today).n;
    const present = db
      .prepare('SELECT COUNT(*) AS n FROM attendance WHERE attendance_date = ? AND time_out IS NULL')
      .get(today).n;
    const absent = total - todayCount;

    const recent = db
      .prepare(
        `SELECT a.student_employee_id, s.full_name, a.attendance_date,
                a.time_in, a.time_out, a.status
         FROM attendance a
         JOIN students s ON s.student_employee_id = a.student_employee_id
         ORDER BY a.id DESC LIMIT 8`
      )
      .all();

    res.json({
      totalPeople: total,
      todayAttendance: todayCount,
      currentlyPresent: present,
      absent: absent,
      recent: recent,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
});

// ---------- Start the server ----------
app.listen(PORT, () => {
  console.log(`Attendance System running at http://localhost:${PORT}`);
});