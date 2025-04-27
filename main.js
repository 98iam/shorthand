// main.js - Dictation App Logic with Indian Accent

// Sidebar toggle logic
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const toggleSidebar = document.getElementById('toggleSidebar');
if(toggleSidebar) {
  toggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
  });
}
if(sidebarOverlay) {
  sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
  });
}

// Elements
const dictationInput = document.getElementById('dictationInput');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const stopBtn = document.getElementById('stopBtn');
const nextBtn = document.getElementById('nextBtn');
const dictationDisplay = document.getElementById('dictationDisplay');
const speedSlider = document.getElementById('speedSlider');
const wpmValue = document.getElementById('wpmValue');
const typingSection = document.getElementById('typingSection');
const typingInput = document.getElementById('typingInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultSection = document.getElementById('resultSection');
const originalText = document.getElementById('originalText');
const typedText = document.getElementById('typedText');
const analysisStats = document.getElementById('analysisStats');
const performanceGraph = document.getElementById('performanceGraph');

// WPM control
speedSlider.addEventListener('input', () => {
  wpmValue.textContent = speedSlider.value;
});
// WPM preset buttons
const wpmBtns = document.querySelectorAll('.wpm-btn');
wpmBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.getAttribute('data-wpm');
    speedSlider.value = val;
    wpmValue.textContent = val;
    speedSlider.dispatchEvent(new Event('input'));
  });
});

// Speech Synthesis with Indian Accent ONLY, smooth highlighting
let utterance, words = [], isPaused = false, highlightTimer = null, currentBoundary = 0;

function speakText(text, wpm) {
  if (!window.speechSynthesis) {
    alert('Speech Synthesis not supported!');
    return;
  }
  stopSpeech();
  words = text.split(/\s+/);
  currentBoundary = 0;
  utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = wpm / 150;
  // Only allow Indian accent
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang === 'en-IN');
  if (!indianVoice) {
    alert('No Indian English voice found on your system. Please install or enable an en-IN voice in your browser/system settings.');
    return;
  }
  utterance.voice = indianVoice;

  utterance.onboundary = function(event) {
    if (event.name === 'word') {
      highlightWordByCharIndex(event.charIndex);
    }
  };
  utterance.onend = () => {
    highlightWord(-1);
  };
  window.speechSynthesis.speak(utterance);
}

function highlightWordByCharIndex(charIdx) {
  // Find which word this charIdx is in
  let text = dictationInput.value;
  let wordBoundaries = [];
  let regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    wordBoundaries.push([match.index, match.index + match[0].length]);
  }
  let wordIdx = wordBoundaries.findIndex(([start, end]) => charIdx >= start && charIdx < end);
  highlightWord(wordIdx);
}

function highlightWord(idx) {
  if (idx === -1) {
    dictationDisplay.innerHTML = '';
    return;
  }
  let html = words.map((w, i) => i === idx ? `<span class='bg-yellow-300'>${w}</span>` : w).join(' ');
  dictationDisplay.innerHTML = html;
}

function pauseSpeech() {
  isPaused = true;
  window.speechSynthesis.pause();
}
function resumeSpeech() {
  isPaused = false;
  window.speechSynthesis.resume();
}
function stopSpeech() {
  window.speechSynthesis.cancel();
  isPaused = false;
  highlightWord(-1);
}

playBtn.addEventListener('click', () => {
  speakText(dictationInput.value, parseInt(speedSlider.value));
});
pauseBtn.addEventListener('click', pauseSpeech);
resumeBtn.addEventListener('click', resumeSpeech);
stopBtn.addEventListener('click', stopSpeech);

nextBtn.addEventListener('click', () => {
  stopSpeech();
  dictationSection.style.display = 'none';
  typingSection.classList.remove('hidden');
  typingInput.value = '';
  typingInput.focus();
});

analyzeBtn.addEventListener('click', async () => {
  const original = dictationInput.value;
  const typed = typingInput.value;
  typingSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
  originalText.textContent = original;
  typedText.innerHTML = colorDiff(original, typed);
  // Local stats
  const stats = getStats(original, typed);
  const localStatsHTML = `
    <span class='text-green-700 font-semibold'>Local Analysis:</span><br>
    Correct: <span class='text-green-600 font-bold'>${stats.correct}</span> |
    Mistakes: <span class='text-red-600 font-bold'>${stats.mistakes}</span> |
    Spelling: <span class='text-orange-600 font-bold'>${stats.spelling}</span> |
    Accuracy: <span class='font-bold'>${stats.accuracy}%</span>
  `;
  analysisStats.innerHTML = localStatsHTML + `<br><span class='text-blue-600 font-semibold'>Analyzing with Gemini 1.5 Pro...</span>`;
  drawGraph(stats.history);
  let geminiResult = '';
  let spellingMistakes = [];
  try {
    geminiResult = await analyzeWithGemini(original, typed);
    analysisStats.innerHTML = localStatsHTML + `<br><span class='text-green-700 font-semibold'>Gemini Feedback:</span><br><div class='bg-orange-50 border-l-4 border-orange-400 p-2 rounded my-2 text-gray-800 dark:bg-slate-800 dark:border-orange-500 dark:text-gray-100'>${geminiResult}</div>`;
    // Ask Gemini for spelling mistakes as JSON
    try {
      spellingMistakes = await getGeminiSpellingMistakes(original, typed);
      if (Array.isArray(spellingMistakes)) {
        let prev = [];
        try { prev = JSON.parse(localStorage.getItem('spellingMistakes')||'[]'); } catch {}
        spellingMistakes.forEach(m => {
          if (m.actual && m.error && !prev.some(p => p.actual === m.actual && p.error === m.error)) {
            prev.push(m);
          }
        });
        localStorage.setItem('spellingMistakes', JSON.stringify(prev));
      }
    } catch (err) {
      // Ignore AI spelling parse errors
    }
  } catch (err) {
    analysisStats.innerHTML = localStatsHTML + `<br><span class='text-red-600'>Gemini API Error: ${err.message}</span>`;
  }
  // Save full result to history
  try {
    let history = [];
    try { history = JSON.parse(localStorage.getItem('dictationHistory')||'[]'); } catch{}
    history.push({
      date: new Date().toLocaleString(),
      originalText: original,
      typedText: typed,
      localStats: localStatsHTML,
      geminiFeedback: geminiResult,
      graphHistory: stats.history,
      spellingMistakes: spellingMistakes
    });
    localStorage.setItem('dictationHistory', JSON.stringify(history));
  } catch {}
});

async function getGeminiSpellingMistakes(original, typed) {
  const apiKey = 'AIzaSyD3ZOFgX8cn2FDS_D3HYK8xq7jFC_1-4jQ';
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey;
  const prompt = `Given the following two texts, list all spelling mistakes the user made. For each, give the actual word and the user's incorrect spelling. Return ONLY a JSON array of objects in the format: [{\"actual\":\"...\",\"error\":\"...\"}].\n\nOriginal:\n${original}\n\nUser Typed:\n${typed}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  // Try to extract JSON from the response
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let json = [];
  try {
    json = JSON.parse(text.match(/\[.*\]/s)[0]);
  } catch {}
  return json;
}


// Dark mode toggle logic
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
  // Use saved preference, else system preference
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
});

async function analyzeWithGemini(original, typed) {
  const apiKey = 'AIzaSyD3ZOFgX8cn2FDS_D3HYK8xq7jFC_1-4jQ';
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + apiKey;
  const prompt = `Compare the following two texts. The first is the original dictation, the second is what the user typed. List all mistakes, spelling errors, grammar issues, and missing or extra words. Give detailed feedback in a clear, easy-to-read way.\n\nOriginal:\n${original}\n\nUser Typed:\n${typed}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ]
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  const geminiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No feedback returned.';
  return geminiText.replace(/\n/g, '<br>');
}
// Simple diff for color coding
// Levenshtein distance for spelling similarity
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = [];
  for (let i = 0; i <= m; i++) { dp[i] = [i]; }
  for (let j = 1; j <= n; j++) { dp[0][j] = j; }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i-1] === b[j-1]) {
        dp[i][j] = dp[i-1][j-1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
      }
    }
  }
  return dp[m][n];
}

function colorDiff(orig, typed) {
  const o = orig.split(' ');
  const t = typed.split(' ');
  let html = '';
  let minLen = Math.min(o.length, t.length);
  let spellingMistakes = [];
  for(let i=0; i<minLen; i++) {
    if(o[i] === t[i]) {
      html += `<span class='text-green-700'>${t[i]}</span> `;
    } else if(o[i].toLowerCase() === t[i].toLowerCase() || (levenshtein(o[i].toLowerCase(), t[i].toLowerCase()) <= 2 && t[i])) {
      html += `<span class='text-orange-500'>${t[i]}</span> `;
      // Save spelling mistake (case-insensitive, or small edit distance)
      spellingMistakes.push({actual: o[i], error: t[i]});
    } else {
      html += `<span class='text-red-600'>${t[i]}</span> `;
    }
  }
  for(let i=minLen; i<t.length; i++) {
    html += `<span class='text-red-600'>${t[i]}</span> `;
  }
  // Save spelling mistakes to localStorage, avoiding duplicates
  if (spellingMistakes.length) {
    let prev = [];
    try { prev = JSON.parse(localStorage.getItem('spellingMistakes')||'[]'); } catch {}
    spellingMistakes.forEach(m => {
      if (!prev.some(p => p.actual === m.actual && p.error === m.error)) {
        prev.push(m);
      }
    });
    localStorage.setItem('spellingMistakes', JSON.stringify(prev));
  }
  return html;
}
function getStats(orig, typed) {
  const o = orig.split(' ');
  const t = typed.split(' ');
  let correct=0, mistakes=0, spelling=0, history=[];
  let minLen = Math.min(o.length, t.length);
  for(let i=0; i<minLen; i++) {
    if(o[i] === t[i]) { correct++; history.push(1); }
    else if(o[i].toLowerCase() === t[i].toLowerCase()) { spelling++; history.push(0.5); }
    else { mistakes++; history.push(0); }
  }
  mistakes += Math.abs(o.length - t.length);
  let accuracy = Math.round((correct / o.length) * 100);
  return {correct, mistakes, spelling, accuracy, history};
}
// Simple graph (bar)
function drawGraph(history) {
  const canvas = performanceGraph;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const w = canvas.width/history.length;
  for(let i=0; i<history.length; i++) {
    ctx.fillStyle = history[i] === 1 ? '#16a34a' : history[i] === 0.5 ? '#f59e42' : '#dc2626';
    ctx.fillRect(i*w, canvas.height - history[i]*canvas.height, w-2, history[i]*canvas.height);
  }
}
// History button (placeholder)
document.getElementById('historyBtn').addEventListener('click', () => {
  alert('History feature coming soon!');
});
