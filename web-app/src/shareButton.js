/**
 * Share Button - Allows users to share the resource guide
 * Uses Web Share API where available, with fallback to copy link
 */

import { getStrings } from './strings.js';

// UI Strings
const strings = getStrings();

/**
 * Initialize share button functionality
 */
export function initShareButton() {
  const shareBtn = document.getElementById('share-btn');
  if (!shareBtn) return;

  shareBtn.addEventListener('click', handleShare);
}

/**
 * Handle share button click
 * Always shares the home page URL (since we have section-specific share buttons)
 */
async function handleShare() {
  // Always share the home page URL
  const homeUrl = `${window.location.origin}${window.location.pathname}`;

  const shareData = {
    title: strings.share.main.title,
    text: strings.share.main.text,
    url: homeUrl
  };

  // Try Web Share API first (mobile-friendly)
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      console.log('Shared successfully');
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        fallbackCopyLink(homeUrl);
      }
    }
  } else {
    // Fallback: copy link to clipboard
    fallbackCopyLink(homeUrl);
  }
}

/**
 * Fallback: Copy link to clipboard and show notification
 */
function fallbackCopyLink(url) {
  // Use provided URL or fall back to current page URL
  const urlToCopy = url || window.location.href;

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(urlToCopy)
      .then(() => {
        showNotification(strings.share.notifications.linkCopied);
      })
      .catch(err => {
        console.error('Clipboard write failed:', err);
        showNotification(strings.share.notifications.copyFailed);
      });
  } else {
    // Very old fallback: create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = urlToCopy;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showNotification(strings.share.notifications.linkCopied);
    } catch (err) {
      console.error('Copy failed:', err);
      showNotification(strings.share.notifications.copyFailed);
    }

    document.body.removeChild(textarea);
  }
}

/**
 * Show a temporary notification
 */
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

/**
 * Create and return a share button for a specific section
 */
export function createSectionShareButton(sectionTitle, sectionUrl) {
  const button = document.createElement('button');
  button.className = 'section-share-btn';
  button.innerHTML = '🔗';
  button.setAttribute('aria-label', strings.share.section.buttonAriaLabel(sectionTitle));
  button.setAttribute('title', strings.share.section.buttonTitle);

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: strings.share.section.title(sectionTitle),
      text: strings.share.section.text(sectionTitle),
      url: sectionUrl || `${window.location.origin}${window.location.pathname}#${sectionTitle.toLowerCase().replace(/\s+/g, '-')}`
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          fallbackCopyLink();
        }
      }
    } else {
      // Copy section link
      const url = shareData.url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            showNotification(strings.share.notifications.sectionLinkCopied);
          })
          .catch(() => {
            showNotification(strings.share.notifications.copyFailedShort);
          });
      }
    }
  });

  return button;
}

/**
 * Create and return a share button for a specific directory entry
 */
export function createDirectoryShareButton(entryTitle, entryId) {
  const button = document.createElement('button');
  button.className = 'directory-share-btn';
  button.innerHTML = '🔗';
  button.setAttribute('aria-label', strings.share.directoryEntry.buttonAriaLabel(entryTitle));
  button.setAttribute('title', strings.share.directoryEntry.buttonTitle);

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Create URL with section=directory and anchor to the entry
    const url = `${window.location.origin}${window.location.pathname}?section=directory#${entryId}`;

    const shareData = {
      title: strings.share.directoryEntry.title(entryTitle),
      text: strings.share.directoryEntry.text(entryTitle),
      url: url
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          fallbackCopyLink();
        }
      }
    } else {
      // Copy directory entry link
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            showNotification(strings.share.notifications.entryLinkCopied);
          })
          .catch(() => {
            showNotification(strings.share.notifications.copyFailedShort);
          });
      }
    }
  });

  return button;
}

