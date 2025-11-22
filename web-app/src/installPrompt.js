/**
 * Install Prompt Module
 * Handles PWA installation functionality:
 * - Captures the beforeinstallprompt event
 * - Shows/hides install button based on installability
 * - Triggers native install prompt when user clicks install button
 * - Hides button when app is already installed (standalone mode)
 */

let deferredPrompt = null;

/**
 * Check if the app is running in standalone mode (already installed)
 */
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Detect the current browser/platform
 */
function detectBrowser() {
  const ua = navigator.userAgent;

  // iOS detection (must come before Safari check)
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }

  // Samsung Internet
  if (/SamsungBrowser/i.test(ua)) {
    return 'samsung';
  }

  // Firefox (mobile and desktop)
  if (/Firefox/i.test(ua)) {
    if (/Android/i.test(ua)) {
      return 'firefox-android';
    }
    return 'firefox-desktop';
  }

  // Edge (Chromium-based)
  if (/Edg/i.test(ua)) {
    return 'edge';
  }

  // Brave (reports as Chrome, but has navigator.brave)
  if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
    return 'brave';
  }

  // Opera
  if (/OPR/i.test(ua) || /Opera/i.test(ua)) {
    return 'opera';
  }

  // Chrome on Android
  if (/Android/i.test(ua) && /Chrome/i.test(ua)) {
    return 'chrome-android';
  }

  // Chrome on desktop
  if (/Chrome/i.test(ua)) {
    return 'chrome-desktop';
  }

  // Safari on macOS (after iOS check)
  if (/Safari/i.test(ua)) {
    return 'safari-desktop';
  }

  return 'unknown';
}

/**
 * Show the install button
 */
function showInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.classList.add('visible');
  }
}

/**
 * Hide the install button
 */
function hideInstallButton() {
  const btn = document.getElementById('install-btn');
  if (btn) {
    btn.classList.remove('visible');
  }
}

/**
 * Handle the install button click
 */
async function handleInstallClick() {
  if (!deferredPrompt) {
    // No deferred prompt available - this shouldn't happen if button is visible
    // but handle gracefully by hiding the button
    hideInstallButton();
    return;
  }

  // Show the native install prompt
  deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;

  // Clear the deferred prompt - it can only be used once
  deferredPrompt = null;

  // Hide the button regardless of outcome
  // (If they accepted, app is installed; if dismissed, don't pester them)
  hideInstallButton();

  // Log for debugging (can be removed in production)
  console.log(`Install prompt outcome: ${outcome}`);
}

/**
 * Initialize the install prompt functionality
 */
export function initInstallPrompt() {
  const installBtn = document.getElementById('install-btn');
  if (!installBtn) {
    console.warn('Install button not found in DOM');
    return;
  }

  // If already running as standalone (installed), don't show install button
  if (isStandalone()) {
    hideInstallButton();
    return;
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67+ from showing the mini-infobar automatically
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e;

    // Show our custom install button
    showInstallButton();
  });

  // Add click handler to install button
  installBtn.addEventListener('click', handleInstallClick);

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    // Clear the deferred prompt
    deferredPrompt = null;

    // Hide the install button
    hideInstallButton();

    console.log('App was installed successfully');
  });

  // Also hide button if display mode changes to standalone
  // (handles edge case where user installs via browser menu)
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
    if (e.matches) {
      hideInstallButton();
    }
  });
}

/**
 * Check if the app can be installed via the native prompt
 * Returns true if beforeinstallprompt has fired and we have a deferred prompt
 */
export function canInstall() {
  return deferredPrompt !== null;
}

/**
 * Get platform-specific install instructions
 * Returns an object with platform name and installation steps
 */
export function getInstallInstructions() {
  const browser = detectBrowser();

  const instructions = {
    'ios': {
      platform: 'iPhone/iPad (Safari)',
      steps: [
        'Tap the Share button (square with up arrow) at the bottom of Safari',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right corner'
      ],
      note: 'You must use Safari to install this app on iOS. Other browsers like Chrome or Firefox on iOS do not support installing web apps.'
    },

    'chrome-android': {
      platform: 'Android (Chrome)',
      steps: [
        'Tap the menu button (three dots) in the top right',
        'Tap "Add to Home screen" or "Install app"',
        'Tap "Install" to confirm'
      ]
    },

    'samsung': {
      platform: 'Samsung Internet',
      steps: [
        'Tap the menu button (three lines) at the bottom',
        'Tap "Add page to" then "Home screen"',
        'Tap "Add" to confirm'
      ]
    },

    'firefox-android': {
      platform: 'Android (Firefox)',
      steps: [
        'Tap the menu button (three dots)',
        'Tap "Install"',
        'If you don\'t see "Install", tap "Add to Home screen" instead'
      ],
      note: 'Firefox on Android supports installing web apps, but the experience may vary by version.'
    },

    'firefox-desktop': {
      platform: 'Firefox (Desktop)',
      steps: [
        'Firefox desktop does not currently support installing web apps',
        'You can bookmark this page for quick access: press Ctrl+D (Windows) or Cmd+D (Mac)',
        'Or, try using Chrome, Edge, or Brave for full install support'
      ],
      note: 'Firefox is working on PWA support. For now, consider using a Chromium-based browser to install this app.'
    },

    'chrome-desktop': {
      platform: 'Chrome (Desktop)',
      steps: [
        'Click the install icon in the address bar (monitor with down arrow), or',
        'Click the menu (three dots) and select "Install VivaSLO..."',
        'Click "Install" to confirm'
      ]
    },

    'edge': {
      platform: 'Microsoft Edge',
      steps: [
        'Click the install icon in the address bar, or',
        'Click the menu (three dots) and select "Apps" then "Install this site as an app"',
        'Click "Install" to confirm'
      ]
    },

    'brave': {
      platform: 'Brave',
      steps: [
        'Click the install icon in the address bar (if visible), or',
        'Click the menu (three lines) and select "Install VivaSLO..."',
        'Click "Install" to confirm'
      ]
    },

    'opera': {
      platform: 'Opera',
      steps: [
        'Click the menu and look for "Install" or "Add to Home screen"',
        'Follow the prompts to install'
      ],
      note: 'Opera support for web app installation may vary by version and platform.'
    },

    'safari-desktop': {
      platform: 'Safari (Mac)',
      steps: [
        'Safari on Mac does not fully support installing web apps',
        'You can add this page to your Dock: from the menu, select File > Add to Dock',
        'Or, bookmark this page for quick access: press Cmd+D'
      ],
      note: 'For the best experience on Mac, consider using Chrome, Edge, or Brave.'
    },

    'unknown': {
      platform: 'Your Browser',
      steps: [
        'Look for an "Install" or "Add to Home Screen" option in your browser\'s menu',
        'This is usually found in the main menu (often three dots or three lines)',
        'If your browser doesn\'t support installation, you can bookmark this page for quick access'
      ],
      note: 'Not all browsers support installing web apps. Chrome, Edge, Brave, and Safari (iOS) offer the best support.'
    }
  };

  return instructions[browser] || instructions['unknown'];
}

/**
 * Get all install instructions for documentation purposes
 * Used by the About page to show instructions for all platforms
 */
export function getAllInstallInstructions() {
  return [
    {
      platform: 'iPhone/iPad',
      browser: 'Safari',
      steps: [
        'Open this page in Safari (required for iOS)',
        'Tap the Share button (square with up arrow) at the bottom',
        'Scroll down and tap "Add to Home Screen"',
        'Tap "Add" in the top right corner'
      ]
    },
    {
      platform: 'Android',
      browser: 'Chrome',
      steps: [
        'Tap the menu button (three dots) in the top right',
        'Tap "Add to Home screen" or "Install app"',
        'Tap "Install" to confirm'
      ]
    },
    {
      platform: 'Android',
      browser: 'Firefox',
      steps: [
        'Tap the menu button (three dots)',
        'Tap "Install" or "Add to Home screen"'
      ]
    },
    {
      platform: 'Android',
      browser: 'Samsung Internet',
      steps: [
        'Tap the menu button (three lines)',
        'Tap "Add page to" then "Home screen"'
      ]
    },
    {
      platform: 'Windows/Mac/Linux',
      browser: 'Chrome, Edge, or Brave',
      steps: [
        'Look for the install icon in the address bar (monitor with down arrow)',
        'Or click the browser menu and look for "Install..."',
        'Click "Install" to confirm'
      ]
    },
    {
      platform: 'Windows/Mac/Linux',
      browser: 'Firefox',
      steps: [
        'Firefox desktop does not support installing web apps yet',
        'Bookmark this page (Ctrl+D or Cmd+D) for quick access',
        'Or use Chrome, Edge, or Brave for full install support'
      ]
    },
    {
      platform: 'Mac',
      browser: 'Safari',
      steps: [
        'From the menu, select File > Add to Dock',
        'Or bookmark this page (Cmd+D) for quick access'
      ]
    }
  ];
}
