/**
 * Map page translations
 *
 * The standalone map pages are reachable from both the English and the Spanish
 * guide, so they read the same `language` preference the main app stores and
 * swap their chrome to match. Keeping one page per map (rather than an English
 * and a Spanish copy of each) keeps the location data in a single place.
 */

const chrome = {
  en: {
    backLink: '← Back to Resource Guide',
    shareLabel: 'Share this map',
    feedbackLabel: 'Send feedback',
    locate: 'Show my location',
    yourLocation: '📍 Your location',
    countSuffix: 'locations county-wide • Also listed as text below the map',
    listIntro: 'Every place on the map above, as a list. Each link opens the spot in your maps app.',
    mapAltSuffix: 'in San Luis Obispo County. The same locations are listed as text below.',
    linkCopied: 'Link copied to clipboard!',
    feedback: {
      title: '💬 Send Feedback',
      intro: 'Help us improve this map by reporting errors or suggesting improvements.',
      nameLabel: 'Your Name (optional)',
      namePlaceholder: 'Your name',
      emailLabel: 'Your Email (optional)',
      emailPlaceholder: 'your.email@example.com',
      emailHelper: "If you'd like a response, please provide your email.",
      messageLabel: 'Your Feedback *',
      messagePlaceholder: 'Describe the issue or suggestion...',
      cancel: 'Cancel',
      submit: 'Send Feedback',
      successTitle: '✅ Thank you for your feedback!',
      successBody: 'Your feedback has been submitted successfully. We appreciate your help in improving this map.',
      close: 'Close',
      emptyMessage: 'Please enter your feedback before sending.'
    }
  },
  es: {
    backLink: '← Volver a la Guía de Recursos',
    shareLabel: 'Compartir este mapa',
    feedbackLabel: 'Enviar comentarios',
    locate: 'Mostrar mi ubicación',
    yourLocation: '📍 Su ubicación',
    countSuffix: 'ubicaciones en todo el condado • También en forma de lista debajo del mapa',
    listIntro: 'Todos los lugares del mapa de arriba, en forma de lista. Cada enlace abre el lugar en su aplicación de mapas.',
    mapAltSuffix: 'en el condado de San Luis Obispo. Las mismas ubicaciones aparecen como texto más abajo.',
    linkCopied: '¡Enlace copiado!',
    feedback: {
      title: '💬 Enviar comentarios',
      intro: 'Ayúdenos a mejorar este mapa. Puede reportar errores o sugerir mejoras.',
      nameLabel: 'Su nombre (opcional)',
      namePlaceholder: 'Su nombre',
      emailLabel: 'Su correo electrónico (opcional)',
      emailPlaceholder: 'su.correo@ejemplo.com',
      emailHelper: 'Si desea una respuesta, escriba su correo electrónico.',
      messageLabel: 'Sus comentarios *',
      messagePlaceholder: 'Describa el problema o la sugerencia...',
      cancel: 'Cancelar',
      submit: 'Enviar comentarios',
      successTitle: '✅ ¡Gracias por sus comentarios!',
      successBody: 'Recibimos sus comentarios. Le agradecemos su ayuda para mejorar este mapa.',
      close: 'Cerrar',
      emptyMessage: 'Por favor escriba sus comentarios antes de enviar.'
    }
  }
};

/**
 * Which language to render in. Mirrors the main app's detection order.
 */
export function getMapLanguage() {
  try {
    const saved = localStorage.getItem('language');
    if (saved && chrome[saved]) return saved;

    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang && chrome[urlLang]) return urlLang;

    const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
    if (chrome[browserLang]) return browserLang;
  } catch (e) {
    // localStorage can throw in private/blocked contexts; fall through
  }
  return 'en';
}

export function getMapStrings() {
  return chrome[getMapLanguage()];
}

/**
 * Translate the shared page chrome. Per-page text (title, heading, list
 * heading) is passed in, since it names the specific resource.
 *
 * @param {object} page  { title, heading, listHeading, mapAltSubject }
 */
export function applyMapTranslations(page) {
  const lang = getMapLanguage();
  const t = chrome[lang];

  document.documentElement.setAttribute('lang', lang);

  const perPage = page[lang] || page.en;
  if (perPage) {
    document.title = perPage.title;
    const h1 = document.querySelector('.header h1');
    if (h1) h1.textContent = perPage.heading;
    const listHeading = document.getElementById('location-list-heading');
    if (listHeading) listHeading.textContent = perPage.listHeading;
    const map = document.getElementById('map');
    if (map) map.setAttribute('aria-label', `${perPage.mapAltSubject} ${t.mapAltSuffix}`);
  }

  const set = (sel, fn) => {
    const el = typeof sel === 'string' ? document.querySelector(sel) : sel;
    if (el) fn(el);
  };

  set('.back-link', el => { el.textContent = t.backLink; });
  set('.share-btn', el => { el.setAttribute('aria-label', t.shareLabel); el.title = t.shareLabel; });
  set('.feedback-btn', el => { el.setAttribute('aria-label', t.feedbackLabel); el.title = t.feedbackLabel; });
  set('#locate-btn', el => { el.textContent = t.locate; });
  set('#location-list-intro', el => { el.textContent = t.listIntro; });

  // Feedback form
  const f = t.feedback;
  set('#feedback-form h2', el => { el.textContent = f.title; });
  set('#feedback-form h2 + p', el => { el.textContent = f.intro; });
  set('label[for="feedback-name"]', el => { el.textContent = f.nameLabel; });
  set('#feedback-name', el => { el.placeholder = f.namePlaceholder; });
  set('label[for="feedback-email"]', el => { el.textContent = f.emailLabel; });
  set('#feedback-email', el => { el.placeholder = f.emailPlaceholder; });
  set('#feedback-email + small', el => { el.textContent = f.emailHelper; });
  set('label[for="feedback-message"]', el => { el.textContent = f.messageLabel; });
  set('#feedback-message', el => { el.placeholder = f.messagePlaceholder; });
  set('#feedback-cancel', el => { el.textContent = f.cancel; });
  set('#feedback-submit', el => { el.textContent = f.submit; });
  set('#feedback-success p:first-child', el => { el.textContent = f.successTitle; });
  set('#feedback-success p:nth-child(2)', el => { el.textContent = f.successBody; });
  set('#feedback-done', el => { el.textContent = f.close; });

  return t;
}
