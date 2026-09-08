import { getStrings } from './strings.js';

/**
 * Font Size Control - Allows users to adjust text size
 * Persists preference in localStorage
 */

// Font size scale (percentage values)
const FONT_SIZES = [80, 90, 100, 110, 120, 130, 140, 150];
const DEFAULT_SIZE_INDEX = 2; // 100%
const STORAGE_KEY = 'fontSizeIndex';
const DYSLEXIC_FONT_KEY = 'openDyslexicEnabled';

let currentSizeIndex = DEFAULT_SIZE_INDEX;

/**
 * Ask the browser to load the OpenDyslexic faces and report whether they
 * actually arrived.
 *
 * The font is declared with @font-face in style.css and served from our own
 * origin, so there is no stylesheet to inject any more — but the load can
 * still fail (corrupt cache, storage pressure). It previously failed silently:
 * the toggle reported success while the text never changed, which is a bad way
 * for an accessibility feature to behave. See issue #420.
 *
 * @returns {Promise<boolean>} true when at least the regular face is usable
 */
async function ensureOpenDyslexicLoaded() {
  if (!document.fonts || !document.fonts.load) {
    // No Font Loading API: assume it worked rather than blocking the feature
    return true;
  }

  try {
    await Promise.all([
      document.fonts.load('400 1rem OpenDyslexic'),
      document.fonts.load('700 1rem OpenDyslexic'),
      document.fonts.load('italic 400 1rem OpenDyslexic')
    ]);
    return document.fonts.check('400 1rem OpenDyslexic');
  } catch (e) {
    console.warn('OpenDyslexic failed to load:', e);
    return false;
  }
}

/**
 * Initialize font size control functionality
 */
export function initFontSizeControl() {
  const fontSizeBtn = document.getElementById('font-size-btn');
  const fontSizePopup = document.getElementById('font-size-popup');
  const decreaseBtn = document.getElementById('font-size-decrease');
  const resetBtn = document.getElementById('font-size-reset');
  const increaseBtn = document.getElementById('font-size-increase');
  const dyslexicToggle = document.getElementById('opendyslexic-toggle');

  if (!fontSizeBtn || !fontSizePopup) return;

  // Load saved preferences
  loadFontSize();
  loadDyslexicFont();

  // Toggle popup on button click
  fontSizeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    setPopupOpen(fontSizePopup, fontSizeBtn, fontSizePopup.hidden);
  });

  // Font size control buttons
  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      changeFontSize(-1);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetFontSize();
    });
  }

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      changeFontSize(1);
    });
  }

  // OpenDyslexic toggle
  if (dyslexicToggle) {
    dyslexicToggle.addEventListener('change', (e) => {
      toggleDyslexicFont(e.target.checked);
    });
  }

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!fontSizePopup.hidden &&
        !fontSizePopup.contains(e.target) &&
        !fontSizeBtn.contains(e.target)) {
      setPopupOpen(fontSizePopup, fontSizeBtn, false);
    }
  });

  // Close popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !fontSizePopup.hidden) {
      setPopupOpen(fontSizePopup, fontSizeBtn, false);
      fontSizeBtn.focus();
    }
  });
}

/**
 * Close any other toolbar popup, so two never sit on screen at once
 */
function closeOtherPopups(keep) {
  document.querySelectorAll('#app-toolbar [id$="-popup"]').forEach(other => {
    if (other === keep || other.hidden) return;
    other.hidden = true;
    const trigger = document.querySelector(`[aria-controls="${other.id}"]`);
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  });
}

/**
 * Show or hide the popup, keeping aria-expanded and focus in sync
 */
function setPopupOpen(popup, trigger, open) {
  if (open) closeOtherPopups(popup);
  popup.hidden = !open;
  trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    const first = popup.querySelector('button');
    if (first) first.focus();
  }
}

/**
 * Load font size from localStorage and apply it
 */
function loadFontSize() {
  try {
    const savedIndex = localStorage.getItem(STORAGE_KEY);
    if (savedIndex !== null) {
      const index = parseInt(savedIndex, 10);
      if (index >= 0 && index < FONT_SIZES.length) {
        currentSizeIndex = index;
      }
    }
  } catch (e) {
    // localStorage may be unavailable in some contexts
    console.warn('Could not load font size preference:', e);
  }

  applyFontSize();
}

/**
 * Change font size by a step (+1 or -1)
 */
function changeFontSize(step) {
  const newIndex = currentSizeIndex + step;

  if (newIndex >= 0 && newIndex < FONT_SIZES.length) {
    currentSizeIndex = newIndex;
    applyFontSize();
    saveFontSize();
  }
}

/**
 * Reset font size to default
 */
function resetFontSize() {
  currentSizeIndex = DEFAULT_SIZE_INDEX;
  applyFontSize();
  saveFontSize();
}

/**
 * Apply the current font size to the document
 */
function applyFontSize() {
  const percentage = FONT_SIZES[currentSizeIndex];

  // A percentage, not a pixel value: this multiplies whatever default text
  // size the reader has set in their browser rather than overriding it.
  document.documentElement.style.setProperty('--font-size-scale', `${percentage}%`);

  // Update preview display
  updatePreview(percentage);

  // Layout that depends on text size (e.g. which tables now overflow)
  document.dispatchEvent(new CustomEvent('vivaslo:textsizechange'));
}

/**
 * Update the preview text in the popup
 */
function updatePreview(percentage) {
  const preview = document.querySelector('.font-size-preview');
  if (preview) {
    preview.textContent = `${percentage}%`;
  }
}

/**
 * Save font size preference to localStorage
 */
function saveFontSize() {
  try {
    localStorage.setItem(STORAGE_KEY, currentSizeIndex.toString());
  } catch (e) {
    console.warn('Could not save font size preference:', e);
  }
}

/**
 * Load OpenDyslexic font preference from localStorage and apply it
 */
function loadDyslexicFont() {
  try {
    const savedPref = localStorage.getItem(DYSLEXIC_FONT_KEY);
    const enabled = savedPref === 'true';

    // Update checkbox state
    const toggle = document.getElementById('opendyslexic-toggle');
    if (toggle) {
      toggle.checked = enabled;
    }

    // Apply font
    if (enabled) {
      document.body.classList.add('opendyslexic-enabled');
    }
  } catch (e) {
    console.warn('Could not load OpenDyslexic font preference:', e);
  }
}

/**
 * Toggle OpenDyslexic font on/off
 */
async function toggleDyslexicFont(enabled) {
  if (enabled) {
    document.body.classList.add('opendyslexic-enabled');

    // Never claim success the font did not deliver
    const ok = await ensureOpenDyslexicLoaded();
    if (!ok) {
      document.body.classList.remove('opendyslexic-enabled');
      const toggle = document.getElementById('opendyslexic-toggle');
      if (toggle) toggle.checked = false;
      announceFontFailure();
      return;
    }
  } else {
    document.body.classList.remove('opendyslexic-enabled');
  }

  // Save preference
  try {
    localStorage.setItem(DYSLEXIC_FONT_KEY, enabled.toString());
  } catch (e) {
    console.warn('Could not save OpenDyslexic font preference:', e);
  }
}

/**
 * Tell the reader the font could not be loaded, rather than leaving them to
 * wonder why nothing changed.
 */
function announceFontFailure() {
  const message = getStrings().fontSize.popup.dyslexicUnavailable;

  const announcer = document.getElementById('announcer');
  if (announcer) {
    announcer.textContent = '';
    window.requestAnimationFrame(() => { announcer.textContent = message; });
  }

  const popup = document.getElementById('font-size-popup');
  if (!popup) return;

  let note = popup.querySelector('.font-toggle-error');
  if (!note) {
    note = document.createElement('p');
    note.className = 'font-toggle-error';
    note.setAttribute('role', 'alert');
    popup.querySelector('.font-toggle-section').appendChild(note);
  }
  note.textContent = message;
}
