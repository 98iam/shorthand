// history.js - Dictation History Page Logic
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

  // Load history
  let history = [];
  try { history = JSON.parse(localStorage.getItem('dictationHistory')||'[]'); } catch{}
  const historyList = document.getElementById('historyList');
  const historyDetail = document.getElementById('historyDetail');
  if (!history.length) {
    historyList.innerHTML = '<div class="text-gray-500 dark:text-gray-300">No dictation history found.</div>';
    return;
  }
  // Show most recent first
  history = history.slice().reverse();
  history.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'bg-white dark:bg-slate-800 rounded-lg shadow border border-orange-100 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4';
    div.innerHTML = `
      <div>
        <div class='font-semibold text-indigo-800 dark:text-orange-200'>${item.date || 'Unknown date'}</div>
        <div class='text-gray-600 dark:text-gray-300 text-sm mt-1 truncate max-w-xs'>${item.originalText?.slice(0, 80) || ''}</div>
      </div>
      <button class='view-btn bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-3 py-1 rounded hover:bg-orange-200 dark:hover:bg-orange-700 transition' data-index='${history.length-1-idx}'>View</button>
    `;
    historyList.appendChild(div);
  });
  historyList.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const idx = parseInt(this.getAttribute('data-index'));
      const item = history[history.length-1-idx];
      historyDetail.classList.remove('hidden');
      historyDetail.innerHTML = `
        <div class='bg-white dark:bg-slate-800 rounded-lg shadow border border-orange-100 dark:border-slate-700 p-6'>
          <div class='mb-2 text-sm text-gray-500 dark:text-gray-400'>${item.date}</div>
          <div class='flex flex-col md:flex-row gap-4'>
            <div class='w-full md:w-1/2'>
              <h3 class='font-semibold mb-1'>Original Dictation</h3>
              <div class='bg-gray-200 dark:bg-slate-900 p-2 rounded min-h-[60px] mb-2'>${item.originalText || ''}</div>
            </div>
            <div class='w-full md:w-1/2'>
              <h3 class='font-semibold mb-1'>Your Typing</h3>
              <div class='bg-gray-200 dark:bg-slate-900 p-2 rounded min-h-[60px] mb-2'>${item.typedText || ''}</div>
            </div>
          </div>
          <div class='mt-4'>
  <div class='flex flex-col md:flex-row gap-6'>
    <div class='flex-1 bg-black/40 rounded-lg p-3 border border-gray-700'>
      <h4 class='font-semibold'>System Analysis</h4>
      <div class='mb-2'>${item.localStats || ''}</div>
      <span class='block mb-2 text-blue-400 font-bold'>Marks: ${item.localMarks !== undefined ? item.localMarks : 'N/A'}/100</span>
    </div>
    <div class='flex-1 bg-black/40 rounded-lg p-3 border border-gray-700'>
      <h4 class='font-semibold'>AI Analysis</h4>
      <span class='block mb-2 text-blue-400 font-bold'>Marks: ${item.aiMarks !== undefined ? item.aiMarks : 'N/A'}/100</span>
      <span class='block mb-2 text-red-400 font-bold'>Total Mistakes: ${item.aiMistakes !== undefined ? item.aiMistakes : 'N/A'}</span>
      <div class='mb-2'>${item.geminiFeedback || ''}</div>
    </div>
  </div>
  <canvas id='historyGraph' class='w-full h-32 bg-white dark:bg-slate-900 rounded shadow mb-4 mt-4'></canvas>
  <h4 class='font-semibold mt-2'>Spelling Mistakes</h4>
  <ul class='list-disc pl-6'>
    ${(item.spellingMistakes||[]).map(m => `<li><span class='text-orange-700 dark:text-orange-300 font-semibold'>${m.actual}</span> → <span class='text-red-600 dark:text-red-300'>${m.error}</span></li>`).join('') || '<li class="text-gray-500 dark:text-gray-300">None</li>'}
  </ul>
</div>
        </div>
      `;
      // Draw graph
      if (item.graphHistory && Array.isArray(item.graphHistory)) {
        const canvas = document.getElementById('historyGraph');
        if (canvas && canvas.getContext) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          const w = canvas.width/item.graphHistory.length;
          for(let i=0; i<item.graphHistory.length; i++) {
            ctx.fillStyle = item.graphHistory[i] === 1 ? '#16a34a' : item.graphHistory[i] === 0.5 ? '#f59e42' : '#dc2626';
            ctx.fillRect(i*w, canvas.height - item.graphHistory[i]*canvas.height, w-2, item.graphHistory[i]*canvas.height);
          }
        }
      }
    });
  });
});
