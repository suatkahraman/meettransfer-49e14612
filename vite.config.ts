import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      // Manual update only: do not auto-check/apply SW updates.
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "robots.txt", "sitemap.xml"],
      manifest: {
        id: "/",
        name: "Meet Transfer - Premium Airport Transfers",
        short_name: "Meet Transfer",
        description: "Luxury airport transfer and chauffeur service across Turkey. Professional drivers, premium fleet, 24/7 availability.",
        lang: "en",
        dir: "ltr",
        theme_color: "#111111",
        background_color: "#111111",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/?source=pwa",
        categories: ["travel", "transportation", "lifestyle"],
        icons: [
          {
            src: "/favicon.ico",
            sizes: "48x48",
            type: "image/x-icon"
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-maskable-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        shortcuts: [
          {
            name: "Book Transfer",
            short_name: "Book",
            description: "Book a new airport transfer",
            url: "/whatsapp-booking?source=pwa",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "My Bookings",
            short_name: "Bookings",
            description: "View your reservations",
            url: "/customer?source=pwa",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Contact Us",
            short_name: "Contact",
            description: "Get in touch with us",
            url: "/contact?source=pwa",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }]
          }
        ],
        screenshots: [
          {
            src: "/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "Meet Transfer Homepage"
          },
          {
            src: "/screenshot-narrow.png",
            sizes: "720x1280",
            type: "image/png",
            form_factor: "narrow",
            label: "Meet Transfer Mobile View"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        cleanupOutdatedCaches: true,
        // Merge our push-notification handlers into the SAME SW scope
        // so PWA caching + push can coexist and updates can be prompted.
        importScripts: ["sw-push.js"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // Supabase Edge Functions - StaleWhileRevalidate for fast responses
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-google-reviews|get-all-vehicle-prices|get-exchange-rate)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-functions-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              plugins: [
                {
                  // Add cache timestamp for debugging
                  cacheWillUpdate: async ({ response }) => {
                    if (response && response.status === 200) {
                      const headers = new Headers(response.headers);
                      headers.set('sw-cache-time', new Date().toISOString());
                      return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers
                      });
                    }
                    return response;
                  }
                }
              ]
            }
          },
          // Supabase REST API - NetworkFirst with fast timeout
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest-cache",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase Auth - NetworkOnly (never cache auth)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly"
          },
          // Supabase Storage - CacheFirst for static assets
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
