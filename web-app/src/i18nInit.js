/**
 * i18n Initialization Module
 * Sets all user-visible text in the HTML based on the selected language
 */

import { getStrings, getCurrentLanguage } from './strings.js';

/**
 * Initialize i18n for the entire application
 * Should be called early in the app initialization
 */
export function initI18n() {
  const strings = getStrings();
  const lang = getCurrentLanguage();

  // Set HTML lang attribute
  document.documentElement.setAttribute('lang', lang);

  // Update meta tags
  updateMetaTags(strings);

  // Update navigation
  updateNavigation(strings);

  // Update search
  updateSearch(strings);

  // Update loading states
  updateLoadingStates(strings);

  // Update buttons
  updateButtons(strings);

  // Update font size control
  updateFontSizeControl(strings);
}

/**
 * Update page metadata
 */
function updateMetaTags(strings) {
  // Update title
  document.title = strings.meta.title;

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute('content', strings.meta.description);
  }
}

/**
 * Update navigation elements
 */
function updateNavigation(strings) {
  // Skip link
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.textContent = strings.nav.skipToMain;
  }

  // Header logo
  const headerLogo = document.querySelector('.header-logo');
  if (headerLogo) {
    headerLogo.setAttribute('aria-label', strings.nav.returnToHome);
    const logoImg = headerLogo.querySelector('img');
    if (logoImg) {
      logoImg.setAttribute('alt', strings.nav.logoAlt);
    }
  }

  // Main navigation
  const appNav = document.querySelector('.app-nav');
  if (appNav) {
    appNav.setAttribute('aria-label', strings.nav.mainNavLabel);
  }

  // Navigation buttons
  const resourcesBtn = document.querySelector('[data-section="resources"]');
  if (resourcesBtn) {
    resourcesBtn.textContent = strings.nav.resources;
  }

  const directoryBtn = document.querySelector('[data-section="directory"]');
  if (directoryBtn) {
    directoryBtn.textContent = strings.nav.directory;
  }

  const aboutBtn = document.querySelector('[data-section="about"]');
  if (aboutBtn) {
    aboutBtn.textContent = strings.nav.about;
  }
}

/**
 * Update search elements
 */
function updateSearch(strings) {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.setAttribute('placeholder', strings.search.placeholder);
    searchInput.setAttribute('aria-label', strings.search.ariaLabel);
  }

  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.setAttribute('aria-label', strings.search.resultsLabel);
  }
}

/**
 * Update loading states
 */
function updateLoadingStates(strings) {
  const resourcesLoading = document.querySelector('#resources-section .loading');
  if (resourcesLoading) {
    resourcesLoading.textContent = strings.loading.resources;
  }

  const directoryLoading = document.querySelector('#directory-section .loading');
  if (directoryLoading) {
    directoryLoading.textContent = strings.loading.directory;
  }

  const aboutLoading = document.querySelector('#about-section .loading');
  if (aboutLoading) {
    aboutLoading.textContent = strings.loading.resources;
  }
}

/**
 * Update buttons
 */
function updateButtons(strings) {
  // Share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.setAttribute('aria-label', strings.share.button.ariaLabel);
    shareBtn.setAttribute('title', strings.share.button.title);
  }

  // TOC button
  const tocBtn = document.getElementById('toc-btn');
  if (tocBtn) {
    tocBtn.setAttribute('aria-label', strings.toc.button.ariaLabel);
    tocBtn.setAttribute('title', strings.toc.button.title);
  }

  // Install button
  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.setAttribute('aria-label', strings.install.button.ariaLabel);
    installBtn.setAttribute('title', strings.install.button.title);
  }

  // Directory overlay buttons
  const directoryFeedbackBtn = document.querySelector('.directory-feedback-btn');
  if (directoryFeedbackBtn) {
    directoryFeedbackBtn.setAttribute('aria-label', strings.directory.feedbackButton.ariaLabel);
    directoryFeedbackBtn.setAttribute('title', strings.directory.feedbackButton.title);
  }

  const directoryCloseBtn = document.querySelector('#directory-overlay .close-btn');
  if (directoryCloseBtn) {
    directoryCloseBtn.setAttribute('aria-label', strings.directory.closeButton.ariaLabel);
  }
}

/**
 * Update font size control elements
 */
function updateFontSizeControl(strings) {
  const fontSizeBtn = document.getElementById('font-size-btn');
  if (fontSizeBtn) {
    fontSizeBtn.setAttribute('aria-label', strings.fontSize.button.ariaLabel);
    fontSizeBtn.setAttribute('title', strings.fontSize.button.title);
  }

  const fontSizePopup = document.getElementById('font-size-popup');
  if (fontSizePopup) {
    // Header
    const header = fontSizePopup.querySelector('.font-size-popup-header');
    if (header) {
      header.textContent = strings.fontSize.popup.header;
    }

    // Decrease button
    const decreaseBtn = document.getElementById('font-size-decrease');
    if (decreaseBtn) {
      decreaseBtn.textContent = strings.fontSize.popup.decrease;
      decreaseBtn.setAttribute('aria-label', strings.fontSize.popup.decreaseAriaLabel);
    }

    // Reset button
    const resetBtn = document.getElementById('font-size-reset');
    if (resetBtn) {
      resetBtn.textContent = strings.fontSize.popup.reset;
      resetBtn.setAttribute('aria-label', strings.fontSize.popup.resetAriaLabel);
    }

    // Increase button
    const increaseBtn = document.getElementById('font-size-increase');
    if (increaseBtn) {
      increaseBtn.textContent = strings.fontSize.popup.increase;
      increaseBtn.setAttribute('aria-label', strings.fontSize.popup.increaseAriaLabel);
    }

    // OpenDyslexic toggle
    const dyslexicToggle = document.getElementById('opendyslexic-toggle');
    if (dyslexicToggle) {
      dyslexicToggle.setAttribute('aria-label', strings.fontSize.popup.dyslexicAriaLabel);
    }

    // OpenDyslexic label
    const dyslexicLabel = fontSizePopup.querySelector('.font-toggle-label span');
    if (dyslexicLabel) {
      // Reconstruct the label text
      dyslexicLabel.innerHTML = `${strings.fontSize.popup.dyslexicToggleLabel} <span class="opendyslexic-preview">${strings.fontSize.popup.dyslexicFontName}</span> ${strings.fontSize.popup.dyslexicToggleSuffix}`;
    }
  }
}
