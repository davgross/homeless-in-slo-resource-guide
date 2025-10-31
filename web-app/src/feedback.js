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
              <input type="email" id="feedback-email" name="email" placeholder="your.email@example.com">
              <small>If you'd like a response, please provide your email.</small>
            </div>

            <div class="feedback-form-group">
              <label for="feedback-type">Feedback Type</label>
              <select id="feedback-type" name="type" required>
                <option value="">-- Select type --</option>
                <option value="outdated">Outdated Information</option>
                <option value="error">Error or Mistake</option>
                <option value="missing">Missing Information</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="feedback-form-group">
              <label for="feedback-message">Your Feedback *</label>
              <textarea
                id="feedback-message"
                name="message"
                rows="6"
                required
                placeholder="Please describe the issue or suggestion in detail..."
              ></textarea>
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
            <p>An email form should have opened in your email app. Please send the email to complete your feedback submission.</p>
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
      this.handleSubmit();
    });

    // Done button (after success)
    const doneBtn = document.getElementById('feedback-done');
    doneBtn.addEventListener('click', () => {
      this.closeFeedbackModal();
    });
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

    // Hide success message and show form
    document.getElementById('feedback-success').hidden = true;
    form.hidden = false;

    // Clear screenshot
    this.screenshot = null;
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

    if (viewingDirectory && window.appState && window.appState.currentDirectoryEntry) {
      contextSection = 'directory (modal open)';
      directoryItem.style.display = 'list-item';
      directorySpan.textContent = window.appState.currentDirectoryEntry.title;
    } else {
      directoryItem.style.display = 'none';
      directorySpan.textContent = '';
    }

    // Update context display
    document.getElementById('context-section').textContent = contextSection;
    document.getElementById('context-url').textContent = window.location.href;
    document.getElementById('context-timestamp').textContent = new Date().toLocaleString();
  }

  // Handle form submission
  async handleSubmit() {
    const form = document.getElementById('feedback-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      // Get form data
      const formData = new FormData(form);
      const name = formData.get('name') || 'Anonymous';
      const email = formData.get('email') || 'No email provided';
      const type = formData.get('type');
      const message = formData.get('message');

      // Build email
      this.sendFeedback({
        name,
        email,
        type,
        message
      });

      // Show success message
      form.hidden = true;
      document.getElementById('feedback-success').hidden = false;

    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error preparing your feedback. Please try again or email us directly at ' + this.recipientEmail);

      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Feedback';
    }
  }

  // Send feedback via email
  sendFeedback(data) {
    const { name, email, type, message } = data;

    // Get context
    const section = document.getElementById('context-section').textContent;
    const url = document.getElementById('context-url').textContent;
    const timestamp = document.getElementById('context-timestamp').textContent;
    const directoryEntry = document.getElementById('context-directory').textContent;

    // Build email body
    let emailBody = `
FEEDBACK SUBMISSION
===================

From: ${name}
Email: ${email}
Type: ${type}
Timestamp: ${timestamp}

Current Section: ${section}`;

    if (directoryEntry) {
      emailBody += `
Directory Entry: ${directoryEntry}`;
    }

    emailBody += `
Page URL: ${url}

MESSAGE:
--------
${message}
`;

    // Create mailto link
    const subject = encodeURIComponent(`Feedback: ${type} - SLO Homeless Resource Guide`);
    const body = encodeURIComponent(emailBody);
    const mailtoLink = `mailto:${this.recipientEmail}?subject=${subject}&body=${body}`;

    // Open mailto link
    window.location.href = mailtoLink;
  }
}

// Initialize feedback system
export function initFeedback() {
  const feedbackSystem = new FeedbackSystem();
  feedbackSystem.init();
}
