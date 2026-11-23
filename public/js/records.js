// public/js/records.js

const searchInput = document.getElementById('searchInput');
const dateFilter = document.getElementById('dateFilter');
const recordsBody = document.getElementById('recordsBody');
const countText = document.getElementById('countText');

// Get today's date as YYYY-MM-DD (local time)
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

async function loadRecords() {
  try {
    const search = encodeURIComponent(searchInput.value.trim());
    const date = encodeURIComponent(dateFilter.value);

    const response = await fetch(`/api/attendance?search=${search}&date=${date}`);
    if (!response.ok) throw new Error('Request failed');
    const records = await response.json();

    countText.textContent = `${records.length} record(s) found`;

    if (records.length === 0) {
      recordsBody.innerHTML =
        '<tr><td colspan="6" class="empty-row">No attendance records found.</td></tr>';
      return;
    }

    recordsBody.innerHTML = records
      .map(
        (r) => `
        <tr>
          <td>${escapeHtml(r.student_employee_id)}</td>
          <td>${escapeHtml(r.full_name)}</td>
          <td>${formatDate(r.attendance_date)}</td>
          <td>${formatTime(r.time_in)}</td>
          <td>${formatTime(r.time_out)}</td>
          <td>${statusBadge(r.status)}</td>
        </tr>`
      )
      .join('');
  } catch (error) {
    recordsBody.innerHTML =
      '<tr><td colspan="6" class="empty-row">Could not load data. Is the server running?</td></tr>';
  }
}

// Search (waits a moment after typing stops)
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadRecords, 300);
});

// Date filter
dateFilter.addEventListener('change', loadRecords);

// "Today" button
document.getElementById('todayBtn').addEventListener('click', () => {
  dateFilter.value = todayString();
  loadRecords();
});

// "Show All" button
document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = '';
  dateFilter.value = '';
  loadRecords();
});

loadRecords();