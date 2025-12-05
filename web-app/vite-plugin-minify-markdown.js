/**
 * Vite plugin to minify markdown files imported with ?raw
 * Reduces bundle size by removing comments and excessive whitespace
 */

export default function minifyMarkdown() {
  return {
    name: 'minify-markdown',

    transform(code, id) {
      // Only process .md files imported with ?raw
      if (!id.endsWith('.md?raw')) {
        return null;
      }

      // The code is a string export like: export default "markdown content"
      // Extract the markdown content from the export
      const match = code.match(/export default "([\s\S]*)"/);
      if (!match) {
        return null;
      }

      let markdown = match[1];

      // Unescape the string (handle escaped quotes, newlines, etc.)
      markdown = markdown
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');

      // Minify the markdown
      markdown = minifyMarkdownContent(markdown);

      // Re-escape for JavaScript string
      markdown = markdown
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

      // Return the minified export
      return {
        code: `export default "${markdown}"`,
        map: null
      };
    }
  };
}

/**
 * Minify markdown content
 */
function minifyMarkdownContent(markdown) {
  // Remove HTML comments (source annotations)
  // These are useful in the source but not needed in the bundle
  markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

  // Remove trailing whitespace from each line
  markdown = markdown.replace(/[ \t]+$/gm, '');

  // Reduce multiple consecutive blank lines to maximum 2
  // This preserves paragraph structure while reducing file size
  markdown = markdown.replace(/\n{4,}/g, '\n\n\n');

  // Remove leading/trailing whitespace from the entire document
  markdown = markdown.trim();

  return markdown;
}
