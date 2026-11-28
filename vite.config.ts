import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Relative paths: the app works both at https://frenchlion.app/ and at https://<user>.github.io/language-app/
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "app-icon.svg", "favicon-32.png"],
      manifest: {
        name: "French Lion",
        short_name: "French Lion",
        description: "Learn French by reading, translating and retelling real texts out loud.",
        theme_color: "#A4161A",
        background_color: "#F8F5F2",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Open content pages are plain HTML for search engines: never answer them with the app shell.
        navigateFallbackDenylist: [/\/(grammar|read-french-aloud|free-french-books)\//],
        runtimeCaching: [{ urlPattern: /\/(ipa|gloss)\/[a-z_]{2}\.json$/, handler: "StaleWhileRevalidate", options: { cacheName: "dictionaries", expiration: { maxEntries: 800 } } }],
      },
    }),
  ],
});
