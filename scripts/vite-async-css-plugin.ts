import type { Plugin } from "vite";

/**
 * Vite plugin that makes CSS `<link>` tags non-blocking in production builds.
 *
 * Technique: convert render-blocking `<link rel="stylesheet" href="...">` tags
 * into `<link rel="stylesheet" media="print" onload="this.media='all'" ...>`
 * with a `<noscript>` fallback. This allows the browser to paint immediately
 * using the critical CSS already inlined in `<style>` tags, while the full
 * stylesheet loads in the background.
 *
 * Reference: https://web.dev/defer-non-critical-css/
 */
export function asyncCssPlugin(): Plugin {
  return {
    name: "vite-async-css",
    enforce: "post",
    apply: "build",
    transformIndexHtml(html) {
      // Match all <link rel="stylesheet" ...> tags that point to hashed CSS bundles
      // e.g. <link rel="stylesheet" crossorigin href="/assets/index-C9W_BGi0.css">
      const cssLinkRegex =
        /<link\s+([^>]*?)rel=["']stylesheet["']([^>]*?)href=["']([^"']+\.css)["']([^>]*?)\s*\/?\s*>/gi;

      const noscriptFallbacks: string[] = [];

      const transformed = html.replace(
        cssLinkRegex,
        (_match, before, mid, href, after) => {
          // Keep the original tag as a <noscript> fallback
          noscriptFallbacks.push(
            `<link rel="stylesheet" ${before}${mid}href="${href}"${after} />`
          );

          // Return the non-blocking version
          return `<link rel="stylesheet" ${before}${mid}href="${href}"${after} media="print" onload="this.media='all'" />`;
        }
      );

      // Inject <noscript> fallbacks just before </head>
      if (noscriptFallbacks.length > 0) {
        const noscriptBlock = `<noscript>${noscriptFallbacks.join("")}</noscript>`;
        return transformed.replace("</head>", `${noscriptBlock}\n</head>`);
      }

      return transformed;
    },
  };
}
