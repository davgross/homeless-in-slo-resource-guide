/**
 * Modal helper — shared focus management for the app's dialogs.
 *
 * Every modal in the app needs the same four things, and before this module
 * none of them had all four:
 *   1. dialog semantics, so screen readers announce a boundary
 *   2. focus moved into the dialog on open
 *   3. focus kept inside it while open (and not leaking into the guide behind)
 *   4. focus returned to whatever opened it on close
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

// Elements made inert while a modal is open, so they can be restored after
let inertedElements = [];

// The element that had focus before the modal opened
let previouslyFocused = null;

// The active modal's keydown handler, tracked so it can be removed
let activeTrap = null;
let activeModal = null;

/**
 * Get the focusable elements inside a container, skipping hidden ones
 */
function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE))
    .filter(el => el.offsetParent !== null || el === document.activeElement);
}

/**
 * Make everything outside the modal inert, so neither Tab nor a screen
 * reader's virtual cursor can wander into the page behind the dialog.
 */
function setBackgroundInert(modal) {
  inertedElements = [];

  // Walk up from the modal to <body>, inerting every SIBLING at each level.
  // Inerting only body's children is not enough: the directory overlay lives
  // inside #app, so that would leave the header, toolbar and the whole guide
  // still reachable by Tab and by a screen reader's virtual cursor.
  let node = modal;
  while (node && node.parentElement) {
    const parent = node.parentElement;

    Array.from(parent.children).forEach(sibling => {
      if (sibling === node) return;
      if (sibling.hasAttribute('inert')) return;
      sibling.setAttribute('inert', '');
      sibling.setAttribute('aria-hidden', 'true');
      inertedElements.push(sibling);
    });

    if (parent === document.body) break;
    node = parent;
  }
}

function clearBackgroundInert() {
  inertedElements.forEach(el => {
    el.removeAttribute('inert');
    el.removeAttribute('aria-hidden');
  });
  inertedElements = [];
}

/**
 * Open a modal: apply dialog semantics, move focus in, trap it, and make the
 * rest of the page inert.
 *
 * @param {HTMLElement} modal       the overlay element
 * @param {object}      options
 * @param {string}      options.labelledBy  id of the element naming the dialog
 * @param {string}      options.label       accessible name, if there is no heading
 * @param {HTMLElement} options.initialFocus element to focus first
 */
export function openModal(modal, options = {}) {
  // If another modal is somehow open, close it cleanly first
  if (activeModal && activeModal !== modal) {
    closeModal(activeModal, { restoreFocus: false });
  }

  previouslyFocused = document.activeElement;

  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  if (options.labelledBy) {
    modal.setAttribute('aria-labelledby', options.labelledBy);
    modal.removeAttribute('aria-label');
  } else if (options.label) {
    modal.setAttribute('aria-label', options.label);
    modal.removeAttribute('aria-labelledby');
  }

  modal.hidden = false;
  setBackgroundInert(modal);

  // Focus the requested element, else the dialog container itself. Focusing
  // the container (rather than the first button) means a screen reader reads
  // the dialog's name first, so the user hears what they just opened.
  const target = options.initialFocus || modal.querySelector('.directory-modal, .feedback-modal-content, .qr-modal-content') || modal;
  if (target === modal || !target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }
  target.focus();

  activeTrap = (e) => {
    if (e.key !== 'Tab') return;

    const focusable = getFocusable(modal);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  };

  modal.addEventListener('keydown', activeTrap);
  activeModal = modal;
}

/**
 * Close a modal and hand focus back to whatever opened it.
 */
export function closeModal(modal, options = {}) {
  const { restoreFocus = true } = options;

  if (activeTrap && activeModal === modal) {
    modal.removeEventListener('keydown', activeTrap);
    activeTrap = null;
  }

  modal.hidden = true;
  clearBackgroundInert();

  if (activeModal === modal) {
    activeModal = null;
  }

  // Returning focus to the trigger is what lets someone deep in the guide
  // carry on from where they were instead of restarting at the top.
  if (restoreFocus && previouslyFocused && document.contains(previouslyFocused)) {
    previouslyFocused.focus();
  }
  if (restoreFocus) {
    previouslyFocused = null;
  }
}

/**
 * Is any modal currently open?
 */
export function isModalOpen() {
  return activeModal !== null;
}
