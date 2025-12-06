/**
 * Link Enhancer - Enhances links with smart functionality
 * - Phone numbers become clickable tel: links
 * - Email addresses become clickable mailto: links
 * - Physical addresses become clickable map links
 * - External links get proper attributes
 */

/**
 * Enhance all links in a container
 */
export function enhanceLinks(container) {
  enhancePhoneLinks(container);
  enhanceEmailLinks(container);
  enhanceExternalLinks(container);
}

/**
 * Ensure phone number links are properly formatted
 */
function enhancePhoneLinks(container) {
  const phoneLinks = container.querySelectorAll('a[href^="tel:"]');

  phoneLinks.forEach(link => {
    // Add proper attributes
    link.setAttribute('aria-label', `Call ${link.textContent.trim()}`);

    // Ensure proper format
    const href = link.getAttribute('href');
    if (!href.startsWith('tel:+1') && !href.includes(';ext')) {
      // Add +1 for US numbers if not present
      const cleanNumber = href.replace('tel:', '').replace(/\D/g, '');
      if (cleanNumber.length === 10) {
        link.setAttribute('href', `tel:+1-${cleanNumber}`);
      }
    }
  });

  // Find and convert plain phone numbers to links
  convertPlainPhoneNumbers(container);
}

/**
 * Convert plain phone numbers in text to clickable links
 */
function convertPlainPhoneNumbers(container) {
  // This is a simple implementation - could be enhanced
  const phoneRegex = /\b\d{3}-\d{3}-\d{4}\b/g;

  walkTextNodes(container, (textNode) => {
    const text = textNode.textContent;
    const matches = text.match(phoneRegex);

    if (matches && !isInsideLink(textNode)) {
      const parent = textNode.parentNode;
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      text.replace(phoneRegex, (match, offset) => {
        // Add text before match
        if (offset > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, offset))
          );
        }

        // Add phone link
        const link = document.createElement('a');
        const cleanNumber = match.replace(/\D/g, '');
        link.href = `tel:+1-${cleanNumber}`;
        link.textContent = match;
        link.setAttribute('aria-label', `Call ${match}`);
        fragment.appendChild(link);

        lastIndex = offset + match.length;
        return match;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex))
        );
      }

      parent.replaceChild(fragment, textNode);
    }
  });
}

/**
 * Enhance email links
 */
function enhanceEmailLinks(container) {
  const emailLinks = container.querySelectorAll('a[href^="mailto:"]');

  emailLinks.forEach(link => {
    link.setAttribute('aria-label', `Email ${link.textContent.trim()}`);
  });
}

/**
 * Enhance external links
 */
function enhanceExternalLinks(container) {
  const links = container.querySelectorAll('a[href^="http"]');

  links.forEach(link => {
    // Check if it's truly external
    const url = new URL(link.href);
    if (url.hostname !== window.location.hostname) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');

      // Add aria-label
      const currentLabel = link.getAttribute('aria-label');
      if (!currentLabel) {
        link.setAttribute('aria-label', `${link.textContent.trim()} (opens in new tab)`);
      }
    }
  });
}

/**
 * Utility: Walk all text nodes in a container
 */
function walkTextNodes(node, callback) {
  if (node.nodeType === Node.TEXT_NODE) {
    callback(node);
  } else {
    for (let child of node.childNodes) {
      walkTextNodes(child, callback);
    }
  }
}

/**
 * Utility: Check if a node is inside a link
 */
function isInsideLink(node) {
  let current = node.parentNode;
  while (current) {
    if (current.tagName === 'A') {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}
