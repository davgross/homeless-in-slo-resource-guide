/**
 * Language Switcher Component
 * Allows users to switch between available languages
 */

import { getStrings, getCurrentLanguage, setLanguage, availableLanguages } from './strings.js';

/**
 * Initialize the language switcher
 */
export function initLanguageSwitcher() {
  createLanguageSwitcher();
}

/**
 * Create and insert the language switcher UI as a floating button
 */
function createLanguageSwitcher() {
  const strings = getStrings();
  const currentLang = getCurrentLanguage();

  // Create floating language button
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'language-btn';
  button.setAttribute('aria-label', strings.language.label);
  button.setAttribute('title', strings.language.label);
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-controls', 'language-popup');

  // Button content: current language code (EN/ES) - large and prominent
  button.innerHTML = `<span class="language-code">${currentLang.toUpperCase()}</span>`;

  // Create popup menu
  const popup = document.createElement('div');
  popup.id = 'language-popup';
  popup.className = 'language-popup';
  popup.hidden = true;

  // Popup header
  const header = document.createElement('div');
  header.className = 'language-popup-header';
  header.textContent = strings.language.label;
  popup.appendChild(header);

  // Language options container
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'language-options';

  // Add language options
  availableLanguages.forEach(langCode => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'language-option-btn';
    option.setAttribute('data-lang', langCode);

    // Get the language name from strings
    const langName = langCode === 'en' ? strings.language.english : strings.language.spanish;
    option.innerHTML = `<span class="language-option-code">${langCode.toUpperCase()}</span><span class="language-option-name">${langName}</span>`;

    // Mark current language
    if (langCode === currentLang) {
      option.classList.add('active');
      option.setAttribute('aria-current', 'true');
    }

    // Click handler
    option.addEventListener('click', () => {
      if (langCode !== currentLang) {
        setLanguage(langCode);
      }
      popup.hidden = true;
    });

    optionsContainer.appendChild(option);
  });

  popup.appendChild(optionsContainer);

  function setOpen(open) {
    popup.hidden = !open;
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      // Move focus into the popup so keyboard users land on the choices
      const first = popup.querySelector('.language-option-btn');
      if (first) first.focus();
    }
  }

  // Toggle popup on button click
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(popup.hidden);
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!button.contains(e.target) && !popup.contains(e.target)) {
      setOpen(false);
    }
  });

  // Close popup on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popup.hidden) {
      setOpen(false);
      button.focus();
    }
  });

  // Insert button and popup into the toolbar so they sit near the top of the
  // tab order rather than after the whole guide
  const toolbar = document.getElementById('app-toolbar') || document.body;
  toolbar.appendChild(button);
  toolbar.appendChild(popup);
}
