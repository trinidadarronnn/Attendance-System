// public/js/dashboard.js

async function loadDashboard() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();

    // Fill the four cards
    document.getElementById('totalPeople').textContent = data.totalPeople;
    document.getElementById('todayAttendance').textContent = data.todayAttendance;
    document.getElementById('currentlyPresent').textContent = data.currentlyPresent;
    document.getElementById('absent').textContent = data.absent;

    // Fill the recent activity table
    const body = document.getElementById('recentBody');

    if (data.recent.length === 0) {
      body.innerHTML = '<tr><td colspan="6" class="empty-row">No attendance records yet.</td></tr>';
      return;
    }

    body.innerHTML = data.recent
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
    document.getElementById('recentBody').innerHTML =
      '<tr><td colspan="6" class="empty-row">Could not load data. Is the server running?</td></tr>';
  }
}

loadDashboard();
setInterval(loadDashboard, 30000); // refresh every 30 seconds