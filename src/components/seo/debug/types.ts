import { type Language } from '@/hooks/useLanguageFromUrl';

export interface AggregateRating {
  ratingValue: string | number;
  reviewCount: string | number;
  bestRating?: string | number;
  worstRating?: string | number;
  source: string;
  schemaType: string;
}

export interface SchemaScript {
  index: number;
  type: string;
  hasAggregateRating: boolean;
  aggregateRating?: AggregateRating;
  raw: string;
  parsed?: Record<string, unknown>;
}

export interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  schemaIndex: number;
  schemaType: string;
  field: string;
  message: string;
}

export interface ScanResult {
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  validationIssues: ValidationIssue[];
  scannedAt: Date;
}

export interface LanguageScanResult {
  language: Language;
  path: string;
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  validationIssues: ValidationIssue[];
  scannedAt: Date;
  error?: string;
}

export interface LanguageComparisonSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithErrors: number;
  languagesWithRatings: number;
  inconsistentRatings: boolean;
}

export interface HreflangTag {
  hreflang: string;
  href: string;
}

export interface HreflangValidationResult {
  language: Language;
  url: string;
  hreflangTags: HreflangTag[];
  issues: HreflangIssue[];
  hasXDefault: boolean;
  hasSelfReference: boolean;
  scannedAt: Date;
  error?: string;
}

export interface HreflangIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
  affectedLanguages?: string[];
}

export interface HreflangSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingBidirectional: number;
  missingXDefault: number;
  missingSelfReference: number;
}

export interface CanonicalValidationResult {
  language: Language;
  url: string;
  canonicalUrl: string | null;
  issues: CanonicalIssue[];
  isSelfReferencing: boolean;
  isAbsoluteUrl: boolean;
  scannedAt: Date;
  error?: string;
}

export interface CanonicalIssue {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export interface CanonicalSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingCanonical: number;
  nonSelfReferencing: number;
  relativeUrls: number;
  inconsistentPatterns: boolean;
}

export interface MetaTagData {
  title: string | null;
  titleLength: number;
  description: string | null;
  descriptionLength: number;
  robots: string | null;
  keywords: string | null;
  viewport: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogType: string | null;
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
}

export interface MetaTagValidationResult {
  language: Language;
  url: string;
  metaTags: MetaTagData;
  issues: MetaTagIssue[];
  scannedAt: Date;
  error?: string;
}

export interface MetaTagIssue {
  level: 'error' | 'warning' | 'info';
  field: string;
  message: string;
}

export interface MetaTagSummary {
  totalLanguages: number;
  scannedLanguages: number;
  languagesWithIssues: number;
  missingTitle: number;
  missingDescription: number;
  titleTooLong: number;
  descriptionTooLong: number;
  missingOgTags: number;
  inconsistentTitles: boolean;
}

export type SEODebugTab = 'current' | 'scanned' | 'languages' | 'hreflang' | 'canonical' | 'metatags' | 'sitemap' | 'vitals' | 'social' | 'ssr';

export const LANGUAGE_TO_PREFIX: Record<Language, string> = {
  EN: "",
  TR: "/tr",
  DE: "/de",
  FR: "/fr",
  RU: "/ru",
  IT: "/it",
  ES: "/es",
  AR: "/ar",
  UK: "/uk",
  JA: "/ja",
};
