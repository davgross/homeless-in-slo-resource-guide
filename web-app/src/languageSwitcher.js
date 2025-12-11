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
 * Create and insert the language switcher UI
 */
function createLanguageSwitcher() {
  const strings = getStrings();
  const currentLang = getCurrentLanguage();

  // Create language switcher container
  const container = document.createElement('div');
  container.id = 'language-switcher';
  container.className = 'language-switcher';

  // Create button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'language-switcher-btn';
  button.setAttribute('aria-label', strings.language.label);
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');

  // Button content: 🌐 followed by current language code in uppercase
  button.innerHTML = `<span class="language-icon" aria-hidden="true">🌐</span><span class="language-code">${currentLang.toUpperCase()}</span>`;

  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'language-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  // Add language options
  availableLanguages.forEach(langCode => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'language-option';
    option.setAttribute('role', 'menuitem');
    option.setAttribute('data-lang', langCode);

    // Get the language name from strings
    const langName = langCode === 'en' ? strings.language.english : strings.language.spanish;
    option.textContent = langName;

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
    });

    menu.appendChild(option);
  });

  // Toggle menu on button click
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', (!isExpanded).toString());
    menu.hidden = isExpanded;

    if (!isExpanded) {
      // Focus first menu item
      const firstOption = menu.querySelector('.language-option');
      if (firstOption) {
        firstOption.focus();
      }
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      button.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      button.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      button.focus();
    }
  });

  // Keyboard navigation in menu
  menu.addEventListener('keydown', (e) => {
    const options = Array.from(menu.querySelectorAll('.language-option'));
    const currentIndex = options.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      options[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + options.length) % options.length;
      options[prevIndex].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      options[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      options[options.length - 1].focus();
    }
  });

  // Assemble the component
  container.appendChild(button);
  container.appendChild(menu);

  // Insert into header
  const headerContent = document.querySelector('.header-content');
  if (headerContent) {
    headerContent.appendChild(container);
  } else {
    // Fallback: insert at end of header
    const header = document.querySelector('.app-header');
    if (header) {
      header.appendChild(container);
    }
  }
}
