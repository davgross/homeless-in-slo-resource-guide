/**
 * Vite plugin to print the Map Data Helper tool's URL alongside the
 * main site URL when the dev server starts.
 */

export default function printMapHelperUrl() {
  return {
    name: 'print-map-helper-url',

    configureServer(server) {
      const printUrls = server.printUrls;
      server.printUrls = () => {
        printUrls();

        const localUrl = server.resolvedUrls?.local?.[0];
        if (localUrl) {
          const toolUrl = new URL('map-data-helper.html', localUrl).href;
          server.config.logger.info(`  ➜  Map Tool: ${toolUrl}`);
        }
      };
    }
  };
}
