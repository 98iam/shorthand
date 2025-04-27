UI Layout & Components
1. Sidebar (Toggleable)
History Button: List past sessions (date, accuracy %, WPM).

Export Button: Save results as PDF/Excel.

Settings: Adjust default speed, font size, etc.

2. Main Page (3-Step Workflow)
Step 1: Dictation Setup
Text Input Area: Paste/type your custom text.

Speed Control: Slider (50-300 WPM).

Player Controls:

Play/Pause/Resume

Next (proceeds to typing section)

Visual Feedback During Playback:

Real-time highlighting of spoken words (e.g., yellow background).

Step 2: Typing Section
Blank Textarea: No dictation text visible (pure focus on typing).

Timer: Shows elapsed time (optional).

"Finish & Analyze" Button: Locks input and proceeds to results.

Step 3: Results Page
A. Side-by-Side Comparison
Original Text (Left):

Correct words: Green

Grammar errors: Orange (e.g., missing articles)

Your Typing (Right):

Mistakes: Red underline

Shorthand detected: Blue highlight

B. Performance Metrics
Accuracy: Score (e.g., 92%) + breakdown (words correct/incorrect).

Speed: WPM calculation.

Common Mistakes:

"Omitted 'the' 5 times"

"3 spelling errors (e.g., 'recieve' → 'receive')"

C. Visualizations
Line Graph (Chart.js): Accuracy trend over sessions.

Word Cloud: Most frequent errors.

Bar Chart: Error types (omissions, spelling, grammar).

D. Action Buttons
"Practice Again" (repeats same text)

"New Dictation" (returns to Step 1)

Libraries to Use (From Your List)
Frontend (HTML/JS)
Tailwind CSS: Styling + toggleable sidebar.

Chart.js: All graphs.

DiffDOM: Side-by-side text diffing.

Howler.js: Smooth audio playback control (if gTTS has delays).

Backend (Flask/Python)
gTTS/pyttsx3: TTS with speed adjustment.

difflib + fuzzywuzzy: Text comparison.

textstat/language-tool-python: Grammar analysis.

sqlite3 + pandas: Store/analyze history.

Enhanced Data for Results Page
Time Analysis:

"You hesitated at complex words ('jurisdiction' took 4 seconds)."

Shorthand Efficiency:

"Your shorthand shortcuts saved 20% typing time."

Progress Sparklines:

Mini-graphs showing weekly improvement.

Difficulty Score:

"This text was Grade 8 (advanced). Your accuracy drops 15% on Grade 8+."

