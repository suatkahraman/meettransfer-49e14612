/**
 * Auto-generates version.json during build
 * - Increments patch version automatically
 * - Updates release date
 * - Preserves release notes from existing file or uses defaults
 */

import fs from 'fs';
import path from 'path';

interface VersionInfo {
  version: string;
  releaseDate: string;
  buildNumber: number;
  notes: {
    TR: string;
    EN: string;
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
  // Increment patch version
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function formatDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateVersionJson(customNotes?: Partial<VersionInfo['notes']>): VersionInfo {
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
    notes: customNotes ? { ...defaultNotes, ...customNotes } : (existing?.notes || defaultNotes)
  };

  // Ensure directory exists
  const dir = path.dirname(VERSION_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(VERSION_FILE, JSON.stringify(newVersion, null, 2));
  console.log(`[Version] Generated ${VERSION_FILE}: v${newVersion.version} (build #${newVersion.buildNumber})`);
  
  return newVersion;
}

// CLI execution
if (process.argv[1]?.includes('generate-version')) {
  generateVersionJson();
}
