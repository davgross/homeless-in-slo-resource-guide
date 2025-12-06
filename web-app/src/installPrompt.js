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
