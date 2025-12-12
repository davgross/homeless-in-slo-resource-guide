/**
 * UI Strings - Centralized location for all user-facing text
 * This file makes it easier to translate the app to other languages
 *
 * To add a new language:
 * 1. Copy the 'en' object
 * 2. Rename it to the language code (e.g., 'es' for Spanish)
 * 3. Translate all string values
 * 4. Update getCurrentLanguage() to detect/set the new language
 */

const strings = {
  en: {
    // Page metadata
    meta: {
      description: 'Comprehensive resource guide for people experiencing homelessness in San Luis Obispo County',
      title: 'SLO County Homeless Resource Guide'
    },

    // Navigation
    nav: {
      resources: 'Resources',
      directory: 'Directory',
      about: 'About',
      skipToMain: 'Skip to main content',
      returnToHome: 'Return to home',
      logoAlt: 'SLO County Resource Guide Logo',
      mainNavLabel: 'Main navigation'
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
      placeholder: 'Search…',
      ariaLabel: 'Search resources and directory',
      resultsLabel: 'Search results',
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

    // Table of Contents navigation
    toc: {
      button: {
        ariaLabel: 'Jump to table of contents',
        title: 'Table of Contents'
      }
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
      },
      shareButton: {
        ariaLabel: (entryTitle) => `Share ${entryTitle}`,
        title: 'Share'
      }
    },

    // Font size control
    fontSize: {
      button: {
        ariaLabel: 'Adjust font size',
        title: 'Font Size'
      },
      popup: {
        header: 'Text Size',
        decrease: 'A−',
        decreaseAriaLabel: 'Decrease font size',
        reset: 'Default',
        resetAriaLabel: 'Reset to default font size',
        increase: 'A+',
        increaseAriaLabel: 'Increase font size',
        preview: (percentage) => `${percentage}%`,
        dyslexicToggleLabel: 'Use',
        dyslexicFontName: 'OpenDyslexic',
        dyslexicToggleSuffix: 'font',
        dyslexicAriaLabel: 'Toggle OpenDyslexic font'
      }
    },

    // Install button
    install: {
      button: {
        ariaLabel: 'Install this app',
        title: 'Install App'
      }
    },

    // Feedback system
    feedback: {
      button: {
        ariaLabel: 'Send feedback',
        title: 'Send feedback',
        icon: '💬'
      },
      modal: {
        title: 'Send Feedback',
        intro: 'Help us improve this guide by reporting errors, outdated information, or suggesting improvements.',
        closeButton: 'Close feedback form',

        nameLabel: 'Your Name (optional)',
        namePlaceholder: 'Your name',

        emailLabel: 'Your Email (optional)',
        emailPlaceholder: 'your.email@example.com',
        emailHelper: 'If you\'d like a response, please provide your email.',
        emailError: 'Please enter a valid email address',

        typeLabel: 'Feedback Type *',
        typePlaceholder: '-- Select type --',
        typeError: 'Please select a feedback type',
        typeOptions: {
          outdated: 'Outdated Information',
          error: 'Error or Mistake',
          missing: 'Missing Information',
          suggestion: 'Suggestion',
          other: 'Other'
        },

        messageLabel: 'Your Feedback *',
        messagePlaceholder: 'Please describe the issue or suggestion in detail...',
        messageError: 'Please enter your feedback',

        contextHeader: 'Context information (automatically included):',
        contextSection: 'Current section:',
        contextDirectory: 'Directory entry:',
        contextUrl: 'Page URL:',
        contextTimestamp: 'Timestamp:',

        cancelButton: 'Cancel',
        submitButton: 'Send Feedback',
        submittingButton: 'Sending...',

        successIcon: '✅',
        successTitle: 'Thank you for your feedback!',
        successMessage: 'Your feedback has been submitted successfully. We appreciate your help in improving this guide.',
        doneButton: 'Close',

        errorAlert: (email) => `There was an error sending your feedback. Please try again or email us directly at ${email}`
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
    },

    // Language switcher
    language: {
      label: 'Language',
      english: 'English',
      spanish: 'Español'
    }
  },

  // Latin American Spanish translations
  es: {
    // Page metadata
    meta: {
      description: 'Guía completa de recursos para personas en situación de calle en el condado de San Luis Obispo',
      title: 'Guía de Recursos para Personas sin Hogar del Condado de SLO'
    },

    // Navigation
    nav: {
      resources: 'Recursos',
      directory: 'Directorio',
      about: 'Sobre',
      skipToMain: 'Saltar al contenido principal',
      returnToHome: 'Volver al inicio',
      logoAlt: 'Logotipo de la Guía de Recursos del Condado de SLO',
      mainNavLabel: 'Navegación principal'
    },

    // Section announcements (for screen readers)
    sections: {
      resources: 'Sección de recursos',
      directory: 'Sección del directorio',
      about: 'Sección sobre el sitio',
      loaded: 'cargada' // e.g., "Sección de recursos cargada"
    },

    // Search
    search: {
      placeholder: 'Buscar…',
      ariaLabel: 'Buscar recursos y directorio',
      resultsLabel: 'Resultados de búsqueda',
      noResults: 'No se encontraron resultados para',
      resultCount: (count) => `${count} resultado${count === 1 ? '' : 's'}`,
      found: (count) => `Se encontraron ${count} resultado${count === 1 ? '' : 's'}`,
      resultsFor: (query) => `resultados encontrados para ${query}`,
      directoryEntry: 'Entrada del directorio',
      resourceGuide: 'Guía de recursos',
      resourceSection: 'Guía de recursos › Sección',
      resourceSubsection: 'Guía de recursos › Subsección'
    },

    // Loading states
    loading: {
      resources: 'Cargando recursos...',
      directory: 'Cargando directorio...'
    },

    // Errors
    errors: {
      loadContent: 'No se puede cargar el contenido. Por favor, recargue la página.'
    },

    // Table of Contents navigation
    toc: {
      button: {
        ariaLabel: 'Ir al índice',
        title: 'Índice'
      }
    },

    // Share functionality
    share: {
      button: {
        ariaLabel: 'Compartir esta guía de recursos',
        title: 'Compartir'
      },
      main: {
        title: 'Guía de Recursos para Personas sin Hogar del Condado de SLO',
        text: 'Guía completa de recursos para personas en situación de calle en el condado de San Luis Obispo'
      },
      section: {
        title: (sectionTitle) => `${sectionTitle} - Guía de Recursos para Personas sin Hogar del Condado de SLO`,
        text: (sectionTitle) => `Mira este recurso: ${sectionTitle}`,
        buttonTitle: 'Compartir esta sección',
        buttonAriaLabel: (sectionTitle) => `Compartir ${sectionTitle}`
      },
      directoryEntry: {
        title: (entryTitle) => `${entryTitle} - Guía de Recursos para Personas sin Hogar del Condado de SLO`,
        text: (entryTitle) => `Mira este recurso: ${entryTitle}`,
        buttonTitle: 'Compartir esta entrada del directorio',
        buttonAriaLabel: (entryTitle) => `Compartir ${entryTitle}`
      },
      notifications: {
        linkCopied: '¡Enlace copiado al portapapeles!',
        sectionLinkCopied: '¡Enlace de la sección copiado al portapapeles!',
        entryLinkCopied: '¡Enlace de la entrada del directorio copiado al portapapeles!',
        copyFailed: 'No se puede copiar el enlace. Por favor, cópielo manualmente de la barra de direcciones.',
        copyFailedShort: 'No se puede copiar el enlace.'
      }
    },

    // Directory overlay
    directory: {
      closeButton: {
        ariaLabel: 'Cerrar entrada del directorio'
      },
      feedbackButton: {
        ariaLabel: 'Enviar comentarios sobre esta entrada del directorio',
        title: 'Enviar comentarios'
      },
      shareButton: {
        ariaLabel: (entryTitle) => `Compartir ${entryTitle}`,
        title: 'Compartir'
      }
    },

    // Font size control
    fontSize: {
      button: {
        ariaLabel: 'Ajustar tamaño de fuente',
        title: 'Tamaño de fuente'
      },
      popup: {
        header: 'Tamaño del texto',
        decrease: 'A−',
        decreaseAriaLabel: 'Reducir tamaño de fuente',
        reset: 'Predeterminado',
        resetAriaLabel: 'Restablecer al tamaño de fuente predeterminado',
        increase: 'A+',
        increaseAriaLabel: 'Aumentar tamaño de fuente',
        preview: (percentage) => `${percentage}%`,
        dyslexicToggleLabel: 'Usar fuente',
        dyslexicFontName: 'OpenDyslexic',
        dyslexicToggleSuffix: '',
        dyslexicAriaLabel: 'Activar fuente OpenDyslexic'
      }
    },

    // Install button
    install: {
      button: {
        ariaLabel: 'Instalar esta aplicación',
        title: 'Instalar aplicación'
      }
    },

    // Feedback system
    feedback: {
      button: {
        ariaLabel: 'Enviar comentarios',
        title: 'Enviar comentarios',
        icon: '💬'
      },
      modal: {
        title: 'Enviar comentarios',
        intro: 'Ayúdanos a mejorar esta guía reportando errores, información desactualizada o sugiriendo mejoras.',
        closeButton: 'Cerrar formulario de comentarios',

        nameLabel: 'Su nombre (opcional)',
        namePlaceholder: 'Su nombre',

        emailLabel: 'Su correo electrónico (opcional)',
        emailPlaceholder: 'su.correo@ejemplo.com',
        emailHelper: 'Si desea recibir una respuesta, proporcione su correo electrónico.',
        emailError: 'Por favor, ingrese un correo electrónico válido',

        typeLabel: 'Tipo de comentario *',
        typePlaceholder: '-- Seleccionar tipo --',
        typeError: 'Por favor, seleccione un tipo de comentario',
        typeOptions: {
          outdated: 'Información desactualizada',
          error: 'Error o equivocación',
          missing: 'Información faltante',
          suggestion: 'Sugerencia',
          other: 'Otro'
        },

        messageLabel: 'Sus comentarios *',
        messagePlaceholder: 'Por favor, describa el problema o sugerencia en detalle...',
        messageError: 'Por favor, ingrese sus comentarios',

        contextHeader: 'Información de contexto (se incluye automáticamente):',
        contextSection: 'Sección actual:',
        contextDirectory: 'Entrada del directorio:',
        contextUrl: 'URL de la página:',
        contextTimestamp: 'Fecha y hora:',

        cancelButton: 'Cancelar',
        submitButton: 'Enviar comentarios',
        submittingButton: 'Enviando...',

        successIcon: '✅',
        successTitle: '¡Gracias por sus comentarios!',
        successMessage: 'Sus comentarios se han enviado correctamente. Agradecemos su ayuda para mejorar esta guía.',
        doneButton: 'Cerrar',

        errorAlert: (email) => `Hubo un error al enviar sus comentarios. Por favor, intente nuevamente o envíenos un correo electrónico directamente a ${email}`
      }
    },

    // About section
    about: {
      title: 'Acerca de esta guía',
      intro: 'Esta guía de recursos ayuda a personas en situación de calle en el condado de San Luis Obispo a encontrar servicios y apoyo.',

      reportErrors: {
        title: 'Cómo reportar errores o sugerir mejoras',
        intro: 'Queremos que esta guía sea lo más precisa y útil posible. Si encuentra información desactualizada, errores o desea sugerir mejoras:',
        steps: [
          'Haga clic en el botón de comentarios (💬) en la esquina inferior derecha de la pantalla',
          'Complete el formulario de comentarios con detalles sobre el problema o sugerencia',
          'Envíe el correo electrónico que se abre con su aplicación de correo predeterminada'
        ],
        outro: 'Sus comentarios ayudan a mantener este recurso actualizado y útil para todos en nuestra comunidad.'
      },

      project: {
        title: 'Acerca de este proyecto',
        description: (showerLink) => `Esta guía es un proyecto de ${showerLink}, una organización sin fines de lucro que sirve a personas en situación de calle en el condado de San Luis Obispo.`,
        showerThePeopleText: 'Shower the People',
        showerThePeopleUrl: 'https://showerthepeopleslo.org/'
      },

      disclaimer: {
        title: 'Descargo de responsabilidad',
        text: 'Esta guía se proporciona solo con fines informativos. Si bien nos esforzamos por mantener la información actualizada y precisa, los servicios, horarios y requisitos de elegibilidad pueden cambiar. Por favor, comuníquese directamente con las organizaciones para verificar los detalles antes de visitarlas.'
      },

      licenses: {
        title: 'Bibliotecas y fuentes de código abierto',
        intro: 'Esta aplicación utiliza las siguientes bibliotecas y fuentes de código abierto:',
        libraries: [
          { name: 'Marked', url: 'https://github.com/markedjs/marked', license: 'Licencia MIT', description: 'Analizador de Markdown' },
          { name: 'DOMPurify', url: 'https://github.com/cure53/DOMPurify', license: 'Apache 2.0 / MPL 2.0', description: 'Sanitizador de HTML' },
          { name: 'Vite', url: 'https://vitejs.dev', license: 'Licencia MIT', description: 'Herramienta de compilación' },
          { name: 'vite-plugin-pwa', url: 'https://vite-pwa-org.netlify.app', license: 'Licencia MIT', description: 'Funcionalidad de aplicación web progresiva' },
          { name: 'Montserrat Alternates', url: 'https://fonts.google.com/specimen/Montserrat+Alternates', license: 'Licencia SIL Open Font 1.1', description: 'Fuente de visualización' }
        ],
        fullLicensesText: 'Textos completos de licencias disponibles en',
        fullLicensesLink: 'THIRD_PARTY_LICENSES.md',
        fullLicensesUrl: 'https://github.com/showerthepeopleslo/resource-guide/blob/main/THIRD_PARTY_LICENSES.md'
      },

      copyright: {
        title: 'Derechos de autor',
        text: '© 2025 Shower the People. Todos los derechos reservados.'
      },

      lastUpdated: 'Última actualización:'
    },

    // Language switcher
    language: {
      label: 'Idioma',
      english: 'English',
      spanish: 'Español'
    }
  }
};

/**
 * Get the current language setting
 * Checks (in order of priority):
 * 1. localStorage (user's explicit choice)
 * 2. URL parameter (?lang=es)
 * 3. Browser language preference
 * 4. Default to English
 */
export function getCurrentLanguage() {
  try {
    // Check localStorage for saved preference
    const savedLang = localStorage.getItem('language');
    if (savedLang && strings[savedLang]) {
      return savedLang;
    }

    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    if (urlLang && strings[urlLang]) {
      // Save to localStorage
      localStorage.setItem('language', urlLang);
      return urlLang;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang) {
      // Extract base language code (e.g., 'es' from 'es-MX')
      const baseLang = browserLang.split('-')[0].toLowerCase();
      if (strings[baseLang]) {
        return baseLang;
      }
    }
  } catch (e) {
    console.warn('Error detecting language:', e);
  }

  // Default to English
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
 * Saves to localStorage and reloads the page to apply changes
 */
export function setLanguage(lang) {
  if (!strings[lang]) {
    console.warn(`Language not found: ${lang}`);
    return false;
  }

  try {
    localStorage.setItem('language', lang);

    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', lang);

    // Reload the page to apply language changes throughout the app
    window.location.reload();

    return true;
  } catch (e) {
    console.error('Error setting language:', e);
    return false;
  }
}

// Export available languages
export const availableLanguages = Object.keys(strings);
