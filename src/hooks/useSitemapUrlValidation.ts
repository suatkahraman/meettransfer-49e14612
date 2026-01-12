import { useState, useCallback } from 'react';

export interface UrlValidationResult {
  url: string;
  status: number | null;
  statusText: string;
  ok: boolean;
  error?: string;
  responseTime?: number;
}

export interface SitemapUrlValidation {
  results: UrlValidationResult[];
  summary: {
    total: number;
    ok: number;
    errors: number;
    pending: number;
  };
  isValidating: boolean;
  progress: number;
  startedAt: Date | null;
  completedAt: Date | null;
}

export const useSitemapUrlValidation = () => {
  const [results, setResults] = useState<UrlValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [completedAt, setCompletedAt] = useState<Date | null>(null);

  const validateUrls = useCallback(async (urls: string[], batchSize: number = 5) => {
    setIsValidating(true);
    setResults([]);
    setProgress(0);
    setStartedAt(new Date());
    setCompletedAt(null);

    const validationResults: UrlValidationResult[] = [];
    const totalUrls = urls.length;

    // Process URLs in batches to avoid overwhelming the server
    for (let i = 0; i < totalUrls; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (url): Promise<UrlValidationResult> => {
        const startTime = performance.now();
        
        try {
          // Use HEAD request for faster validation (only get headers, not body)
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache',
          });
          
          const responseTime = Math.round(performance.now() - startTime);
          
          return {
            url,
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            responseTime,
          };
        } catch (error) {
          // If HEAD fails, try GET (some servers don't support HEAD)
          try {
            const response = await fetch(url, {
              method: 'GET',
              mode: 'cors',
              cache: 'no-cache',
            });
            
            const responseTime = Math.round(performance.now() - startTime);
            
            return {
              url,
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
              responseTime,
            };
          } catch (getError) {
            return {
              url,
              status: null,
              statusText: 'Network Error',
              ok: false,
              error: getError instanceof Error ? getError.message : 'CORS veya ağ hatası',
            };
          }
        }
      });

      const batchResults = await Promise.all(batchPromises);
      validationResults.push(...batchResults);
      
      setResults([...validationResults]);
      setProgress(Math.round((validationResults.length / totalUrls) * 100));
    }

    setIsValidating(false);
    setCompletedAt(new Date());
    
    return validationResults;
  }, []);

  const summary = {
    total: results.length,
    ok: results.filter(r => r.ok).length,
    errors: results.filter(r => !r.ok).length,
    pending: 0,
  };

  const reset = useCallback(() => {
    setResults([]);
    setProgress(0);
    setStartedAt(null);
    setCompletedAt(null);
    setIsValidating(false);
  }, []);

  return {
    results,
    summary,
    isValidating,
    progress,
    startedAt,
    completedAt,
    validateUrls,
    reset,
  };
};
