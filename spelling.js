// spelling.js - Spelling Mistakes Page Logic
function setDarkMode(enabled) {
  const html = document.documentElement;
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');
  if (enabled) {
    html.classList.add('dark');
    if (sunIcon && moonIcon) {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
    localStorage.setItem('darkMode', '1');
  } else {
    html.classList.remove('dark');
    if (sunIcon && moonIcon) {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
    localStorage.setItem('darkMode', '0');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const darkModeToggle = document.getElementById('darkModeToggle');
  let darkMode = localStorage.getItem('darkMode');
  if (darkMode === null) {
    darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? '1' : '0';
  }
  setDarkMode(darkMode === '1');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      setDarkMode(!isDark);
    });
  }

  // Load spelling mistakes from localStorage
  const spellingTable = document.getElementById('spellingTable').querySelector('tbody');
  const noMistakes = document.getElementById('noMistakes');
  let mistakes = [];
  try {
    mistakes = JSON.parse(localStorage.getItem('spellingMistakes') || '[]');
  } catch {}
  if (!mistakes.length) {
    noMistakes.classList.remove('hidden');
  } else {
    noMistakes.classList.add('hidden');
    mistakes.forEach((m, i) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class='py-2 px-3 text-center'>${i+1}</td>
        <td class='py-2 px-3'>${m.actual}</td>
        <td class='py-2 px-3 text-red-600 dark:text-red-400'>${m.error}</td>
        <td class='py-2 px-3 text-center'>
          <button class='delete-btn bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition' data-index='${i}' title='Delete'>✕</button>
        </td>`;
      spellingTable.appendChild(row);
    });
    // Add delete listeners
    spellingTable.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.getAttribute('data-index'));
        mistakes.splice(idx, 1);
        localStorage.setItem('spellingMistakes', JSON.stringify(mistakes));
        location.reload();
      });
    });
  }
});
