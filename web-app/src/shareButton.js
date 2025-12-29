/**
 * Share Button - Allows users to share the resource guide
 * Uses Web Share API where available, with fallback to copy link
 */

import { getStrings } from './strings.js';
import QrCreator from 'qr-creator';

// UI Strings
const strings = getStrings();

// Store the last copied URL for QR code generation
let lastCopiedUrl = null;

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
      // After successful share, show QR code option
      showNotification(strings.share.notifications.shareComplete, homeUrl);
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

  // Store URL for QR code generation
  lastCopiedUrl = urlToCopy;

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(urlToCopy)
      .then(() => {
        showNotification(strings.share.notifications.linkCopied, urlToCopy);
      })
      .catch(err => {
        console.error('Clipboard write failed:', err);
        showNotification(strings.share.notifications.copyFailed, null);
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
      showNotification(strings.share.notifications.linkCopied, urlToCopy);
    } catch (err) {
      console.error('Copy failed:', err);
      showNotification(strings.share.notifications.copyFailed, null);
    }

    document.body.removeChild(textarea);
  }
}

/**
 * Show a temporary notification with optional QR code button
 * @param {string} message - The notification message to display
 * @param {string|null} url - Optional URL to generate QR code for
 */
export function showNotification(message, url = null) {
  // Remove any existing notification
  const existing = document.getElementById('share-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'share-notification';
  notification.className = 'share-notification';
  notification.setAttribute('role', 'status');
  notification.setAttribute('aria-live', 'polite');

  // Create message text
  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;
  notification.appendChild(messageSpan);

  // Add QR code button if URL is provided
  if (url) {
    const qrButton = document.createElement('button');
    qrButton.className = 'qr-code-btn';
    qrButton.textContent = strings.share.notifications.viewQrCode;
    qrButton.setAttribute('aria-label', strings.share.notifications.viewQrCode);
    qrButton.addEventListener('click', (e) => {
      e.stopPropagation();
      showQrCodeModal(url);
    });
    notification.appendChild(qrButton);
  }

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
        // After successful share, show QR code option
        showNotification(strings.share.notifications.shareComplete, shareData.url);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          fallbackCopyLink(shareData.url);
        }
      }
    } else {
      // Copy section link
      const url = shareData.url;
      lastCopiedUrl = url;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
          .then(() => {
            showNotification(strings.share.notifications.sectionLinkCopied, url);
          })
          .catch(() => {
            showNotification(strings.share.notifications.copyFailedShort, null);
          });
      }
    }
  });

  return button;
}

/**
 * Show QR code modal with the given URL
 * @param {string} url - The URL to generate QR code for
 */
function showQrCodeModal(url) {
  // Remove any existing QR modal
  const existing = document.getElementById('qr-code-modal');
  if (existing) {
    existing.remove();
  }

  // Create modal overlay
  const modal = document.createElement('div');
  modal.id = 'qr-code-modal';
  modal.className = 'qr-modal-overlay';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'qr-modal-title');

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.className = 'qr-modal-content';

  // Create header
  const header = document.createElement('div');
  header.className = 'qr-modal-header';

  const title = document.createElement('h2');
  title.id = 'qr-modal-title';
  title.textContent = strings.share.qrModal.title;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'qr-modal-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', strings.share.qrModal.closeAriaLabel);
  closeBtn.addEventListener('click', hideQrCodeModal);

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Create QR code container
  const qrContainer = document.createElement('div');
  qrContainer.className = 'qr-code-container';
  qrContainer.id = 'qr-code-container';

  // Create link display
  const linkDisplay = document.createElement('div');
  linkDisplay.className = 'qr-link-display';

  const linkLabel = document.createElement('strong');
  linkLabel.textContent = strings.share.qrModal.linkLabel;

  const linkText = document.createElement('div');
  linkText.className = 'qr-link-text';
  linkText.textContent = url;

  linkDisplay.appendChild(linkLabel);
  linkDisplay.appendChild(linkText);

  // Create download button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'qr-download-btn';
  downloadBtn.textContent = strings.share.qrModal.download;
  downloadBtn.addEventListener('click', () => downloadQrCode(url));

  // Assemble modal
  modalContent.appendChild(header);
  modalContent.appendChild(qrContainer);
  modalContent.appendChild(linkDisplay);
  modalContent.appendChild(downloadBtn);
  modal.appendChild(modalContent);

  // Add to DOM
  document.body.appendChild(modal);

  // Generate QR code
  try {
    QrCreator.render({
      text: url,
      radius: 0.5,
      ecLevel: 'H',
      fill: '#000000',
      background: '#ffffff',
      size: 256
    }, qrContainer);
  } catch (err) {
    console.error('QR code generation failed:', err);
    qrContainer.innerHTML = '<p>Unable to generate QR code</p>';
  }

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideQrCodeModal();
    }
  });

  // Close on Escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      hideQrCodeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  };
  document.addEventListener('keydown', escapeHandler);

  // Trigger animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
}

/**
 * Hide QR code modal
 */
function hideQrCodeModal() {
  const modal = document.getElementById('qr-code-modal');
  if (!modal) return;

  modal.classList.remove('show');
  setTimeout(() => {
    modal.remove();
  }, 300);
}

/**
 * Download QR code as image
 * @param {string} url - The URL used to generate the QR code
 */
function downloadQrCode(url) {
  const container = document.getElementById('qr-code-container');
  if (!container) return;

  // Find the canvas element created by QrCreator
  const canvas = container.querySelector('canvas');
  if (!canvas) return;

  try {
    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.download = 'qr-code.png';
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  } catch (err) {
    console.error('QR code download failed:', err);
  }
}

