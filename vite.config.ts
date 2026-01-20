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
        manualChunks: (id) => {
          // Core React - smallest possible initial chunk
          if (id.includes('node_modules/react-dom')) {
            return 'vendor-react-dom';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          
          // Radix UI: Split into base primitives (loaded first) and components
          // This avoids circular dependency issues while keeping chunks smaller
          // Base primitives that ALL Radix components depend on - MUST load first
          if (id.includes('@radix-ui/primitive') ||
              id.includes('@radix-ui/react-primitive') ||
              id.includes('@radix-ui/react-slot') ||
              id.includes('@radix-ui/react-compose-refs') ||
              id.includes('@radix-ui/react-context') ||
              id.includes('@radix-ui/react-id') ||
              id.includes('@radix-ui/react-use-') ||
              id.includes('@radix-ui/react-collection') ||
              id.includes('@radix-ui/react-direction') ||
              id.includes('@radix-ui/react-presence') ||
              id.includes('@radix-ui/react-portal') ||
              id.includes('@radix-ui/react-focus-scope') ||
              id.includes('@radix-ui/react-focus-guards') ||
              id.includes('@radix-ui/react-dismissable-layer') ||
              id.includes('@radix-ui/react-roving-focus') ||
              id.includes('@radix-ui/react-popper') ||
              id.includes('@radix-ui/react-visually-hidden') ||
              id.includes('@radix-ui/react-arrow') ||
              id.includes('@radix-ui/number') ||
              id.includes('@radix-ui/rect')) {
            return 'vendor-radix-base';
          }
          // Higher-level Radix components - can load after base
          if (id.includes('@radix-ui/')) {
            return 'vendor-radix-components';
          }
          
          // Forms & validation
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('node_modules/zod')) {
            return 'vendor-forms';
          }
          
          // Data fetching
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          
          // Animation - heavy, defer loading
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          
          // Backend
          if (id.includes('@supabase/')) {
            return 'vendor-supabase';
          }
          
          // Date handling
          if (id.includes('date-fns') || id.includes('react-day-picker')) {
            return 'vendor-date';
          }
          
          // Heavy utilities - only loaded when needed
          if (id.includes('jspdf')) {
            return 'vendor-pdf';
          }
          if (id.includes('node_modules/xlsx')) {
            return 'vendor-excel';
          }
          if (id.includes('react-markdown') || id.includes('remark-gfm')) {
            return 'vendor-markdown';
          }
          
          // Carousel - defer (keep small)
          if (id.includes('embla-carousel')) {
            return 'vendor-carousel';
          }
          
          // Map - heavy, defer
          if (id.includes('mapbox-gl')) {
            return 'vendor-map';
          }
          
          // Lucide icons - common across pages
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          
          // clsx, tailwind-merge, class-variance-authority - very small, but used everywhere
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
            return 'vendor-utils';
          }
        },
        // Isolate large app chunks for better caching
        chunkFileNames: (chunkInfo) => {
          // Put translations in their own cached chunk - each language separately
          if (chunkInfo.name?.includes('LanguageContext')) {
            return 'assets/translations-main-[hash].js';
          }
          if (chunkInfo.name?.includes('BlogTranslations')) {
            return 'assets/translations-blog-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 500,
    // Enable source maps for production debugging
    sourcemap: false,
    // Minification - use esbuild to avoid rare terser minification edge-cases
    // that can break vendor chunks on some devices/browsers.
    minify: "esbuild",
    esbuild: {
      // Keep bundles lean without risking terser-specific transforms.
      drop: ["console", "debugger"],
    },
    // Target modern browsers
    target: "es2020",
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Reduce asset inline limit for better caching
    assetsInlineLimit: 2048
  }
}));
