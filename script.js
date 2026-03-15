/**
 * Islandification – Notification Bar Customizer
 * script.js
 *
 * Handles:
 *  - Dynamic Island expand/collapse with different notification types
 *  - Full customizer logic (color, shape, size, animation, shadow, border, opacity)
 *  - Preset themes
 *  - localStorage persistence ("memorizing" settings across sessions)
 */

/* ============================================================
   Constants & State
   ============================================================ */
const STORAGE_KEY = 'islandification_settings';
const TIMER_DURATION = 30; // seconds for the demo timer
const GLASS_COLOR = 'rgba(255,255,255,0.12)';

let activeNotification = null;
let timerInterval = null;
let timerSeconds = TIMER_DURATION;
let dismissTimeout = null;

/* ============================================================
   Preset Definitions
   ============================================================ */
const PRESETS = {
  classic: {
    color: '#000000',
    textColor: '#ffffff',
    shape: 'pill',
    size: 1.0,
    blur: 0,
    anim: 'spring',
    shadow: 'none',
    opacity: 100,
    border: 'none',
    borderColor: '#ffffff',
  },
  midnight: {
    color: '#0f3460',
    textColor: '#00d4ff',
    shape: 'pill',
    size: 1.0,
    blur: 4,
    anim: 'smooth',
    shadow: 'glow',
    opacity: 95,
    border: 'thin',
    borderColor: '#00d4ff',
  },
  forest: {
    color: '#1b4332',
    textColor: '#d8f3dc',
    shape: 'rounded',
    size: 1.0,
    blur: 0,
    anim: 'smooth',
    shadow: 'subtle',
    opacity: 100,
    border: 'none',
    borderColor: '#52b788',
  },
  neon: {
    color: '#0a0a0a',
    textColor: '#39ff14',
    shape: 'pill',
    size: 1.1,
    blur: 0,
    anim: 'snappy',
    shadow: 'intense',
    opacity: 100,
    border: 'glow',
    borderColor: '#39ff14',
  },
  glass: {
    color: 'rgba(255,255,255,0.12)',
    textColor: '#ffffff',
    shape: 'pill',
    size: 1.0,
    blur: 18,
    anim: 'smooth',
    shadow: 'subtle',
    opacity: 85,
    border: 'medium',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  royal: {
    color: '#2c0954',
    textColor: '#e8c6ff',
    shape: 'rounded',
    size: 1.05,
    blur: 6,
    anim: 'elastic',
    shadow: 'glow',
    opacity: 100,
    border: 'thin',
    borderColor: '#9b59b6',
  },
};

/* ============================================================
   Settings Helpers
   ============================================================ */
function getSettings() {
  const s = {
    color: '#000000',
    textColor: '#ffffff',
    shape: 'pill',
    size: 1.0,
    blur: 0,
    anim: 'spring',
    shadow: 'none',
    opacity: 100,
    border: 'none',
    borderColor: '#ffffff',
  };
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return Object.assign(s, JSON.parse(saved));
  } catch (_) { /* ignore */ }
  return s;
}

function saveSettings() {
  const s = readControlValues();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    showSavedIndicator('✅ Settings saved!');
  } catch (_) {
    showSavedIndicator('⚠️ Could not save settings');
  }
}

function showSavedIndicator(msg) {
  const el = document.getElementById('savedIndicator');
  el.textContent = msg;
  setTimeout(() => { el.textContent = ''; }, 2500);
}

/* ============================================================
   Read all control values → settings object
   ============================================================ */
function readControlValues() {
  return {
    color:       document.querySelector('.swatch[data-color].active')?.dataset.color
                  || document.getElementById('customColor').value,
    textColor:   document.querySelector('.swatch[data-textcolor].active')?.dataset.textcolor
                  || document.getElementById('customTextColor').value,
    shape:       document.querySelector('input[name=shape]:checked')?.value || 'pill',
    size:        parseFloat(document.getElementById('sizeSlider').value),
    blur:        parseInt(document.getElementById('blurSlider').value, 10),
    anim:        document.getElementById('animSelect').value,
    shadow:      document.querySelector('input[name=shadow]:checked')?.value || 'none',
    opacity:     parseInt(document.getElementById('opacitySlider').value, 10),
    border:      document.querySelector('input[name=border]:checked')?.value || 'none',
    borderColor: document.getElementById('borderColor').value,
  };
}

/* ============================================================
   Apply settings → island element
   ============================================================ */
function applySettings() {
  const s = readControlValues();
  const island = document.getElementById('island');

  // Update badge values
  document.getElementById('sizeValue').textContent    = s.size.toFixed(2) + '×';
  document.getElementById('blurValue').textContent    = s.blur + 'px';
  document.getElementById('opacityValue').textContent = s.opacity + '%';

  // Border color group visibility
  document.getElementById('borderColorGroup').style.display =
    s.border !== 'none' ? '' : 'none';

  // Shape → border-radius
  const radiusMap = { pill: '50px', rounded: '14px', sharp: '4px' };
  const baseRadius = radiusMap[s.shape] || '50px';
  island.style.setProperty('--base-radius', baseRadius);

  // Color
  island.style.background = s.color;

  // Text / icon color
  island.style.color = s.textColor;

  // Scale
  island.style.transform = `translateX(-50%) scale(${s.size})`;

  // Blur
  island.style.backdropFilter = s.blur > 0 ? `blur(${s.blur}px)` : 'none';
  island.style.webkitBackdropFilter = island.style.backdropFilter;

  // Opacity
  island.style.opacity = (s.opacity / 100).toString();

  // Shadow / glow
  const shadowMap = {
    none:    'none',
    subtle:  '0 4px 24px rgba(0,0,0,.5)',
    glow:    `0 0 20px 4px ${s.color === GLASS_COLOR ? 'rgba(255,255,255,.3)' : s.color}88`,
    intense: `0 0 32px 8px ${s.color === GLASS_COLOR ? 'rgba(255,255,255,.5)' : s.color}bb, 0 0 60px 12px ${s.color}44`,
  };
  island.style.boxShadow = shadowMap[s.shadow] || 'none';

  // Border
  const borderColorVal = s.borderColor;
  const borderMap = {
    none:   'none',
    thin:   `1px solid ${borderColorVal}55`,
    medium: `2px solid ${borderColorVal}99`,
    glow:   `2px solid ${borderColorVal}`,
  };
  island.style.border = borderMap[s.border] || 'none';

  // Animation class
  const animClasses = ['anim-spring','anim-smooth','anim-snappy','anim-elastic','anim-none'];
  document.body.classList.remove(...animClasses);
  document.body.classList.add(`anim-${s.anim}`);

  // Border radius reset when expanded (use shape-aware radius)
  updateExpandedBorderRadius(s.shape);
}

function updateExpandedBorderRadius(shape) {
  const expandedMap = {
    pill:    '26px',
    rounded: '16px',
    sharp:   '6px',
  };
  const r = expandedMap[shape] || '26px';
  // Inject or update a dynamic style rule
  let styleEl = document.getElementById('dynamic-island-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-island-style';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    .island.expanded-call,
    .island.expanded-music,
    .island.expanded-timer,
    .island.expanded-alert { border-radius: ${r} !important; }
    .island:not(.expanded) { border-radius: var(--base-radius, 50px) !important; }
  `;
}

/* ============================================================
   Set color helpers
   ============================================================ */
function setColor(btn) {
  document.querySelectorAll('.swatch[data-color]').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  applySettings();
}

function setCustomColor(val) {
  document.querySelectorAll('.swatch[data-color]').forEach(s => s.classList.remove('active'));
  // Mark the custom swatch as active and store the color
  const customSwatch = document.querySelector('.custom-swatch');
  customSwatch.classList.add('active');
  customSwatch.dataset.color = val;
  document.getElementById('customColor').value = val;
  applySettings();
}

function setTextColor(btn) {
  document.querySelectorAll('.swatch[data-textcolor]').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  applySettings();
}

function setCustomTextColor(val) {
  document.querySelectorAll('.swatch[data-textcolor]').forEach(s => s.classList.remove('active'));
  const customSwatch = document.querySelector('.custom-swatch[data-swatch-type="textcolor"]');
  customSwatch.classList.add('active');
  document.getElementById('customTextColor').value = val;
  applySettings();
}

/* ============================================================
   Apply Preset
   ============================================================ */
function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  loadSettingsToControls(p);
  applySettings();
  showSavedIndicator(`🎨 "${name}" preset applied`);
}

/* ============================================================
   Load settings into controls
   ============================================================ */
function loadSettingsToControls(s) {
  // Color
  document.querySelectorAll('.swatch[data-color]').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.color === s.color);
  });
  document.getElementById('customColor').value = s.color;

  // Text color
  document.querySelectorAll('.swatch[data-textcolor]').forEach(sw => {
    sw.classList.toggle('active', sw.dataset.textcolor === s.textColor);
  });
  document.getElementById('customTextColor').value = s.textColor;

  // Shape
  document.querySelectorAll('input[name=shape]').forEach(r => {
    r.checked = r.value === s.shape;
  });

  // Size
  document.getElementById('sizeSlider').value = s.size;

  // Blur
  document.getElementById('blurSlider').value = s.blur;

  // Animation
  document.getElementById('animSelect').value = s.anim;

  // Shadow
  document.querySelectorAll('input[name=shadow]').forEach(r => {
    r.checked = r.value === s.shadow;
  });

  // Opacity
  document.getElementById('opacitySlider').value = s.opacity;

  // Border
  document.querySelectorAll('input[name=border]').forEach(r => {
    r.checked = r.value === s.border;
  });

  // Border color
  document.getElementById('borderColor').value = s.borderColor;
}

/* ============================================================
   Reset
   ============================================================ */
function resetSettings() {
  localStorage.removeItem(STORAGE_KEY);
  const defaults = PRESETS.classic;
  loadSettingsToControls(defaults);
  applySettings();
  showSavedIndicator('↺ Reset to defaults');
}

/* ============================================================
   Notification / Island Expand Logic
   ============================================================ */
function showNotification(type) {
  // If same type is active, dismiss it
  if (activeNotification === type) {
    dismissIsland();
    return;
  }

  // Clear any pending auto-dismiss
  if (dismissTimeout) clearTimeout(dismissTimeout);
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  const island = document.getElementById('island');

  // Hide all content panels
  document.querySelectorAll('.island-content').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('visible');
  });

  // Remove expanded classes
  island.classList.remove('expanded', 'expanded-call', 'expanded-music', 'expanded-timer', 'expanded-alert');

  // Small delay to let collapse animation run first if switching
  const delay = activeNotification ? 200 : 0;
  activeNotification = type;

  setTimeout(() => {
    island.classList.add('expanded', `expanded-${type}`);
    const content = island.querySelector(`.island-${type}`);
    if (content) {
      content.classList.remove('hidden');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => content.classList.add('visible'));
      });
    }

    // Auto-dismiss (except timer which has its own countdown)
    if (type === 'timer') {
      startTimerCountdown();
    } else {
      dismissTimeout = setTimeout(() => dismissIsland(), 8000);
    }
  }, delay);
}

function dismissIsland() {
  const island = document.getElementById('island');

  // Hide content
  document.querySelectorAll('.island-content').forEach(el => {
    el.classList.remove('visible');
    setTimeout(() => el.classList.add('hidden'), 200);
  });

  island.classList.remove('expanded', 'expanded-call', 'expanded-music', 'expanded-timer', 'expanded-alert');
  activeNotification = null;

  if (dismissTimeout) { clearTimeout(dismissTimeout); dismissTimeout = null; }
  if (timerInterval)  { clearInterval(timerInterval); timerInterval = null; }
  timerSeconds = TIMER_DURATION;
  document.getElementById('timerValue').textContent = formatTime(timerSeconds);
}

function startTimerCountdown() {
  timerSeconds = TIMER_DURATION;
  document.getElementById('timerValue').textContent = formatTime(timerSeconds);

  timerInterval = setInterval(() => {
    timerSeconds--;
    document.getElementById('timerValue').textContent = formatTime(timerSeconds);
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      dismissIsland();
    }
  }, 1000);
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ============================================================
   Clock Update
   ============================================================ */
function updateClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  document.getElementById('phoneTime').textContent =
    `${h % 12 || 12}:${String(m).padStart(2,'0')}`;

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('phoneDate').textContent =
    `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
}

/* ============================================================
   Init
   ============================================================ */
function init() {
  const saved = getSettings();
  loadSettingsToControls(saved);
  applySettings();
  updateClock();
  setInterval(updateClock, 10000);
}

document.addEventListener('DOMContentLoaded', init);
