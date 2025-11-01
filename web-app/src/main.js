import './style.css';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { enhanceLinks } from './linkEnhancer.js';
import { parseMarkdown, extractDirectoryEntries } from './markdownParser.js';
import { initFeedback } from './feedback.js';
import { initShareButton, createSectionShareButton, createDirectoryShareButton } from './shareButton.js';
import { getStrings } from './strings.js';

// Import markdown files directly as raw text
import resourcesMarkdown from '../../Resource guide.md?raw';
import directoryMarkdown from '../../Directory.md?raw';

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
  resourcesContent: '',
  directoryContent: '',
  directoryEntries: new Map(),
  searchIndex: [],
  currentDirectoryEntry: null
};

// Make state accessible globally for feedback system
window.appState = state;

// Initialize the app
async function init() {
  setupNavigation();
  setupSearch();
  setupDirectoryOverlay();

  // Initialize feedback system
  initFeedback();

  // Initialize share button
  initShareButton();

  // Load content
  await loadMarkdownContent();

  // Restore previous state if exists
  restoreState();

  // Show initial section
  showSection(state.currentSection);

  // Update last modified date
  updateLastModifiedDate();
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

  // Handle browser back/forward
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.section) {
      showSection(e.state.section, false);
    }
  });
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

  // Announce section change to screen readers
  const sectionName = strings.sections[section] || section;
  announce(`${sectionName} ${strings.sections.loaded}`);

  // Update state
  state.currentSection = section;

  if (updateHistory) {
    const url = new URL(window.location);
    url.searchParams.set('section', section);
    history.replaceState({ section }, '', url);
  }
}

// Load markdown content from imported files
async function loadMarkdownContent() {
  try {
    // Use imported markdown content
    state.resourcesContent = resourcesMarkdown;
    state.directoryContent = directoryMarkdown;

    // Parse and extract directory entries
    state.directoryEntries = extractDirectoryEntries(directoryMarkdown);

    // Render content
    renderResources();
    renderDirectory();

    // Build search index
    buildSearchIndex();

  } catch (error) {
    console.error('Error loading content:', error);
    showError(strings.errors.loadContent);
  }
}

// Render resources section
function renderResources() {
  const section = document.getElementById('resources-section');

  console.log('=== Rendering Resources ===');

  // Parse markdown and enhance with directory links
  let html = parseMarkdown(state.resourcesContent, state.directoryEntries);

  console.log('After parseMarkdown, checking for data-directory-link...');
  const tempCheck = document.createElement('div');
  tempCheck.innerHTML = html;
  const linksBeforeSanitize = tempCheck.querySelectorAll('[data-directory-link]');
  console.log('Links with data-directory-link before sanitize:', linksBeforeSanitize.length);

  // Sanitize HTML - configure DOMPurify to keep data attributes
  html = DOMPurify.sanitize(html, {
    ADD_ATTR: ['data-directory-link']
  });

  console.log('After DOMPurify, checking for data-directory-link...');
  tempCheck.innerHTML = html;
  const linksAfterSanitize = tempCheck.querySelectorAll('[data-directory-link]');
  console.log('Links with data-directory-link after sanitize:', linksAfterSanitize.length);

  section.innerHTML = html;

  // Enhance all links (phone, email, external)
  enhanceLinks(section);

  // Setup directory link handlers
  setupDirectoryLinks(section);

  // Add share buttons to section headings
  addSectionShareButtons(section);
}

// Render directory section
function renderDirectory() {
  const section = document.getElementById('directory-section');

  // Parse markdown
  let html = marked.parse(state.directoryContent);

  // Sanitize HTML
  html = DOMPurify.sanitize(html);

  section.innerHTML = html;

  // Enhance all links
  enhanceLinks(section);

  // Add share buttons to directory section headings
  addSectionShareButtons(section, 'directory');
}

// Setup directory link click handlers
function setupDirectoryLinks(container) {
  const directoryLinks = container.querySelectorAll('[data-directory-link]');

  console.log(`Setting up ${directoryLinks.length} directory links`);

  directoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const entryId = link.dataset.directoryLink;
      console.log('Directory link clicked:', entryId);
      showDirectoryEntry(entryId);
    });
  });
}

// Add share buttons to section headings
function addSectionShareButtons(container, sectionName = 'resources') {
  // Find all h2 and h3 headings with anchor IDs
  const headings = container.querySelectorAll('h2, h3');

  headings.forEach(heading => {
    // Look for anchor element inside heading
    const anchor = heading.querySelector('a[id]');
    if (!anchor) return;

    const anchorId = anchor.getAttribute('id');
    const sectionTitle = anchor.textContent.trim();

    // Create URL for this section
    const sectionUrl = `${window.location.origin}${window.location.pathname}?section=${sectionName}#${anchorId}`;

    // Create and add share button
    const shareBtn = createSectionShareButton(sectionTitle, sectionUrl);

    // Add the button before the heading text
    heading.style.position = 'relative';
    heading.style.display = 'flex';
    heading.style.alignItems = 'baseline';
    heading.style.gap = '0.5rem';

    // Make the anchor flexible so its text can wrap
    if (anchor) {
      anchor.style.flex = '1';
      anchor.style.minWidth = '0';
    }

    heading.insertBefore(shareBtn, heading.firstChild);
  });
}

// Setup directory overlay
function setupDirectoryOverlay() {
  const overlay = document.getElementById('directory-overlay');
  const closeBtn = overlay.querySelector('.close-btn');
  const feedbackBtn = overlay.querySelector('.directory-feedback-btn');

  // Close on button click
  closeBtn.addEventListener('click', hideDirectoryOverlay);

  // Feedback button click
  feedbackBtn.addEventListener('click', () => {
    // Trigger feedback modal (the feedback system will handle opening it)
    const feedbackButton = document.getElementById('feedback-button');
    if (feedbackButton) {
      feedbackButton.click();
    }
  });

  // Close on overlay click (outside modal)
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

// Show a specific directory entry in overlay
function showDirectoryEntry(entryId) {
  console.log('showDirectoryEntry called with:', entryId);
  const entry = state.directoryEntries.get(entryId);

  if (!entry) {
    console.error('Directory entry not found:', entryId);
    console.log('Available entries:', Array.from(state.directoryEntries.keys()));
    return;
  }

  console.log('Found entry:', entry.title);

  // Store current directory entry for feedback context
  state.currentDirectoryEntry = {
    id: entryId,
    title: entry.title
  };

  const overlay = document.getElementById('directory-overlay');
  const content = overlay.querySelector('.directory-content');

  // Parse entry content with directory link conversion
  let html = parseMarkdown(entry.content, state.directoryEntries);

  // Sanitize HTML - preserve data attributes
  html = DOMPurify.sanitize(html, {
    ADD_ATTR: ['data-directory-link']
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

  // Enhance links in the modal (phone, email, external)
  enhanceLinks(content);

  // Setup directory link handlers within the modal
  setupDirectoryLinks(content);

  // Show overlay
  overlay.hidden = false;
  console.log('Directory overlay shown');

  // Trap focus in modal
  trapFocus(overlay);
}

// Hide directory overlay
function hideDirectoryOverlay() {
  const overlay = document.getElementById('directory-overlay');
  overlay.hidden = true;

  // Clear current directory entry from state
  state.currentDirectoryEntry = null;
}

// Trap focus within modal for accessibility
function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Focus first element
  firstElement.focus();

  // Trap focus
  element.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let searchTimeout;

  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(e.target.value);
    }, 300); // Debounce search
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

// Build search index
function buildSearchIndex() {
  state.searchIndex = [];

  // Index directory entries
  state.directoryEntries.forEach((entry, id) => {
    state.searchIndex.push({
      id,
      title: entry.title,
      content: entry.content.toLowerCase(),
      type: 'directory'
    });
  });

  // Index resources by section
  indexResourceSections();
}

// Extract and index individual sections from Resource Guide
function indexResourceSections() {
  const markdown = state.resourcesContent;

  // Find all h1, h2, and h3 headings with anchor IDs
  // Format: # <a id="section-id">Section Name</a>
  // or:     ## <a id="section-id">Section Name</a>
  // or:     ### <a id="section-id">Section Name</a>
  const sectionRegex = /^(#{1,3})\s*<a\s+id="([^"]+)"[^>]*>([^<]+)<\/a>/gm;

  let match;
  const sections = [];

  // Find all section positions
  while ((match = sectionRegex.exec(markdown)) !== null) {
    const level = match[1].length; // 1 for h1, 2 for h2, 3 for h3
    sections.push({
      level: level,
      id: match[2],
      title: match[3].trim(),
      start: match.index,
      headerEnd: match.index + match[0].length
    });
  }

  // Extract content for each section
  sections.forEach((section, index) => {
    const nextSection = sections[index + 1];
    const maxEnd = nextSection ? nextSection.start : markdown.length;

    // Get content up to next section of same or higher level
    let nextSameOrHigher = nextSection;
    for (let i = index + 1; i < sections.length; i++) {
      if (sections[i].level <= section.level) {
        nextSameOrHigher = sections[i];
        break;
      }
    }

    const contentEnd = nextSameOrHigher ? nextSameOrHigher.start : markdown.length;
    const content = markdown.slice(section.headerEnd, contentEnd);

    // Convert to text for searching
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(marked.parse(content));
    const contentText = tempDiv.textContent.toLowerCase();

    state.searchIndex.push({
      id: section.id,
      title: section.title,
      content: contentText,
      type: 'resource-section',
      level: section.level
    });
  });
}

// Common stop words to ignore in search
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with'
]);

// Perform search
function performSearch(query) {
  const searchInput = document.getElementById('search-input');

  if (!query || query.length < 2) {
    clearSearchResults();
    return;
  }

  query = query.toLowerCase();
  const queryTerms = query.split(/\s+/).filter(t => t.length > 0);

  // Filter out stop words for term matching, but keep them for phrase matching
  const significantTerms = queryTerms.filter(term => !STOP_WORDS.has(term));

  // Search and score results
  const results = state.searchIndex
    .map(item => {
      const titleLower = item.title.toLowerCase();
      const contentLower = item.content;

      // Calculate relevance score
      let score = 0;

      // Exact phrase match in title is highest priority
      if (titleLower === query) {
        score += 100;
      } else if (titleLower.includes(query)) {
        score += 50;
      }

      // Significant term matches in title
      significantTerms.forEach(term => {
        if (titleLower.includes(term)) {
          score += 10;
        }
      });

      // Exact phrase matches in content (higher weight)
      const phraseMatches = (contentLower.match(new RegExp(query, 'gi')) || []).length;
      score += phraseMatches * 5;

      // Individual significant term matches in content (lower weight)
      significantTerms.forEach(term => {
        const termMatches = (contentLower.match(new RegExp(`\\b${term}\\b`, 'gi')) || []).length;
        score += termMatches;
      });

      // Extract context snippet
      const snippet = extractSnippet(contentLower, query, queryTerms);

      if (score > 0) {
        return {
          ...item,
          score,
          snippet
        };
      }
      return null;
    })
    .filter(result => result !== null)
    .sort((a, b) => b.score - a.score);

  // Update aria-expanded before displaying results
  if (searchInput) {
    searchInput.setAttribute('aria-expanded', 'true');
  }

  displaySearchResults(results, query);

  // Announce results to screen readers
  const resultCount = results.length;
  if (resultCount === 0) {
    announce(`${strings.search.noResults} ${query}`);
  } else {
    announce(`${strings.search.resultCount(resultCount)} ${strings.search.resultsFor(query)}`);
  }
}

// Clean markdown syntax from text for display
function cleanMarkdown(text) {
  return text
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove markdown links but keep link text: [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown image syntax: ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove bold/italic: **text** or *text* -> text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove headers: ## text -> text
    .replace(/^#{1,6}\s+/gm, '')
    // Remove blockquote markers
    .replace(/^>\s+/gm, '')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract context snippet around search query
function extractSnippet(content, query, queryTerms) {
  const snippetLength = 150;

  // Clean the content first
  const cleanedContent = cleanMarkdown(content);
  const cleanedQuery = query.toLowerCase();

  const queryIndex = cleanedContent.toLowerCase().indexOf(cleanedQuery);

  if (queryIndex !== -1) {
    // Found exact query match
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(cleanedContent.length, queryIndex + query.length + 100);
    let snippet = cleanedContent.slice(start, end);

    // Trim to word boundaries
    if (start > 0) {
      const spaceIndex = snippet.indexOf(' ');
      if (spaceIndex !== -1) {
        snippet = '...' + snippet.slice(spaceIndex + 1);
      }
    }
    if (end < cleanedContent.length) {
      const lastSpaceIndex = snippet.lastIndexOf(' ');
      if (lastSpaceIndex !== -1) {
        snippet = snippet.slice(0, lastSpaceIndex) + '...';
      }
    }

    return snippet;
  }

  // Try to find first significant query term
  const significantTerms = queryTerms.filter(term => !STOP_WORDS.has(term));
  if (significantTerms.length > 0) {
    for (const term of significantTerms) {
      const termIndex = cleanedContent.toLowerCase().indexOf(term);
      if (termIndex !== -1) {
        const start = Math.max(0, termIndex - 50);
        const end = Math.min(cleanedContent.length, termIndex + snippetLength);
        let snippet = cleanedContent.slice(start, end);

        if (start > 0) {
          const spaceIndex = snippet.indexOf(' ');
          if (spaceIndex !== -1) {
            snippet = '...' + snippet.slice(spaceIndex + 1);
          }
        }
        if (end < cleanedContent.length) {
          const lastSpaceIndex = snippet.lastIndexOf(' ');
          if (lastSpaceIndex !== -1) {
            snippet = snippet.slice(0, lastSpaceIndex) + '...';
          }
        }

        return snippet;
      }
    }
  }

  // Fallback: return beginning of content
  let snippet = cleanedContent.slice(0, snippetLength);
  if (cleanedContent.length > snippetLength) {
    const lastSpaceIndex = snippet.lastIndexOf(' ');
    if (lastSpaceIndex !== -1) {
      snippet = snippet.slice(0, lastSpaceIndex) + '...';
    }
  }
  return snippet;
}

// Highlight query terms in text
function highlightMatches(text, query) {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const significantTerms = queryTerms.filter(term => !STOP_WORDS.has(term));
  let highlightedText = text;

  // Try to highlight the full query phrase first (if it appears)
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const phraseRegex = new RegExp(`(${escapedQuery})`, 'gi');
  highlightedText = highlightedText.replace(phraseRegex, '<mark>$1</mark>');

  // Then highlight significant individual terms if they're not already highlighted
  significantTerms.forEach(term => {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`(?<!<mark>)(\\b${escapedTerm}\\b)(?![^<]*</mark>)`, 'gi');
    highlightedText = highlightedText.replace(termRegex, '<mark>$1</mark>');
  });

  return highlightedText;
}

// Display search results
function displaySearchResults(results, query) {
  const searchResultsEl = document.getElementById('search-results');

  if (results.length === 0) {
    showNoResults(query);
    return;
  }

  // Build results HTML
  let html = `<div class="search-results-header">${strings.search.found(results.length)}</div>`;

  results.forEach(result => {
    let typeLabel;
    if (result.type === 'directory') {
      typeLabel = strings.search.directoryEntry;
    } else if (result.type === 'resource-section') {
      if (result.level === 1) {
        typeLabel = strings.search.resourceGuide;
      } else if (result.level === 2) {
        typeLabel = strings.search.resourceSection;
      } else if (result.level === 3) {
        typeLabel = strings.search.resourceSubsection;
      } else {
        typeLabel = strings.search.resourceGuide;
      }
    } else {
      typeLabel = strings.search.resourceGuide;
    }

    const highlightedSnippet = highlightMatches(result.snippet, query);

    html += `
      <div class="search-result-item" role="option" data-result-type="${result.type}" data-result-id="${result.id}">
        <div class="search-result-title">${result.title}</div>
        <div class="search-result-type">${typeLabel}</div>
        <div class="search-result-snippet">${highlightedSnippet}</div>
      </div>
    `;
  });

  searchResultsEl.innerHTML = html;
  searchResultsEl.hidden = false;

  // Add click handlers
  searchResultsEl.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.resultType;
      const id = item.dataset.resultId;

      if (type === 'directory') {
        showDirectoryEntry(id);
      } else if (type === 'resource-section') {
        navigateToResourceSection(id);
      } else {
        navigateToSection('resources');
      }

      clearSearchResults();
    });
  });
}

// Navigate to a specific section within Resources
function navigateToResourceSection(anchorId) {
  console.log('Navigating to resource section:', anchorId);

  // Save current scroll position
  saveScrollPosition();

  // Update state
  state.currentSection = 'resources';

  // Update URL with section fragment
  const url = new URL(window.location);
  url.searchParams.set('section', 'resources');
  url.hash = anchorId;
  history.pushState({ section: 'resources', anchor: anchorId }, '', url);

  // Show resources section
  showSection('resources', false);

  // Save state
  saveState();

  // Wait for render to complete, then scroll to anchor
  requestAnimationFrame(() => {
    setTimeout(() => {
      // Try to find the anchor element
      const anchor = document.getElementById(anchorId);
      console.log('Looking for anchor:', anchorId, 'Found:', anchor);

      if (anchor) {
        // Get the anchor's position
        const rect = anchor.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = rect.top + scrollTop - 90; // Adjust for header (80px + buffer)

        console.log('Scrolling to position:', targetY);

        // Smooth scroll to position
        window.scrollTo({
          top: targetY,
          behavior: 'smooth'
        });
      } else {
        console.warn('Anchor not found:', anchorId);
        // Fallback: try to scroll to top of resources
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 150);
  });
}

// Clear search results
function clearSearchResults() {
  const searchResultsEl = document.getElementById('search-results');
  const searchInput = document.getElementById('search-input');

  searchResultsEl.hidden = true;
  searchResultsEl.innerHTML = '';

  // Reset aria-expanded on search input
  if (searchInput) {
    searchInput.setAttribute('aria-expanded', 'false');
  }
}

// Show no results message
function showNoResults(query) {
  const searchResultsEl = document.getElementById('search-results');
  searchResultsEl.innerHTML = `
    <div class="search-no-results">
      ${strings.search.noResults} "<strong>${query}</strong>"
    </div>
  `;
  searchResultsEl.hidden = false;
}

// Show error message
function showError(message) {
  const sections = document.querySelectorAll('.content-section');
  sections.forEach(section => {
    section.innerHTML = `<div class="error">${message}</div>`;
  });
}

// Save current scroll position
function saveScrollPosition() {
  state.scrollPositions[state.currentSection] = window.scrollY;
}

// Save state to localStorage
function saveState() {
  try {
    localStorage.setItem('appState', JSON.stringify({
      currentSection: state.currentSection,
      scrollPositions: state.scrollPositions
    }));
  } catch (error) {
    console.error('Error saving state:', error);
  }
}

// Restore state from localStorage
function restoreState() {
  try {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      state.currentSection = parsed.currentSection || 'resources';
      state.scrollPositions = parsed.scrollPositions || {};
    }

    // Check URL for section parameter
    const params = new URLSearchParams(window.location.search);
    const urlSection = params.get('section');
    if (urlSection) {
      state.currentSection = urlSection;
    }
  } catch (error) {
    console.error('Error restoring state:', error);
  }
}

// Update last modified date
function updateLastModifiedDate() {
  const dateElement = document.getElementById('last-update-date');
  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Start the app
init();
