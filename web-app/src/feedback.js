// Feedback system for capturing user feedback with context
export class FeedbackSystem {
  constructor() {
    this.feedbackButton = null;
    this.feedbackModal = null;
    this.recipientEmail = 'moorlock@gmail.com';
  }

  // Initialize the feedback system
  init() {
    this.createFeedbackButton();
    this.createFeedbackModal();
    this.setupEventListeners();
  }

  // Create floating feedback button
  createFeedbackButton() {
    this.feedbackButton = document.createElement('button');
    this.feedbackButton.id = 'feedback-button';
    this.feedbackButton.className = 'feedback-fab';
    this.feedbackButton.innerHTML = '💬';
    this.feedbackButton.setAttribute('aria-label', 'Send feedback');
    this.feedbackButton.title = 'Send feedback';
    document.body.appendChild(this.feedbackButton);
  }

  // Create feedback modal
  createFeedbackModal() {
    const modalHTML = `
      <div id="feedback-modal" class="feedback-modal" hidden>
        <div class="feedback-modal-content">
          <button class="feedback-close-btn" aria-label="Close feedback form">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h2>Send Feedback</h2>
          <p class="feedback-intro">
            Help us improve this guide by reporting errors, outdated information, or suggesting improvements.
          </p>

          <form id="feedback-form">
            <div class="feedback-form-group">
              <label for="feedback-name">Your Name (optional)</label>
              <input type="text" id="feedback-name" name="name" placeholder="Your name">
            </div>

            <div class="feedback-form-group">
              <label for="feedback-email">Your Email (optional)</label>
              <input type="email"
                     id="feedback-email"
                     name="email"
                     placeholder="your.email@example.com"
                     aria-describedby="email-helper email-error"
                     aria-invalid="false">
              <small id="email-helper">If you'd like a response, please provide your email.</small>
              <span id="email-error" class="error-message" role="alert" hidden></span>
            </div>

            <div class="feedback-form-group">
              <label for="feedback-type">Feedback Type *</label>
              <select id="feedback-type"
                      name="type"
                      required
                      aria-describedby="type-error"
                      aria-invalid="false">
                <option value="">-- Select type --</option>
                <option value="outdated">Outdated Information</option>
                <option value="error">Error or Mistake</option>
                <option value="missing">Missing Information</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other</option>
              </select>
              <span id="type-error" class="error-message" role="alert" hidden></span>
            </div>

            <div class="feedback-form-group">
              <label for="feedback-message">Your Feedback *</label>
              <textarea
                id="feedback-message"
                name="message"
                rows="6"
                required
                placeholder="Please describe the issue or suggestion in detail..."
                aria-describedby="message-error"
                aria-invalid="false"
              ></textarea>
              <span id="message-error" class="error-message" role="alert" hidden></span>
            </div>

            <div class="feedback-context">
              <strong>Context information (automatically included):</strong>
              <ul id="feedback-context-list">
                <li>Current section: <span id="context-section"></span></li>
                <li id="context-directory-item" style="display: none;">Directory entry: <span id="context-directory"></span></li>
                <li>Page URL: <span id="context-url"></span></li>
                <li>Timestamp: <span id="context-timestamp"></span></li>
              </ul>
            </div>

            <div class="feedback-actions">
              <button type="button" class="feedback-btn feedback-btn-secondary" id="feedback-cancel">
                Cancel
              </button>
              <button type="submit" class="feedback-btn feedback-btn-primary">
                Send Feedback
              </button>
            </div>
          </form>

          <div id="feedback-success" class="feedback-success" hidden>
            <p>✅ Thank you for your feedback!</p>
            <p>Your feedback has been submitted successfully. We appreciate your help in improving this guide.</p>
            <button type="button" class="feedback-btn feedback-btn-primary" id="feedback-done">
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);
    this.feedbackModal = document.getElementById('feedback-modal');
  }

  // Setup event listeners
  setupEventListeners() {
    // Open modal
    this.feedbackButton.addEventListener('click', () => {
      this.openFeedbackModal();
    });

    // Close modal
    const closeBtn = this.feedbackModal.querySelector('.feedback-close-btn');
    closeBtn.addEventListener('click', () => {
      this.closeFeedbackModal();
    });

    // Cancel button
    const cancelBtn = document.getElementById('feedback-cancel');
    cancelBtn.addEventListener('click', () => {
      this.closeFeedbackModal();
    });

    // Close on overlay click
    this.feedbackModal.addEventListener('click', (e) => {
      if (e.target === this.feedbackModal) {
        this.closeFeedbackModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.feedbackModal.hidden) {
        this.closeFeedbackModal();
      }
    });

    // Form submission
    const form = document.getElementById('feedback-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate all fields before submission
      const isValid = this.validateForm();
      if (isValid) {
        this.handleSubmit();
      }
    });

    // Add real-time validation on blur
    this.setupFormValidation();

    // Done button (after success)
    const doneBtn = document.getElementById('feedback-done');
    doneBtn.addEventListener('click', () => {
      this.closeFeedbackModal();
    });

    // Handle mobile keyboard: scroll to keep focused input visible
    this.setupMobileKeyboardHandling();
  }

  // Setup mobile keyboard handling
  setupMobileKeyboardHandling() {
    const form = document.getElementById('feedback-form');
    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      // When an input is focused, scroll it into view with some padding
      input.addEventListener('focus', () => {
        // Small delay to allow keyboard to appear
        setTimeout(() => {
          // Scroll the input into view, with extra space at bottom
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }, 300);
      });
    });

    // Also handle when textarea content changes (as user types)
    const textarea = form.querySelector('textarea');
    if (textarea) {
      let scrollTimeout;
      textarea.addEventListener('input', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          // Ensure buttons remain accessible as textarea grows
          const modalContent = this.feedbackModal.querySelector('.feedback-modal-content');
          const actionsDiv = form.querySelector('.feedback-actions');
          if (actionsDiv) {
            const rect = actionsDiv.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // If buttons are below viewport, scroll them into view
            if (rect.bottom > viewportHeight) {
              actionsDiv.scrollIntoView({
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
              });
            }
          }
        }, 100);
      });
    }
  }

  // Setup form validation
  setupFormValidation() {
    const emailInput = document.getElementById('feedback-email');
    const typeSelect = document.getElementById('feedback-type');
    const messageTextarea = document.getElementById('feedback-message');

    // Validate email on blur (only if not empty, since it's optional)
    emailInput.addEventListener('blur', () => {
      const value = emailInput.value.trim();
      if (value) {
        this.validateField(emailInput, 'email');
      } else {
        // Clear any error if field is empty (it's optional)
        this.clearFieldError(emailInput);
      }
    });

    // Clear email error when user starts typing again
    emailInput.addEventListener('input', () => {
      if (emailInput.getAttribute('aria-invalid') === 'true') {
        this.clearFieldError(emailInput);
      }
    });

    // Validate type on change
    typeSelect.addEventListener('change', () => {
      this.validateField(typeSelect, 'type');
    });

    // Validate message on blur
    messageTextarea.addEventListener('blur', () => {
      this.validateField(messageTextarea, 'message');
    });

    // Clear message error when user starts typing again
    messageTextarea.addEventListener('input', () => {
      if (messageTextarea.getAttribute('aria-invalid') === 'true') {
        this.clearFieldError(messageTextarea);
      }
    });
  }

  // Validate a single field
  validateField(field, fieldType) {
    const errorSpan = document.getElementById(`${field.name}-error`);

    if (fieldType === 'email') {
      const value = field.value.trim();
      if (value && !field.validity.valid) {
        field.setAttribute('aria-invalid', 'true');
        errorSpan.textContent = 'Please enter a valid email address';
        errorSpan.hidden = false;
        return false;
      }
    } else if (fieldType === 'type') {
      if (!field.value) {
        field.setAttribute('aria-invalid', 'true');
        errorSpan.textContent = 'Please select a feedback type';
        errorSpan.hidden = false;
        return false;
      }
    } else if (fieldType === 'message') {
      if (!field.value.trim()) {
        field.setAttribute('aria-invalid', 'true');
        errorSpan.textContent = 'Please enter your feedback';
        errorSpan.hidden = false;
        return false;
      }
    }

    // Field is valid
    this.clearFieldError(field);
    return true;
  }

  // Clear field error
  clearFieldError(field) {
    const errorSpan = document.getElementById(`${field.name}-error`);
    field.setAttribute('aria-invalid', 'false');
    errorSpan.textContent = '';
    errorSpan.hidden = true;
  }

  // Validate entire form
  validateForm() {
    const emailInput = document.getElementById('feedback-email');
    const typeSelect = document.getElementById('feedback-type');
    const messageTextarea = document.getElementById('feedback-message');

    let isValid = true;

    // Validate email (only if not empty, since it's optional)
    if (emailInput.value.trim()) {
      if (!this.validateField(emailInput, 'email')) {
        isValid = false;
      }
    }

    // Validate type (required)
    if (!this.validateField(typeSelect, 'type')) {
      isValid = false;
    }

    // Validate message (required)
    if (!this.validateField(messageTextarea, 'message')) {
      isValid = false;
    }

    // Focus first invalid field
    if (!isValid) {
      const firstInvalid = this.feedbackModal.querySelector('[aria-invalid="true"]');
      if (firstInvalid) {
        firstInvalid.focus();
      }
    }

    return isValid;
  }

  // Open feedback modal
  openFeedbackModal() {
    // Capture context
    this.captureContext();

    // Show modal
    this.feedbackModal.hidden = false;

    // Focus first input
    setTimeout(() => {
      const firstInput = this.feedbackModal.querySelector('input, textarea, select');
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  // Close feedback modal
  closeFeedbackModal() {
    this.feedbackModal.hidden = true;

    // Reset form
    const form = document.getElementById('feedback-form');
    form.reset();

    // Clear all validation errors
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.setAttribute('aria-invalid', 'false');
    });

    const errorMessages = form.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
      error.textContent = '';
      error.hidden = true;
    });

    // Hide success message and show form
    document.getElementById('feedback-success').hidden = true;
    form.hidden = false;
  }

  // Find the nearest anchor in or above the viewport
  findNearestAnchor(sectionElement) {
    // Find all anchors with IDs in the current section
    const anchors = Array.from(sectionElement.querySelectorAll('a[id]'));
    if (anchors.length === 0) return null;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const headerHeight = 80; // Account for fixed header

    let nearestAnchor = null;
    let nearestDistance = Infinity;

    for (const anchor of anchors) {
      const rect = anchor.getBoundingClientRect();
      const anchorTop = rect.top + scrollTop;

      // Distance from the top of the viewport (accounting for header)
      const distanceFromViewportTop = rect.top - headerHeight;

      // Prefer anchors in the viewport
      if (rect.top >= headerHeight && rect.top <= viewportHeight) {
        // In viewport - prefer the one closest to the top
        if (distanceFromViewportTop < nearestDistance) {
          nearestDistance = distanceFromViewportTop;
          nearestAnchor = anchor;
        }
      } else if (rect.top < headerHeight) {
        // Above viewport - find the closest one above
        const distanceAbove = Math.abs(distanceFromViewportTop);
        if (!nearestAnchor || rect.top > (nearestAnchor.getBoundingClientRect().top)) {
          // This is below our current best (or we have no best yet)
          nearestAnchor = anchor;
          nearestDistance = distanceAbove;
        }
      }
    }

    return nearestAnchor;
  }

  // Capture current context
  captureContext() {
    // Get current section from URL or state
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section') || 'resources';

    // Check if viewing a directory entry
    const directoryOverlay = document.getElementById('directory-overlay');
    const viewingDirectory = directoryOverlay && !directoryOverlay.hidden;

    let contextSection = section;
    const directoryItem = document.getElementById('context-directory-item');
    const directorySpan = document.getElementById('context-directory');

    let contextUrl;

    if (viewingDirectory && window.appState && window.appState.currentDirectoryEntry) {
      contextSection = 'directory (modal open)';
      directoryItem.style.display = 'list-item';
      directorySpan.textContent = window.appState.currentDirectoryEntry.title;

      // Use the directory entry URL instead of the current page URL
      const entryId = window.appState.currentDirectoryEntry.id;
      contextUrl = `${window.location.origin}${window.location.pathname}?section=directory#${entryId}`;
    } else {
      directoryItem.style.display = 'none';
      directorySpan.textContent = '';

      // Find the nearest visible anchor to determine actual location
      const sectionElement = document.getElementById(`${section}-section`);
      const nearestAnchor = sectionElement ? this.findNearestAnchor(sectionElement) : null;

      if (nearestAnchor && nearestAnchor.id) {
        const anchorId = nearestAnchor.id;
        const anchorText = nearestAnchor.textContent.trim();
        contextUrl = `${window.location.origin}${window.location.pathname}?section=${section}#${anchorId}`;
        contextSection = `${section} (viewing: ${anchorText})`;
      } else {
        contextUrl = `${window.location.origin}${window.location.pathname}?section=${section}`;
      }
    }

    // Update context display
    document.getElementById('context-section').textContent = contextSection;
    document.getElementById('context-url').textContent = contextUrl;
    document.getElementById('context-timestamp').textContent = new Date().toLocaleString();
  }

  // Handle form submission
  async handleSubmit() {
    const form = document.getElementById('feedback-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name') || 'Anonymous';
      const email = formData.get('email') || '';
      const type = formData.get('type');
      const message = formData.get('message');

      // Get context
      const section = document.getElementById('context-section').textContent;
      const url = document.getElementById('context-url').textContent;
      const timestamp = document.getElementById('context-timestamp').textContent;
      const directoryEntry = document.getElementById('context-directory').textContent;

      // Send feedback via API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          type,
          message,
          section,
          url,
          timestamp,
          directoryEntry: directoryEntry || null
        })
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        // Try to parse error message if available
        let errorMessage = 'Failed to submit feedback';
        try {
          const result = await response.json();
          errorMessage = result.error || errorMessage;
        } catch (e) {
          // Response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      // Try to parse success response
      let result;
      try {
        result = await response.json();
      } catch (e) {
        // Response is not JSON, but request was successful
        result = { success: true };
      }

      // Show success message
      form.hidden = true;
      document.getElementById('feedback-success').hidden = false;

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error sending your feedback. Please try again or email us directly at ' + this.recipientEmail);

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Feedback';
    }
  }

}

// Initialize feedback system
export function initFeedback() {
  const feedbackSystem = new FeedbackSystem();
  feedbackSystem.init();
}
