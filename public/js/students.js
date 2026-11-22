// public/js/students.js

const studentsBody = document.getElementById('studentsBody');
const searchInput = document.getElementById('searchInput');
const pageMessage = document.getElementById('pageMessage');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const fId = document.getElementById('fId');
const fName = document.getElementById('fName');
const fDept = document.getElementById('fDept');
const fLevel = document.getElementById('fLevel');
const saveBtn = document.getElementById('saveBtn');

let students = [];     // the list currently shown
let editingId = null;  // null = adding a new person, number = editing

// ---------- Messages ----------
function showPageMessage(text, type) {
  pageMessage.textContent = text;
  pageMessage.className = `message show ${type}`;
  setTimeout(() => (pageMessage.className = 'message'), 4000);
}

function showModalMessage(text, type) {
  modalMessage.textContent = text;
  modalMessage.className = `message show ${type}`;
}

// ---------- Load and show the table ----------
async function loadStudents() {
  try {
    const search = encodeURIComponent(searchInput.value.trim());
    const response = await fetch(`/api/students?search=${search}`);
    if (!response.ok) throw new Error('Request failed');
    students = await response.json();
    renderTable();
  } catch (error) {
    studentsBody.innerHTML =
      '<tr><td colspan="5" class="empty-row">Could not load data. Is the server running?</td></tr>';
  }
}

function renderTable() {
  if (students.length === 0) {
    studentsBody.innerHTML =
      '<tr><td colspan="5" class="empty-row">No records found. Click "+ Add New" to register someone.</td></tr>';
    return;
  }

  studentsBody.innerHTML = students
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.student_employee_id)}</td>
        <td>${escapeHtml(s.full_name)}</td>
        <td>${escapeHtml(s.department)}</td>
        <td>${escapeHtml(s.year_level_or_position)}</td>
        <td>
          <div class="actions">
            <button class="btn btn-warning btn-sm" onclick="openEdit(${s.id})">Edit</button>
            <button class="btn btn-danger btn-sm" onclick="deleteStudent(${s.id})">Delete</button>
          </div>
        </td>
      </tr>`
    )
    .join('');
}

// ---------- Search (waits a moment after typing stops) ----------
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadStudents, 300);
});

// ---------- Open / close the pop-up ----------
function openModal() {
  modalMessage.className = 'message';
  modalOverlay.classList.add('show');
  fId.focus();
}

function closeModal() {
  modalOverlay.classList.remove('show');
}

document.getElementById('addBtn').addEventListener('click', () => {
  editingId = null;
  modalTitle.textContent = 'Add New Student / Employee';
  fId.value = '';
  fName.value = '';
  fDept.value = '';
  fLevel.value = '';
  openModal();
});

function openEdit(id) {
  const person = students.find((s) => s.id === id);
  if (!person) return;

  editingId = id;
  modalTitle.textContent = 'Edit Student / Employee';
  fId.value = person.student_employee_id;
  fName.value = person.full_name;
  fDept.value = person.department;
  fLevel.value = person.year_level_or_position;
  openModal();
}

document.getElementById('cancelBtn').addEventListener('click', closeModal);

// Click outside the white box to close
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

// ---------- Save (add or edit) ----------
saveBtn.addEventListener('click', async () => {
  const body = {
    student_employee_id: fId.value.trim(),
    full_name: fName.value.trim(),
    department: fDept.value.trim(),
    year_level_or_position: fLevel.value.trim(),
  };

  if (!body.student_employee_id || !body.full_name || !body.department || !body.year_level_or_position) {
    showModalMessage('Please fill in all fields.', 'error');
    return;
  }

  const isEditing = editingId !== null;
  const url = isEditing ? `/api/students/${editingId}` : '/api/students';
  const method = isEditing ? 'PUT' : 'POST';

  saveBtn.disabled = true;

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();

    if (response.ok) {
      closeModal();
      showPageMessage(data.message, 'success');
      loadStudents();
    } else {
      showModalMessage(data.error, 'error');
    }
  } catch (error) {
    showModalMessage('Cannot connect to the server. Is it running?', 'error');
  }

  saveBtn.disabled = false;
});

// ---------- Delete ----------
async function deleteStudent(id) {
  const person = students.find((s) => s.id === id);
  if (!person) return;

  const sure = confirm(
    `Delete ${person.full_name}?\n\nTheir attendance history will also be deleted. This cannot be undone.`
  );
  if (!sure) return;

  try {
    const response = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (response.ok) {
      showPageMessage(data.message, 'success');
      loadStudents();
    } else {
      showPageMessage(data.error, 'error');
    }
  } catch (error) {
    showPageMessage('Cannot connect to the server. Is it running?', 'error');
  }
}

loadStudents();