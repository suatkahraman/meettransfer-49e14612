/**
 * Vite plugin to auto-generate version.json on production builds
 */

import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

interface VersionInfo {
  version: string;
  releaseDate: string;
  buildNumber: number;
  notes: {
    TR: string;
    EN: string;
    RU?: string;
    IT?: string;
    ES?: string;
    AR?: string;
    UK?: string;
    JA?: string;
    DE: string;
    FR: string;
  };
}

const VERSION_FILE = 'public/version.json';

function getExistingVersion(): VersionInfo | null {
  try {
    const content = fs.readFileSync(VERSION_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function incrementVersion(version: string): string {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function formatDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function viteVersionPlugin(): Plugin {
  let isProduction = false;

  return {
    name: 'vite-version-plugin',
    
    configResolved(config) {
      isProduction = config.command === 'build' && config.mode === 'production';
    },

    buildStart() {
      if (!isProduction) return;

      const existing = getExistingVersion();
      
      const defaultNotes = {
        TR: "Performans iyileştirmeleri ve hata düzeltmeleri",
        EN: "Performance improvements and bug fixes",
        DE: "Leistungsverbesserungen und Fehlerbehebungen",
        FR: "Améliorations des performances et corrections de bugs"
      };

      const newVersion: VersionInfo = {
        version: existing ? incrementVersion(existing.version) : "1.0.0",
        releaseDate: formatDate(),
        buildNumber: (existing?.buildNumber || 0) + 1,
        notes: existing?.notes || defaultNotes
      };

      // Ensure directory exists
      const dir = path.dirname(VERSION_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersion, null, 2));
      
      console.log('\n');
      console.log('╔════════════════════════════════════════════╗');
      console.log('║         📦 VERSION AUTO-GENERATED          ║');
      console.log('╠════════════════════════════════════════════╣');
      console.log(`║  Version:      v${newVersion.version.padEnd(25)}║`);
      console.log(`║  Build:        #${String(newVersion.buildNumber).padEnd(25)}║`);
      console.log(`║  Date:         ${newVersion.releaseDate.padEnd(26)}║`);
      console.log('╚════════════════════════════════════════════╝');
      console.log('\n');
    }
  };
}
