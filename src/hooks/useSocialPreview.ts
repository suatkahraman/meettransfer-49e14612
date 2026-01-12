import { useState, useEffect, useCallback } from 'react';

export interface SocialMetaData {
  // Open Graph
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  ogSiteName: string | null;
  ogLocale: string | null;
  
  // Twitter Card
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  twitterSite: string | null;
  twitterCreator: string | null;
  
  // Basic meta
  title: string | null;
  description: string | null;
  favicon: string | null;
  canonicalUrl: string | null;
}

export interface SocialPreviewIssue {
  level: 'error' | 'warning' | 'info';
  platform: 'og' | 'twitter' | 'general';
  field: string;
  message: string;
  recommendation?: string;
}

export interface OGImageAnalysis {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  aspectRatioLabel?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  format?: string;
  isOptimalSize: boolean;
  isOptimalAspectRatio: boolean;
  isOptimalFileSize: boolean;
  hasCacheBusting: boolean;
  recommendations: string[];
  error?: string;
}

export interface SocialPreviewResult {
  url: string;
  meta: SocialMetaData;
  issues: SocialPreviewIssue[];
  scannedAt: Date;
  imagePreview?: {
    width?: number;
    height?: number;
    aspectRatio?: string;
    isValid: boolean;
    error?: string;
  };
  ogImageAnalysis?: OGImageAnalysis;
}

const OG_IMAGE_MIN_WIDTH = 1200;
const OG_IMAGE_MIN_HEIGHT = 630;
const OG_IMAGE_OPTIMAL_RATIO = 1.91; // 1200/630 ≈ 1.91
const OG_IMAGE_MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB - Facebook limit
const OG_IMAGE_RECOMMENDED_FILE_SIZE = 1 * 1024 * 1024; // 1MB recommended
const TWITTER_IMAGE_MIN_WIDTH = 800;
const TWITTER_IMAGE_MIN_HEIGHT = 418;

export const useSocialPreview = () => {
  const [result, setResult] = useState<SocialPreviewResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  const detectImageFormat = useCallback((url: string): string => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      'jpg': 'JPEG', 'jpeg': 'JPEG', 'png': 'PNG', 'gif': 'GIF',
      'webp': 'WebP', 'avif': 'AVIF', 'svg': 'SVG'
    };
    return formatMap[ext || ''] || 'Bilinmiyor';
  }, []);

  const hasCacheBusting = useCallback((url: string): boolean => {
    // Check for common cache busting patterns
    const patterns = [
      /[?&]v=/, /[?&]version=/, /[?&]t=/, /[?&]ts=/, /[?&]hash=/,
      /[?&]_=/, /\.[a-f0-9]{8,}\.(png|jpg|jpeg|webp|gif)/i
    ];
    return patterns.some(p => p.test(url));
  }, []);

  const analyzeOGImage = useCallback(async (imageUrl: string | null): Promise<OGImageAnalysis | undefined> => {
    if (!imageUrl) return undefined;

    const recommendations: string[] = [];
    const fullUrl = imageUrl.startsWith('/') ? window.location.origin + imageUrl : imageUrl;
    const format = detectImageFormat(imageUrl);
    const cacheBusting = hasCacheBusting(imageUrl);

    try {
      // Load image to get dimensions
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Görsel yüklenemedi'));
        image.src = fullUrl;
        setTimeout(() => reject(new Error('Zaman aşımı')), 10000);
      });

      const width = img.width;
      const height = img.height;
      const aspectRatio = width / height;
      
      // Calculate aspect ratio label
      let aspectRatioLabel = `${aspectRatio.toFixed(2)}:1`;
      if (Math.abs(aspectRatio - 1.91) < 0.05) aspectRatioLabel = '1.91:1 (OG optimal)';
      else if (Math.abs(aspectRatio - 2) < 0.05) aspectRatioLabel = '2:1 (Twitter optimal)';
      else if (Math.abs(aspectRatio - 1.78) < 0.05) aspectRatioLabel = '16:9';
      else if (Math.abs(aspectRatio - 1) < 0.05) aspectRatioLabel = '1:1 (Kare)';

      // Size validations
      const isOptimalSize = width >= OG_IMAGE_MIN_WIDTH && height >= OG_IMAGE_MIN_HEIGHT;
      const isOptimalAspectRatio = Math.abs(aspectRatio - OG_IMAGE_OPTIMAL_RATIO) < 0.1;

      // Try to get file size via fetch (may fail due to CORS)
      let fileSize: number | undefined;
      let fileSizeFormatted: string | undefined;
      let isOptimalFileSize = true;

      try {
        const response = await fetch(fullUrl, { method: 'HEAD' });
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          fileSize = parseInt(contentLength, 10);
          fileSizeFormatted = formatFileSize(fileSize);
          isOptimalFileSize = fileSize <= OG_IMAGE_RECOMMENDED_FILE_SIZE;
          
          if (fileSize > OG_IMAGE_MAX_FILE_SIZE) {
            recommendations.push(`⛔ Dosya boyutu çok büyük (${fileSizeFormatted}). Facebook limiti 8MB.`);
          } else if (fileSize > OG_IMAGE_RECOMMENDED_FILE_SIZE) {
            recommendations.push(`⚠️ Dosya boyutu optimize edilebilir (${fileSizeFormatted}). Önerilen: <1MB`);
          }
        }
      } catch {
        // CORS may block HEAD request, ignore
      }

      // Generate recommendations
      if (!isOptimalSize) {
        recommendations.push(`📐 Boyut yetersiz (${width}x${height}). Önerilen: 1200x630px`);
      }

      if (!isOptimalAspectRatio) {
        recommendations.push(`📏 En-boy oranı optimal değil (${aspectRatioLabel}). Önerilen: 1.91:1`);
      }

      if (!cacheBusting) {
        recommendations.push('🔄 Cache busting parametresi yok. ?v=xxx ekleyerek güncellemelerin yansımasını sağlayın.');
      }

      if (format === 'PNG' && width >= 1200) {
        recommendations.push('💾 PNG yerine JPEG/WebP kullanarak dosya boyutunu küçültebilirsiniz.');
      }

      if (format === 'SVG') {
        recommendations.push('⚠️ SVG formatı sosyal platformlarda desteklenmeyebilir. PNG/JPEG kullanın.');
      }

      if (format === 'GIF') {
        recommendations.push('⚠️ GIF formatı OG image için önerilmez. Statik PNG/JPEG kullanın.');
      }

      if (isOptimalSize && isOptimalAspectRatio && isOptimalFileSize && cacheBusting) {
        recommendations.push('✅ OG görseli tüm kriterleri karşılıyor!');
      }

      return {
        url: imageUrl,
        width,
        height,
        aspectRatio,
        aspectRatioLabel,
        fileSize,
        fileSizeFormatted,
        format,
        isOptimalSize,
        isOptimalAspectRatio,
        isOptimalFileSize,
        hasCacheBusting: cacheBusting,
        recommendations
      };
    } catch (error) {
      return {
        url: imageUrl,
        isOptimalSize: false,
        isOptimalAspectRatio: false,
        isOptimalFileSize: false,
        hasCacheBusting: cacheBusting,
        recommendations: [],
        error: (error as Error).message
      };
    }
  }, [formatFileSize, detectImageFormat, hasCacheBusting]);

  const extractMetaContent = useCallback((doc: Document, selectors: string[]): string | null => {
    for (const selector of selectors) {
      const el = doc.querySelector(selector);
      if (el) {
        return el.getAttribute('content') || el.getAttribute('href') || null;
      }
    }
    return null;
  }, []);

  const validateImage = useCallback(async (imageUrl: string | null): Promise<SocialPreviewResult['imagePreview']> => {
    if (!imageUrl) {
      return { isValid: false, error: 'Görsel URL bulunamadı' };
    }

    setImageLoading(true);
    
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        setImageLoading(false);
        const aspectRatio = (img.width / img.height).toFixed(2);
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio,
          isValid: img.width >= OG_IMAGE_MIN_WIDTH && img.height >= OG_IMAGE_MIN_HEIGHT
        });
      };
      
      img.onerror = () => {
        setImageLoading(false);
        resolve({ isValid: false, error: 'Görsel yüklenemedi' });
      };
      
      // Handle relative URLs
      if (imageUrl.startsWith('/')) {
        img.src = window.location.origin + imageUrl;
      } else {
        img.src = imageUrl;
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!img.complete) {
          setImageLoading(false);
          resolve({ isValid: false, error: 'Görsel yükleme zaman aşımı' });
        }
      }, 5000);
    });
  }, []);

  const validateMeta = useCallback((meta: SocialMetaData): SocialPreviewIssue[] => {
    const issues: SocialPreviewIssue[] = [];

    // Title validations
    if (!meta.ogTitle && !meta.title) {
      issues.push({
        level: 'error',
        platform: 'og',
        field: 'og:title',
        message: 'og:title veya title eksik',
        recommendation: 'Sayfanın başlığını og:title meta etiketiyle belirtin'
      });
    } else if (meta.ogTitle && meta.ogTitle.length > 60) {
      issues.push({
        level: 'warning',
        platform: 'og',
        field: 'og:title',
        message: `og:title çok uzun (${meta.ogTitle.length} karakter)`,
        recommendation: 'Başlık 60 karakteri geçmemeli'
      });
    }

    // Description validations
    if (!meta.ogDescription && !meta.description) {
      issues.push({
        level: 'error',
        platform: 'og',
        field: 'og:description',
        message: 'og:description veya meta description eksik',
        recommendation: 'Sayfa açıklamasını og:description ile belirtin'
      });
    } else if (meta.ogDescription && meta.ogDescription.length > 200) {
      issues.push({
        level: 'warning',
        platform: 'og',
        field: 'og:description',
        message: `og:description çok uzun (${meta.ogDescription.length} karakter)`,
        recommendation: 'Açıklama 200 karakteri geçmemeli'
      });
    }

    // Image validations
    if (!meta.ogImage) {
      issues.push({
        level: 'error',
        platform: 'og',
        field: 'og:image',
        message: 'og:image eksik',
        recommendation: 'Sosyal paylaşımlar için 1200x630px boyutunda görsel ekleyin'
      });
    }

    if (!meta.ogUrl) {
      issues.push({
        level: 'warning',
        platform: 'og',
        field: 'og:url',
        message: 'og:url eksik',
        recommendation: 'Canonical URL belirtin'
      });
    }

    if (!meta.ogType) {
      issues.push({
        level: 'info',
        platform: 'og',
        field: 'og:type',
        message: 'og:type belirtilmemiş',
        recommendation: 'website, article, product vb. tip belirtin'
      });
    }

    if (!meta.ogSiteName) {
      issues.push({
        level: 'info',
        platform: 'og',
        field: 'og:site_name',
        message: 'og:site_name eksik',
        recommendation: 'Site adını belirtin'
      });
    }

    // Twitter Card validations
    if (!meta.twitterCard) {
      issues.push({
        level: 'warning',
        platform: 'twitter',
        field: 'twitter:card',
        message: 'twitter:card eksik',
        recommendation: 'summary_large_image veya summary belirtin'
      });
    }

    if (!meta.twitterTitle && !meta.ogTitle && !meta.title) {
      issues.push({
        level: 'error',
        platform: 'twitter',
        field: 'twitter:title',
        message: 'twitter:title eksik (og:title de yok)',
        recommendation: 'Twitter için başlık belirtin veya og:title kullanın'
      });
    }

    if (!meta.twitterDescription && !meta.ogDescription && !meta.description) {
      issues.push({
        level: 'error',
        platform: 'twitter',
        field: 'twitter:description',
        message: 'twitter:description eksik',
        recommendation: 'Twitter için açıklama belirtin'
      });
    }

    if (!meta.twitterImage && !meta.ogImage) {
      issues.push({
        level: 'error',
        platform: 'twitter',
        field: 'twitter:image',
        message: 'twitter:image eksik (og:image de yok)',
        recommendation: 'Twitter için min. 800x418px görsel ekleyin'
      });
    }

    if (!meta.twitterSite) {
      issues.push({
        level: 'info',
        platform: 'twitter',
        field: 'twitter:site',
        message: 'twitter:site eksik',
        recommendation: 'Sitenizin Twitter hesabını @handle formatında belirtin'
      });
    }

    return issues;
  }, []);

  const scanPage = useCallback(async (url?: string) => {
    setIsScanning(true);
    
    try {
      let doc: Document;
      let finalUrl = url || window.location.href;
      
      if (!url || url === window.location.href) {
        doc = document;
      } else {
        const response = await fetch(url);
        const html = await response.text();
        const parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
      }

      const meta: SocialMetaData = {
        // Open Graph
        ogTitle: extractMetaContent(doc, ['meta[property="og:title"]']),
        ogDescription: extractMetaContent(doc, ['meta[property="og:description"]']),
        ogImage: extractMetaContent(doc, ['meta[property="og:image"]', 'meta[property="og:image:url"]']),
        ogUrl: extractMetaContent(doc, ['meta[property="og:url"]']),
        ogType: extractMetaContent(doc, ['meta[property="og:type"]']),
        ogSiteName: extractMetaContent(doc, ['meta[property="og:site_name"]']),
        ogLocale: extractMetaContent(doc, ['meta[property="og:locale"]']),
        
        // Twitter Card
        twitterCard: extractMetaContent(doc, ['meta[name="twitter:card"]', 'meta[property="twitter:card"]']),
        twitterTitle: extractMetaContent(doc, ['meta[name="twitter:title"]', 'meta[property="twitter:title"]']),
        twitterDescription: extractMetaContent(doc, ['meta[name="twitter:description"]', 'meta[property="twitter:description"]']),
        twitterImage: extractMetaContent(doc, ['meta[name="twitter:image"]', 'meta[property="twitter:image"]']),
        twitterSite: extractMetaContent(doc, ['meta[name="twitter:site"]', 'meta[property="twitter:site"]']),
        twitterCreator: extractMetaContent(doc, ['meta[name="twitter:creator"]', 'meta[property="twitter:creator"]']),
        
        // Basic meta
        title: doc.title || null,
        description: extractMetaContent(doc, ['meta[name="description"]']),
        favicon: extractMetaContent(doc, ['link[rel="icon"]', 'link[rel="shortcut icon"]']) || '/favicon.ico',
        canonicalUrl: extractMetaContent(doc, ['link[rel="canonical"]'])
      };

      const issues = validateMeta(meta);
      
      // Validate image dimensions
      const imageUrl = meta.ogImage || meta.twitterImage;
      const imagePreview = await validateImage(imageUrl);
      
      if (imagePreview.isValid === false && imagePreview.error) {
        issues.push({
          level: 'error',
          platform: 'general',
          field: 'image',
          message: imagePreview.error
        });
      } else if (imagePreview.width && imagePreview.height) {
        if (imagePreview.width < OG_IMAGE_MIN_WIDTH || imagePreview.height < OG_IMAGE_MIN_HEIGHT) {
          issues.push({
            level: 'warning',
            platform: 'og',
            field: 'og:image',
            message: `Görsel boyutu yetersiz (${imagePreview.width}x${imagePreview.height})`,
            recommendation: `Önerilen boyut: ${OG_IMAGE_MIN_WIDTH}x${OG_IMAGE_MIN_HEIGHT}px`
          });
        }
        
        // Check Twitter dimensions if different image
        if (meta.twitterImage && meta.twitterImage !== meta.ogImage) {
          const twitterPreview = await validateImage(meta.twitterImage);
          if (twitterPreview.width && twitterPreview.height) {
            if (twitterPreview.width < TWITTER_IMAGE_MIN_WIDTH || twitterPreview.height < TWITTER_IMAGE_MIN_HEIGHT) {
              issues.push({
                level: 'warning',
                platform: 'twitter',
                field: 'twitter:image',
                message: `Twitter görseli yetersiz (${twitterPreview.width}x${twitterPreview.height})`,
                recommendation: `Önerilen boyut: ${TWITTER_IMAGE_MIN_WIDTH}x${TWITTER_IMAGE_MIN_HEIGHT}px`
              });
            }
          }
        }
      }

      // Analyze OG image in detail
      const ogImageAnalysis = await analyzeOGImage(meta.ogImage);

      setResult({
        url: finalUrl,
        meta,
        issues,
        scannedAt: new Date(),
        imagePreview,
        ogImageAnalysis
      });
    } catch (error) {
      console.error('Social preview scan error:', error);
      setResult({
        url: url || window.location.href,
        meta: {
          ogTitle: null, ogDescription: null, ogImage: null, ogUrl: null, ogType: null, ogSiteName: null, ogLocale: null,
          twitterCard: null, twitterTitle: null, twitterDescription: null, twitterImage: null, twitterSite: null, twitterCreator: null,
          title: null, description: null, favicon: null, canonicalUrl: null
        },
        issues: [{
          level: 'error',
          platform: 'general',
          field: 'scan',
          message: `Sayfa taranamadı: ${(error as Error).message}`
        }],
        scannedAt: new Date()
      });
    } finally {
      setIsScanning(false);
    }
  }, [extractMetaContent, validateMeta, validateImage, analyzeOGImage]);

  // Auto-scan current page on mount
  useEffect(() => {
    scanPage();
  }, []);

  return {
    result,
    isScanning,
    imageLoading,
    scanPage
  };
};
