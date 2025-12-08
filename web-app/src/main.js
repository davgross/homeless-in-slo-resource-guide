import './style.css';
import DOMPurify from 'dompurify';
import { initFeedback } from './feedback.js';
import { initShareButton, createSectionShareButton } from './shareButton.js';
import { initFontSizeControl } from './fontSizeControl.js';
import { initInstallPrompt } from './installPrompt.js';
import { getStrings } from './strings.js';

// UI Strings
const strings = getStrings();

// Helper function for copying to clipboard
function copyToClipboard(text, successMessage) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => {
        showNotification(successMessage || strings.share.notifications.linkCopied);
      })
      .catch(() => {
        showNotification(strings.share.notifications.copyFailedShort);
      });
  } else {
    showNotification(strings.share.notifications.copyFailedShort);
  }
}

// Helper function to show notifications
function showNotification(message) {
  // Remove any existing notification
  const existing = document.getElementById('share-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'share-notification';
  notification.className = 'share-notification';
  notification.textContent = message;
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');

  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// App State
const state = {
  currentSection: 'resources',
  scrollPositions: {},
  directoryEntries: new Map(),
  searchIndex: [],
  currentDirectoryEntry: null
};

// Make state accessible globally for feedback system
window.appState = state;

// Initialize the app
async function init() {
  // Critical setup needed for initial render
  setupNavigation();
  setupSearch();
  setupDirectoryOverlay();

  // Initialize scroll padding adjustment (visual layout)
  updateScrollPadding();
  window.addEventListener('resize', updateScrollPadding);

  // Load and apply font size preference early (but defer button setup)
  loadFontSizePreference();

  // Load Resources content first (critical path for most users)
  await loadResourcesContent();

  // Restore previous state if exists
  restoreState();

  // Show initial section - THIS IS THE KEY MOMENT
  showSection(state.currentSection);

  // Load remaining content in background (Directory and About)
  // This happens after Resources is displayed
  requestAnimationFrame(() => {
    loadRemainingContent();
  });

  // Defer non-critical initialization until after initial render
  requestAnimationFrame(() => {
    setTimeout(deferNonCriticalInit, 0);
  });
}

/**
 * Load font size preference without initializing the full control UI
 * This ensures correct font size on initial render
 */
function loadFontSizePreference() {
  try {
    const savedIndex = localStorage.getItem('fontSizeIndex');
    if (savedIndex !== null) {
      const index = parseInt(savedIndex, 10);
      const FONT_SIZES = [80, 90, 100, 110, 120, 130, 140, 150];
      if (index >= 0 && index < FONT_SIZES.length) {
        const percentage = FONT_SIZES[index];
        const baseFontSize = 16 * (percentage / 100);
        document.documentElement.style.setProperty('--font-size-base', `${baseFontSize}px`);
      }
    }
  } catch (e) {
    // Ignore errors - will use default
  }
}

/**
 * Initialize non-critical features after content is displayed
 */
function deferNonCriticalInit() {
  // Initialize feedback system
  initFeedback();

  // Initialize share button
  initShareButton();

  // Initialize TOC navigation button
  initTOCButton();

  // Initialize font size control (full UI)
  initFontSizeControl();

  // Initialize install prompt
  initInstallPrompt();

  // Update last modified date
  updateLastModifiedDate();

  // Final scroll padding adjustment
  setTimeout(updateScrollPadding, 100);
}

// Setup navigation between sections
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      navigateToSection(section);
    });
  });

  // Setup logo click to navigate to home (resources)
  const headerLogo = document.querySelector('.header-logo');
  if (headerLogo) {
    headerLogo.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSection('resources');
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
      showSection(e.state.section, false);
    }
  });
}

// Update scroll padding to account for dynamic header height
function updateScrollPadding() {
  const header = document.querySelector('.app-header');
  if (header) {
    const headerHeight = header.getBoundingClientRect().height;
    // Add a small buffer (16px) for better spacing
    const scrollPadding = headerHeight + 16;
    document.documentElement.style.scrollPaddingTop = `${scrollPadding}px`;
  }
}

// Initialize TOC navigation button
function initTOCButton() {
  const tocBtn = document.getElementById('toc-btn');
  if (!tocBtn) return;

  // Dynamically position button based on header height
  function updateTOCButtonPosition() {
    const header = document.querySelector('.app-header');
    if (header) {
      const headerHeight = header.getBoundingClientRect().height;
      // Position button 35px below the header (extra space for up arrow indicator)
      tocBtn.style.top = `${headerHeight + 35}px`;
    }
  }

  // Update button state based on TOC position relative to viewport
  function updateTOCButtonState() {
    const tocWrapper = document.querySelector('.toc-section-wrapper');
    if (!tocWrapper) return;

    const tocRect = tocWrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if TOC is above or below viewport
    const isAbove = tocRect.bottom <= 0;
    const isBelow = tocRect.top >= viewportHeight;

    // Check if any part of TOC is in viewport
    const isInView = !isAbove && !isBelow;

    // Update classes
    tocBtn.classList.toggle('toc-in-view', isInView);
    tocBtn.classList.toggle('toc-above', isAbove);
    tocBtn.classList.toggle('toc-below', isBelow);

    // Update aria-label for better accessibility
    if (isInView) {
      tocBtn.setAttribute('aria-label', 'Table of contents (currently visible)');
    } else if (isAbove) {
      tocBtn.setAttribute('aria-label', 'Jump up to table of contents');
    } else if (isBelow) {
      tocBtn.setAttribute('aria-label', 'Jump down to table of contents');
    } else {
      tocBtn.setAttribute('aria-label', 'Jump to table of contents');
    }
  }

  // Click handler - scroll to Table of Contents
  tocBtn.addEventListener('click', () => {
    // Find the TOC heading in the resources section
    const tocHeading = document.querySelector('#resources-section a[id="table-of-contents"]');
    if (tocHeading) {
      tocHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Show/hide button based on current section
  function updateTOCButtonVisibility() {
    if (state.currentSection === 'resources') {
      tocBtn.classList.add('visible');
      updateTOCButtonState();
    } else {
      tocBtn.classList.remove('visible');
    }
  }

  // Update position on initialization
  updateTOCButtonPosition();

  // Update position on window resize (handles search bar wrapping)
  window.addEventListener('resize', updateTOCButtonPosition);

  // Update button state on scroll
  window.addEventListener('scroll', () => {
    if (state.currentSection === 'resources') {
      updateTOCButtonState();
    }
  });

  // Also update position after a short delay to ensure header is fully rendered
  setTimeout(updateTOCButtonPosition, 100);

  // Update visibility when section changes
  // Call immediately and then check periodically for section changes
  updateTOCButtonVisibility();
  setInterval(updateTOCButtonVisibility, 500);
}

// Navigate to a section
function navigateToSection(section) {
  // Save current scroll position
  saveScrollPosition();

  // Update state
  state.currentSection = section;

  // Update URL
  const url = new URL(window.location);
  url.searchParams.set('section', section);
  history.pushState({ section }, '', url);

  // Show section
  showSection(section);

  // Save state to localStorage
  saveState();
}

// Announce message to screen readers
function announce(message) {
  const announcer = document.getElementById('announcer');
  if (announcer) {
    announcer.textContent = message;
  }
}

// Show a specific section
function showSection(section, updateHistory = true) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.hidden = true;
  });

  // Show target section
  const targetSection = document.getElementById(`${section}-section`);
  if (targetSection) {
    targetSection.hidden = false;

    // Restore scroll position
    if (state.scrollPositions[section]) {
      requestAnimationFrame(() => {
        window.scrollTo(0, state.scrollPositions[section]);
      });
    }
  }

  // Update navigation buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.section === section;
    btn.classList.toggle('active', isActive);

    // Update aria-current for screen readers
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Update state
  state.currentSection = section;

  // Announce to screen readers
  const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
  announce(`Showing ${sectionName} section`);

  // Handle anchor navigation if present in URL
  if (window.location.hash) {
    const anchorId = window.location.hash.substring(1);
    setTimeout(() => {
      const anchor = document.getElementById(anchorId);
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  }
}

// Load Resources content from pre-processed HTML
async function loadResourcesContent() {
  try {
    // Fetch pre-processed content
    const [resourcesHTML, directoryEntriesData, searchIndexData] = await Promise.all([
      fetch('/processed/resources.html').then(r => r.text()),
      fetch('/processed/directory-entries.json').then(r => r.json()),
      fetch('/processed/search-index.json').then(r => r.json())
    ]);

    // Load directory entries into Map
    Object.entries(directoryEntriesData).forEach(([id, entry]) => {
      state.directoryEntries.set(id, entry);
    });

    // Load search index
    state.searchIndex = searchIndexData;

    // Render Resources section
    renderResources(resourcesHTML);

  } catch (error) {
    console.error('Error loading resources:', error);
    showError(strings.errors.loadContent);
  }
}

// Load remaining content (Directory and About) in background
async function loadRemainingContent() {
  try {
    const [directoryHTML, aboutHTML] = await Promise.all([
      fetch('/processed/directory.html').then(r => r.text()),
      fetch('/processed/about.html').then(r => r.text())
    ]);

    renderDirectory(directoryHTML);
    renderAbout(aboutHTML);

  } catch (error) {
    console.error('Error loading additional content:', error);
  }
}

// Render resources section
function renderResources(html) {
  const section = document.getElementById('resources-section');

  // Inject pre-processed HTML directly
  section.innerHTML = html;

  // Setup runtime-only operations
  enhanceExternalLinks(section);  // Check hostname at runtime
  setupDirectoryLinks(section);
  setupMapLinks(section);
  addSectionShareButtons(section);
}

// Render directory section
function renderDirectory(html) {
  const section = document.getElementById('directory-section');

  // Inject pre-processed HTML directly
  section.innerHTML = html;

  // Setup runtime-only operations
  enhanceExternalLinks(section);
  enhanceTables(section);
  setupMapLinks(section);
  addSectionShareButtons(section, 'directory');
}

// Render about section
function renderAbout(html) {
  const section = document.getElementById('about-section');

  // Inject pre-processed HTML directly
  section.innerHTML = html;

  // Setup runtime-only operations
  enhanceExternalLinks(section);
}

// Setup directory link handlers
function setupDirectoryLinks(container) {
  const links = container.querySelectorAll('[data-directory-link]');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const entryId = link.dataset.directoryLink;
      showDirectoryEntry(entryId);
    });
  });
}

// Setup map link handlers (platform-specific URLs)
function setupMapLinks(container) {
  const mapLinks = container.querySelectorAll('a.map-link[data-lat][data-lon]');

  mapLinks.forEach(link => {
    const lat = parseFloat(link.dataset.lat);
    const lon = parseFloat(link.dataset.lon);
    const zoom = parseInt(link.dataset.zoom) || 15;

    // Default to OpenStreetMap
    link.href = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    // Platform-specific handling on click
    link.addEventListener('click', (e) => {
      // Check user agent for platform-specific map apps
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        e.preventDefault();
        window.open(`http://maps.apple.com/?ll=${lat},${lon}&z=${zoom}`, '_blank');
      } else if (/Android/.test(navigator.userAgent)) {
        e.preventDefault();
        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
      }
      // Otherwise use default OpenStreetMap link
    });
  });
}

// Enhance external links - check hostname and add target="_blank"
function enhanceExternalLinks(container) {
  const links = container.querySelectorAll('a[data-external-link="true"]');

  links.forEach(link => {
    try {
      const url = new URL(link.href);
      if (url.hostname !== window.location.hostname) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener');

        // Add aria-label if not present
        const currentLabel = link.getAttribute('aria-label');
        if (!currentLabel) {
          link.setAttribute('aria-label', `${link.textContent.trim()} (opens in new tab)`);
        }
      }
    } catch (e) {
      // Invalid URL, skip
    }
  });
}

// Enhance tables for mobile responsiveness
function enhanceTables(container) {
  // Tables are already enhanced during build, but we may need to handle
  // dynamically loaded content in the future
  // For now, this is a no-op since table enhancement is done at build time
}

// Add share buttons to section headings
function addSectionShareButtons(container, sectionName = 'resources') {
  // Find headings that contain anchors with IDs (the preprocessed format)
  const headings = container.querySelectorAll('h2, h3');

  headings.forEach(heading => {
    // Find the anchor with an ID inside this heading
    const anchor = heading.querySelector('a[id]');
    if (!anchor) return;

    const headingId = anchor.id;

    // Skip the table of contents heading
    if (headingId === 'table-of-contents') return;

    // Check if button already exists
    if (heading.querySelector('.section-share-btn')) return;

    // Construct the full URL to this section
    const url = `${window.location.origin}${window.location.pathname}?section=${sectionName}#${headingId}`;

    // createSectionShareButton expects (title, url)
    const shareBtn = createSectionShareButton(heading.textContent.trim(), url);
    heading.prepend(shareBtn);
  });
}

// Setup directory overlay
function setupDirectoryOverlay() {
  const overlay = document.getElementById('directory-overlay');
  const closeBtn = overlay.querySelector('.close-btn');

  // Close on button click
  closeBtn.addEventListener('click', () => {
    hideDirectoryOverlay();
  });

  // Close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hideDirectoryOverlay();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) {
      hideDirectoryOverlay();
    }
  });
}

// Show directory entry in modal
function showDirectoryEntry(entryId) {
  const entry = state.directoryEntries.get(entryId);

  if (!entry) {
    console.error('Directory entry not found:', entryId);
    return;
  }

  // Store current directory entry for feedback context
  state.currentDirectoryEntry = {
    id: entryId,
    title: entry.title
  };

  const overlay = document.getElementById('directory-overlay');
  const content = overlay.querySelector('.directory-content');

  // Entry content is already HTML (pre-processed)
  // Just sanitize for safety (should already be safe, but double-check)
  const html = DOMPurify.sanitize(entry.content, {
    ADD_ATTR: ['data-directory-link', 'data-lat', 'data-lon', 'data-zoom', 'data-label', 'data-bounds', 'data-external-link']
  });

  content.innerHTML = `<div class="directory-entry">${html}</div>`;

  // Setup the share button in the header
  const shareBtn = overlay.querySelector('.directory-share-btn');
  if (shareBtn) {
    // Remove any existing click handlers
    const newShareBtn = shareBtn.cloneNode(true);
    shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);

    // Add new click handler
    newShareBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Create URL with section=directory and anchor to the entry
      const url = `${window.location.origin}${window.location.pathname}?section=directory#${entryId}`;

      const shareData = {
        title: strings.share.directoryEntry.title(entry.title),
        text: strings.share.directoryEntry.text(entry.title),
        url: url
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error('Share failed:', err);
            copyToClipboard(url, strings.share.notifications.entryLinkCopied);
          }
        }
      } else {
        // Copy directory entry link
        copyToClipboard(url, strings.share.notifications.entryLinkCopied);
      }
    });

    // Update aria-label with entry title
    newShareBtn.setAttribute('aria-label', strings.share.directoryEntry.buttonAriaLabel(entry.title));
  }

  // Setup the feedback button in the header
  const feedbackBtn = overlay.querySelector('.directory-feedback-btn');
  if (feedbackBtn) {
    // Remove any existing click handlers
    const newFeedbackBtn = feedbackBtn.cloneNode(true);
    feedbackBtn.parentNode.replaceChild(newFeedbackBtn, feedbackBtn);

    // Add new click handler
    newFeedbackBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Open the feedback modal - it will automatically capture the directory entry context
      const feedbackModal = document.getElementById('feedback-modal');
      if (feedbackModal) {
        // Trigger the feedback system's open method
        // The feedback system checks window.appState.currentDirectoryEntry
        const event = new CustomEvent('openFeedback');
        document.dispatchEvent(event);

        // Fallback: directly manipulate the modal if event doesn't work
        const feedbackButton = document.getElementById('feedback-button');
        if (feedbackButton) {
          feedbackButton.click();
        }
      }
    });
  }

  // Setup runtime-only operations within the modal
  enhanceExternalLinks(content);
  setupDirectoryLinks(content);
  setupMapLinks(content);

  // Show overlay
  overlay.hidden = false;

  // Trap focus in modal
  trapFocus(overlay);
}

// Hide directory overlay
function hideDirectoryOverlay() {
  const overlay = document.getElementById('directory-overlay');
  overlay.hidden = true;

  // Clear current directory entry
  state.currentDirectoryEntry = null;
}

// Trap focus within an element (for accessibility)
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  // Focus first element
  if (firstFocusable) {
    firstFocusable.focus();
  }

  // Trap focus
  function handleTabKey(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  element.addEventListener('keydown', handleTabKey);
}

// Setup search
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);

    const query = e.target.value.trim();

    if (query.length === 0) {
      clearSearchResults();
      return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  });

  // Close search results when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      clearSearchResults();
    }
  });

  // Keep results open when clicking inside search input
  searchInput.addEventListener('click', (e) => {
    e.stopPropagation();
    if (searchInput.value.trim().length >= 2) {
      performSearch(searchInput.value);
    }
  });
}

// Normalize text for search
function normalizeForSearch(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'")    // Curly single quotes to straight
    .replace(/[\u201C\u201D]/g, '"')     // Curly double quotes to straight
    .replace(/[\u2013\u2014]/g, '-')     // En/em dash to hyphen
    .toLowerCase();
}

// Perform search
function performSearch(query) {
  const normalizedQuery = normalizeForSearch(query);

  // Split query into terms
  const queryTerms = normalizedQuery.split(/\s+/).filter(term => term.length > 0);

  // Filter out common stop words for term matching
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were']);
  const significantTerms = queryTerms.filter(term => !stopWords.has(term));

  const results = [];

  state.searchIndex.forEach(item => {
    let score = 0;
    const normalizedTitle = normalizeForSearch(item.title);
    const normalizedContent = normalizeForSearch(item.content);

    // Exact title match (highest priority)
    if (normalizedTitle === normalizedQuery) {
      score += 100;
    }

    // Title contains query
    if (normalizedTitle.includes(normalizedQuery)) {
      score += 50;
    }

    // Title contains terms
    significantTerms.forEach(term => {
      if (normalizedTitle.includes(term)) {
        score += 10;
      }
    });

    // Content contains full query phrase
    const phraseMatches = (normalizedContent.match(new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    score += phraseMatches * 5;

    // Content contains terms
    significantTerms.forEach(term => {
      const termMatches = (normalizedContent.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += termMatches;
    });

    if (score > 0) {
      results.push({
        item,
        score,
        snippet: extractSnippet(item.content, normalizedQuery, significantTerms)
      });
    }
  });

  // Sort by score
  results.sort((a, b) => b.score - a.score);

  // Display results
  displaySearchResults(results, query);

  // Announce to screen readers
  if (results.length > 0) {
    announce(`Found ${results.length} result${results.length === 1 ? '' : 's'} for ${query}`);
  } else {
    announce(`No results found for ${query}`);
  }
}

// Extract snippet around query match
function extractSnippet(content, query, queryTerms) {
  const normalizedContent = normalizeForSearch(content);

  // Try to find query phrase first
  let matchIndex = normalizedContent.indexOf(query);

  // If no phrase match, find first term match
  if (matchIndex === -1 && queryTerms.length > 0) {
    for (const term of queryTerms) {
      matchIndex = normalizedContent.indexOf(term);
      if (matchIndex !== -1) break;
    }
  }

  // If still no match, take from start
  if (matchIndex === -1) {
    matchIndex = 0;
  }

  // Extract context (150 chars before and after)
  const snippetStart = Math.max(0, matchIndex - 75);
  const snippetEnd = Math.min(content.length, matchIndex + 75);

  let snippet = content.slice(snippetStart, snippetEnd);

  // Add ellipsis
  if (snippetStart > 0) snippet = '...' + snippet;
  if (snippetEnd < content.length) snippet = snippet + '...';

  return snippet;
}

// Display search results
function displaySearchResults(results, query) {
  const resultsContainer = document.getElementById('search-results');

  if (results.length === 0) {
    showNoResults(query);
    return;
  }

  resultsContainer.innerHTML = '';
  resultsContainer.hidden = false;

  results.forEach(({ item, snippet }) => {
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';

    const title = document.createElement('div');
    title.className = 'search-result-title';
    title.textContent = item.title;

    const snippetEl = document.createElement('div');
    snippetEl.className = 'search-result-snippet';
    snippetEl.textContent = snippet;

    const type = document.createElement('div');
    type.className = 'search-result-type';
    type.textContent = item.type === 'directory' ? 'Directory' : 'Resource Guide';

    resultItem.appendChild(title);
    resultItem.appendChild(snippetEl);
    resultItem.appendChild(type);

    // Click handler
    resultItem.addEventListener('click', () => {
      if (item.type === 'directory') {
        showDirectoryEntry(item.id);
      } else {
        navigateToResourceSection(item.id);
      }
      clearSearchResults();
      document.getElementById('search-input').value = '';
    });

    resultsContainer.appendChild(resultItem);
  });
}

// Navigate to resource section
function navigateToResourceSection(anchorId) {
  // Switch to resources section if not already there
  if (state.currentSection !== 'resources') {
    navigateToSection('resources');
  }

  // Scroll to anchor after a brief delay to ensure section is rendered
  setTimeout(() => {
    const anchor = document.getElementById(anchorId);
    if (anchor) {
      anchor.scrollIntoView({ behavior: 'smooth' });

      // Update URL with anchor
      const url = new URL(window.location);
      url.hash = anchorId;
      history.replaceState(history.state, '', url);
    }
  }, 100);
}

// Clear search results
function clearSearchResults() {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';
  resultsContainer.hidden = true;
}

// Show no results message
function showNoResults(query) {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = `
    <div class="search-no-results">
      No results found for "${query}"
    </div>
  `;
  resultsContainer.hidden = false;
}

// Show error message
function showError(message) {
  console.error(message);
  // Could show a toast/notification here
}

// Save scroll position for current section
function saveScrollPosition() {
  state.scrollPositions[state.currentSection] = window.scrollY;
}

// Save state to localStorage
function saveState() {
  try {
    const stateToSave = {
      currentSection: state.currentSection,
      scrollPositions: state.scrollPositions
    };
    localStorage.setItem('appState', JSON.stringify(stateToSave));
  } catch (e) {
    // Ignore errors
  }
}

// Restore state from localStorage
function restoreState() {
  try {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.currentSection) {
        state.currentSection = parsed.currentSection;
      }
      if (parsed.scrollPositions) {
        state.scrollPositions = parsed.scrollPositions;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  // Check URL for section override
  const urlParams = new URLSearchParams(window.location.search);
  const urlSection = urlParams.get('section');
  if (urlSection && ['resources', 'directory', 'about'].includes(urlSection)) {
    state.currentSection = urlSection;
  }
}

// Update last modified date
function updateLastModifiedDate() {
  const dateElement = document.getElementById('last-modified-date');
  if (dateElement) {
    const lastModified = new Date(document.lastModified);
    dateElement.textContent = lastModified.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Start the app
init();
