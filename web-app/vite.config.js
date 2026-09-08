import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import minifyMarkdown from './vite-plugin-minify-markdown.js';
import printMapHelperUrl from './vite-plugin-print-map-helper-url.js';

export default defineConfig({
  base: './',
  define: {
    // Stamped in at build time so the "last updated" line reports a real
    // date rather than whenever the page happened to be loaded.
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  server: {
    watch: {
      // Watch parent directory for markdown file changes
      ignored: ['!**/node_modules/**', '!**/.git/**'],
      usePolling: false,
    },
    // Add parent directory to watch list
    fs: {
      allow: ['..']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'esnext',
    // Allow importing markdown files as raw text
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor dependencies into separate chunk
          'vendor': ['marked', 'dompurify'],
        }
      }
    }
  },
  plugins: [
    minifyMarkdown(),
    printMapHelperUrl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'icon-192-maskable.png', 'icon-512-maskable.png'],
      manifest: {
        id: '/slo-resources/',
        name: 'VivaSLO Homeless Resource Guide',
        short_name: 'VivaSLO',
        description: 'Comprehensive resource guide for avoiding, surviving, and escaping homelessness in San Luis Obispo County',
        theme_color: '#1a62ff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['social', 'lifestyle', 'utilities'],
        lang: 'en-US',
        dir: 'ltr',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // woff2 is included so the self-hosted fonts are available offline.
        // OpenDyslexic is an accessibility feature: a reader who installs the
        // app at a library and turns the font on later, with no network, must
        // still get it. See issue #420.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,txt,webmanifest,woff2}'],
        // The fonts and Leaflet push the precache past the 2 MiB default
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // The standalone map pages are real pages, not app routes. Without
        // these two lines the navigation fallback serves the app shell for
        // any map URL that carries a query string (e.g. ?lang=es), so the
        // reader gets the guide instead of the map they asked for.
        navigateFallbackDenylist: [/-map\.html$/],
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^lang$/],
        // No runtimeCaching: every asset the app needs is now same-origin and
        // precached. The previous google-fonts rule cached only the CSS from
        // fonts.googleapis.com, never the .woff2 files from fonts.gstatic.com,
        // so it never actually delivered fonts offline.
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});
