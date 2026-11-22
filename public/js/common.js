// public/js/common.js
// Shared code used by all pages.

// Show/hide the sidebar on small screens
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Live clock in the top bar
  const clock = document.getElementById('clock');
  if (clock) {
    const updateClock = () => {
      clock.textContent = new Date().toLocaleString('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
      });
    };
    updateClock();
    setInterval(updateClock, 1000);
  }
});

// Prevents text from being treated as HTML (safer)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// Converts "14:05:09" into "2:05 PM"
function formatTime(time) {
  if (!time) return '—';
  const [h, m] = time.split(':');
  const hour = Number(h);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${suffix}`;
}

// Converts "2026-11-22" into "Nov 22, 2026"
function formatDate(dateString) {
  if (!dateString) return '';
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Returns the HTML for a colored status badge
function statusBadge(status) {
  const cls = 'badge-' + String(status).toLowerCase();
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}