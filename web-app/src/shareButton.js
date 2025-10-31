/**
 * Share Button - Allows users to share the resource guide
 * Uses Web Share API where available, with fallback to copy link
 */

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
 */
async function handleShare() {
  const shareData = {
    title: 'SLO County Homeless Resource Guide',
    text: 'Comprehensive resource guide for people experiencing homelessness in San Luis Obispo County',
    url: window.location.href
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
        fallbackCopyLink();
      }
    }
  } else {
    // Fallback: copy link to clipboard
    fallbackCopyLink();
  }
}

/**
 * Fallback: Copy link to clipboard and show notification
 */
function fallbackCopyLink() {
  const url = window.location.href;

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => {
        showNotification('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Clipboard write failed:', err);
        showNotification('Unable to copy link. Please copy manually from address bar.');
      });
  } else {
    // Very old fallback: create temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      showNotification('Link copied to clipboard!');
    } catch (err) {
      console.error('Copy failed:', err);
      showNotification('Unable to copy link. Please copy manually from address bar.');
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
  button.setAttribute('aria-label', `Share ${sectionTitle}`);
  button.setAttribute('title', 'Share this section');

  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: `${sectionTitle} - SLO County Homeless Resource Guide`,
      text: `Check out this resource: ${sectionTitle}`,
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
            showNotification('Section link copied to clipboard!');
          })
          .catch(() => {
            showNotification('Unable to copy link.');
          });
      }
    }
  });

  return button;
}
