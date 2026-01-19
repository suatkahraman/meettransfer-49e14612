import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import { viteVersionPlugin } from "./scripts/vite-version-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && viteVersionPlugin(),
    VitePWA({
      // Auto-update: keep users on the latest published version (no manual prompt).
      registerType: "autoUpdate",
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
        importScripts: ["sw-push.js"],
        // Activate new SW immediately (prevents users getting stuck on an old cached app shell)
        skipWaiting: true,
        clientsClaim: true,
        // Navigation preload for faster page loads
        navigationPreload: true,
        runtimeCaching: [
          // ============================================
          // STATIC ASSETS - CacheFirst (immutable content)
          // ============================================
          
          // Google Fonts CSS - CacheFirst (1 year)
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
          // Google Fonts Files - CacheFirst (1 year)
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Local static JS/CSS bundles - CacheFirst (hashed filenames)
          {
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year (hashed files)
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase Storage - CacheFirst for static assets
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Mapbox tiles and assets - CacheFirst
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mapbox-cache",
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // IMAGES - StaleWhileRevalidate (fast + fresh)
          // ============================================
          
          // Local images - StaleWhileRevalidate
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // External images (Unsplash, etc) - StaleWhileRevalidate
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-images-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // STATIC READ-ONLY DATA - Short cache (price lists, destinations)
          // ============================================
          
          // Supabase Edge Functions (cacheable static data only)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-google-reviews|get-destinations)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-static-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 30 // 30 minutes for static content
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Supabase REST API (truly static tables) - Short cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(google_reviews_cache)/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "supabase-reviews-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 15 // 15 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // DYNAMIC/CRITICAL API - NetworkOnly (always fresh)
          // ============================================
          
          // Price-related endpoints - NEVER cache (prices change frequently)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(get-all-vehicle-prices|get-exchange-rate|calculate-price|get-price)/i,
            handler: "NetworkOnly"
          },
          // Price tables - NEVER cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(hourly_rental_prices|region_prices|intercity_prices|price_thresholds)/i,
            handler: "NetworkOnly"
          },
          // Reservations and bookings - NEVER cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(reservations|quick_booking_requests|bookings)/i,
            handler: "NetworkOnly"
          },
          // User/customer data - NEVER cache  
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|user_roles|agencies|drivers)/i,
            handler: "NetworkOnly"
          },
          // Promo codes - NEVER cache (validity changes)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(promo_codes)/i,
            handler: "NetworkOnly"
          },
          // AI/Chat endpoints - NEVER cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(ai-chat|whatsapp|send-|create-|confirm-|track-)/i,
            handler: "NetworkOnly"
          },
          
          // ============================================
          // FALLBACK - Other Supabase calls with very short cache
          // ============================================
          
          // Supabase REST API (other tables) - NetworkFirst with 1 min cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-rest-fallback",
              networkTimeoutSeconds: 2, // Fast timeout
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 // 1 minute only
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Other Edge Functions - NetworkFirst with 2 min cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-edge-fallback",
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 2 // 2 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          // ============================================
          // NEVER CACHE - NetworkOnly
          // ============================================
          
          // Supabase Auth - Never cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
            handler: "NetworkOnly"
          },
          // Supabase Realtime - Never cache
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/realtime\/.*/i,
            handler: "NetworkOnly"
          },
          // Google Analytics - Never cache
          {
            urlPattern: /^https:\/\/www\.google-analytics\.com\/.*/i,
            handler: "NetworkOnly"
          },
          {
            urlPattern: /^https:\/\/www\.googletagmanager\.com\/.*/i,
            handler: "NetworkOnly"
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    }),
    // Bundle analyzer - generates stats.html in project root
    mode === "production" && visualizer({
      filename: "stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: "treemap", // treemap, sunburst, network
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Core React - smallest possible initial chunk
          "vendor-react": ["react", "react-dom"],
          "vendor-router": ["react-router-dom"],
          // UI components - split for better caching
          "vendor-ui-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
            "@radix-ui/react-slot"
          ],
          "vendor-ui-forms": [
            "@radix-ui/react-checkbox",
            "@radix-ui/react-label",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-switch"
          ],
          "vendor-ui-feedback": [
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-progress"
          ],
          "vendor-ui-layout": [
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-separator",
            "@radix-ui/react-dropdown-menu"
          ],
          // Forms & validation
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Data fetching
          "vendor-query": ["@tanstack/react-query"],
          // Animation - heavy, defer loading
          "vendor-motion": ["framer-motion"],
          // Backend
          "vendor-supabase": ["@supabase/supabase-js"],
          // Date handling
          "vendor-date": ["date-fns", "react-day-picker"],
          // Heavy utilities - only loaded when needed
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
          "vendor-excel": ["xlsx"],
          "vendor-markdown": ["react-markdown", "remark-gfm"],
          // Carousel - defer
          "vendor-carousel": ["embla-carousel-react", "embla-carousel-autoplay", "embla-carousel-fade"],
          // Map - heavy, defer
          "vendor-map": ["mapbox-gl"]
        },
        // Isolate large app chunks for better caching
        chunkFileNames: (chunkInfo) => {
          // Put translations in their own cached chunk
          if (chunkInfo.name?.includes('LanguageContext') || chunkInfo.name?.includes('BlogTranslations')) {
            return 'assets/translations-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification
    minify: "esbuild",
    // Target modern browsers
    target: "es2020"
  }
}));
