/**
 * UI Strings - Centralized location for all user-facing text
 * This file makes it easier to translate the app to other languages (e.g., Spanish)
 *
 * To add a new language:
 * 1. Copy the 'en' object
 * 2. Rename it to the language code (e.g., 'es' for Spanish)
 * 3. Translate all string values
 * 4. Update getCurrentLanguage() to detect/set the new language
 */

const strings = {
  en: {
    // Navigation
    nav: {
      resources: 'Resources',
      directory: 'Directory',
      about: 'About',
      skipToMain: 'Skip to main content'
    },

    // Section announcements (for screen readers)
    sections: {
      resources: 'Resources section',
      directory: 'Directory section',
      about: 'About section',
      loaded: 'loaded' // e.g., "Resources section loaded"
    },

    // Search
    search: {
      placeholder: 'Search...',
      ariaLabel: 'Search resources and directory',
      noResults: 'No results found for',
      resultCount: (count) => `${count} result${count === 1 ? '' : 's'}`,
      found: (count) => `Found ${count} result${count === 1 ? '' : 's'}`,
      resultsFor: (query) => `results found for ${query}`,
      directoryEntry: 'Directory Entry',
      resourceGuide: 'Resource Guide',
      resourceSection: 'Resource Guide › Section',
      resourceSubsection: 'Resource Guide › Subsection'
    },

    // Loading states
    loading: {
      resources: 'Loading resources...',
      directory: 'Loading directory...'
    },

    // Errors
    errors: {
      loadContent: 'Unable to load content. Please refresh the page.'
    },

    // Share functionality
    share: {
      button: {
        ariaLabel: 'Share this resource guide',
        title: 'Share'
      },
      main: {
        title: 'SLO County Homeless Resource Guide',
        text: 'Comprehensive resource guide for people experiencing homelessness in San Luis Obispo County'
      },
      section: {
        title: (sectionTitle) => `${sectionTitle} - SLO County Homeless Resource Guide`,
        text: (sectionTitle) => `Check out this resource: ${sectionTitle}`,
        buttonTitle: 'Share this section',
        buttonAriaLabel: (sectionTitle) => `Share ${sectionTitle}`
      },
      directoryEntry: {
        title: (entryTitle) => `${entryTitle} - SLO County Homeless Resource Guide`,
        text: (entryTitle) => `Check out this resource: ${entryTitle}`,
        buttonTitle: 'Share this directory entry',
        buttonAriaLabel: (entryTitle) => `Share ${entryTitle}`
      },
      notifications: {
        linkCopied: 'Link copied to clipboard!',
        sectionLinkCopied: 'Section link copied to clipboard!',
        entryLinkCopied: 'Directory entry link copied to clipboard!',
        copyFailed: 'Unable to copy link. Please copy manually from address bar.',
        copyFailedShort: 'Unable to copy link.'
      }
    },

    // Directory overlay
    directory: {
      closeButton: {
        ariaLabel: 'Close directory entry'
      },
      feedbackButton: {
        ariaLabel: 'Send feedback about this directory entry',
        title: 'Send feedback'
      }
    },

    // About section
    about: {
      title: 'About This Guide',
      intro: 'This resource guide helps people experiencing homelessness in San Luis Obispo County find services and support.',

      reportErrors: {
        title: 'How to Report Errors or Suggest Improvements',
        intro: 'We want this guide to be as accurate and helpful as possible. If you find outdated information, errors, or want to suggest improvements:',
        steps: [
          'Click the feedback button (💬) in the bottom-right corner of the screen',
          'Fill out the feedback form with details about the issue or suggestion',
          'Send the email that opens with your default email app'
        ],
        outro: 'Your feedback helps keep this resource current and useful for everyone in our community.'
      },

      project: {
        title: 'About This Project',
        description: (showerLink) => `This guide is a project of ${showerLink}, a nonprofit organization serving people experiencing homelessness in San Luis Obispo County.`,
        showerThePeopleText: 'Shower the People',
        showerThePeopleUrl: 'https://showerthepeopleslo.org/'
      },

      disclaimer: {
        title: 'Disclaimer',
        text: 'This guide is provided for informational purposes only. While we strive to keep information current and accurate, services, hours, and eligibility requirements may change. Please contact organizations directly to verify details before visiting.'
      },

      licenses: {
        title: 'Open-Source Libraries and Fonts',
        intro: 'This application uses the following open-source libraries and fonts:',
        libraries: [
          { name: 'Marked', url: 'https://github.com/markedjs/marked', license: 'MIT License', description: 'Markdown parser' },
          { name: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify', license: 'Apache 2.0 / MPL 2.0', description: 'HTML sanitizer' },
          { name: 'Vite', url: 'https://vitejs.dev', license: 'MIT License', description: 'Build tool' },
          { name: 'vite-plugin-pwa', url: 'https://vite-pwa-org.netlify.app', license: 'MIT License', description: 'Progressive Web App functionality' },
          { name: 'Montserrat Alternates', url: 'https://fonts.google.com/specimen/Montserrat+Alternates', license: 'SIL Open Font License 1.1', description: 'Display font' }
        ],
        fullLicensesText: 'Full license texts available in',
        fullLicensesLink: 'THIRD_PARTY_LICENSES.md',
        fullLicensesUrl: 'https://github.com/showerthepeopleslo/resource-guide/blob/main/THIRD_PARTY_LICENSES.md'
      },

      copyright: {
        title: 'Copyright',
        text: '© 2025 Shower the People. All rights reserved.'
      },

      lastUpdated: 'Last updated:'
    }
  }

  // Future translations would go here:
  // es: { ... Spanish translations ... }
};

/**
 * Get the current language setting
 * In the future, this could check localStorage, URL params, or browser settings
 */
function getCurrentLanguage() {
  // For now, always return English
  // In the future: return localStorage.getItem('language') || 'en';
  return 'en';
}

/**
 * Get a string value by path
 * Example: getString('search.placeholder') returns strings[currentLang].search.placeholder
 */
export function getString(path) {
  const lang = getCurrentLanguage();
  const keys = path.split('.');
  let value = strings[lang];

  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`String not found: ${path}`);
      return path; // Return the path as fallback
    }
  }

  return value;
}

/**
 * Export the entire strings object for a language
 */
export function getStrings() {
  const lang = getCurrentLanguage();
  return strings[lang];
}

/**
 * Set the current language
 * In the future, this could save to localStorage
 */
export function setLanguage(lang) {
  if (!strings[lang]) {
    console.warn(`Language not found: ${lang}`);
    return false;
  }
  // localStorage.setItem('language', lang);
  // Trigger a re-render or update of the UI
  return true;
}

// Export available languages
export const availableLanguages = Object.keys(strings);
