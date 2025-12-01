/**
 * Shared feedback functionality for map pages
 * This module provides consistent feedback handling across all map pages
 */

/**
 * Initialize the feedback system for a map page
 * @param {Object} config - Configuration object
 * @param {string} config.pageName - Name of the page (e.g., "Little Free Libraries Map")
 * @param {string} config.feedbackType - Default feedback type for the page
 */
export function initMapFeedback(config) {
  const feedbackModal = document.getElementById('feedback-modal');
  const feedbackForm = document.getElementById('feedback-form');
  const feedbackText = document.getElementById('feedback-message');
  const feedbackName = document.getElementById('feedback-name');
  const feedbackEmail = document.getElementById('feedback-email');
  const feedbackSubmit = document.getElementById('feedback-submit');
  const feedbackCancel = document.getElementById('feedback-cancel');
  const feedbackSuccess = document.getElementById('feedback-success');
  const feedbackBtn = document.querySelector('.feedback-btn');

  // Open feedback modal
  feedbackBtn.addEventListener('click', () => {
    feedbackModal.classList.add('show');
    feedbackForm.style.display = 'block';
    feedbackSuccess.style.display = 'none';
    feedbackText.focus();
  });

  // Close feedback modal
  function closeFeedbackModal() {
    feedbackModal.classList.remove('show');
    feedbackForm.reset();
    feedbackForm.style.display = 'block';
    feedbackSuccess.style.display = 'none';
  }

  // Cancel button
  feedbackCancel.addEventListener('click', closeFeedbackModal);

  // Close on background click
  feedbackModal.addEventListener('click', (e) => {
    if (e.target === feedbackModal) {
      closeFeedbackModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && feedbackModal.classList.contains('show')) {
      closeFeedbackModal();
    }
  });

  // Handle form submission
  feedbackSubmit.addEventListener('click', async () => {
    const message = feedbackText.value.trim();
    const name = feedbackName.value.trim() || 'Anonymous';
    const email = feedbackEmail.value.trim() || '';

    if (!message) {
      alert('Please enter your feedback before sending.');
      return;
    }

    // Disable submit button
    feedbackSubmit.disabled = true;
    feedbackSubmit.textContent = 'Sending...';

    try {
      // Capture context
      const context = {
        page: config.pageName,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Send feedback via API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          type: config.feedbackType || 'other',
          message,
          section: context.page,
          url: context.url,
          timestamp: context.timestamp,
          directoryEntry: null
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit feedback');
      }

      // Show success message
      feedbackForm.style.display = 'none';
      feedbackSuccess.style.display = 'block';

    } catch (error) {
      console.error('Error sending feedback:', error);
      alert('There was an error sending your feedback. Please try again or email us directly at moorlock@gmail.com');
    } finally {
      // Re-enable submit button
      feedbackSubmit.disabled = false;
      feedbackSubmit.textContent = 'Send Feedback';
    }
  });

  // Close success message
  const doneBtn = document.getElementById('feedback-done');
  if (doneBtn) {
    doneBtn.addEventListener('click', closeFeedbackModal);
  }
}
