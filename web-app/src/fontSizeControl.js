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
    togglePopup(fontSizePopup);
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
        e.target !== fontSizeBtn) {
      fontSizePopup.hidden = true;
    }
  });

  // Close popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !fontSizePopup.hidden) {
      fontSizePopup.hidden = true;
      fontSizeBtn.focus();
    }
  });
}

/**
 * Toggle the popup visibility
 */
function togglePopup(popup) {
  popup.hidden = !popup.hidden;
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
  const baseFontSize = 16 * (percentage / 100);

  // Apply to root element
  document.documentElement.style.setProperty('--font-size-base', `${baseFontSize}px`);

  // Update preview display
  updatePreview(percentage);
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
function toggleDyslexicFont(enabled) {
  if (enabled) {
    document.body.classList.add('opendyslexic-enabled');
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
