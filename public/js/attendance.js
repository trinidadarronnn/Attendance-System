// public/js/attendance.js

const idInput = document.getElementById('idInput');
const timeInBtn = document.getElementById('timeInBtn');
const timeOutBtn = document.getElementById('timeOutBtn');
const messageBox = document.getElementById('message');

// Big live clock
function updateBigClock() {
  const now = new Date();
  document.getElementById('bigClock').textContent = now.toLocaleTimeString('en-PH');
  document.getElementById('bigDate').textContent = now.toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
updateBigClock();
setInterval(updateBigClock, 1000);

// Show a green (success) or red (error) message
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = `message show ${type}`;
}

// Send Time In or Time Out to the server
async function sendAttendance(action) {
  const id = idInput.value.trim();

  if (!id) {
    showMessage('Please enter your ID Number.', 'error');
    idInput.focus();
    return;
  }

  // Disable buttons while waiting so it can't be clicked twice
  timeInBtn.disabled = true;
  timeOutBtn.disabled = true;

  try {
    const response = await fetch(`/api/attendance/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_employee_id: id }),
    });

    const data = await response.json();

    