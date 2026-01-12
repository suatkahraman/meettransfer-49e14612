import { useState, useCallback, useEffect } from 'react';

export interface WebVitalMetric {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  description: string;
}

export interface WebVitalsResult {
  metrics: WebVitalMetric[];
  overallScore: 'good' | 'needs-improvement' | 'poor';
  scannedAt: Date;
  pageUrl: string;
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  INP: { good: 200, needsImprovement: 500 }, // ms
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 800, needsImprovement: 1800 }, // ms
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
  LCP: 'Largest Contentful Paint - En büyük içerik öğesinin yüklenme süresi',
  FID: 'First Input Delay - İlk kullanıcı etkileşimine yanıt süresi',
  CLS: 'Cumulative Layout Shift - Sayfa düzeni kayma skoru',
  INP: 'Interaction to Next Paint - Etkileşim yanıt süresi',
  FCP: 'First Contentful Paint - İlk içerik boyama süresi',
  TTFB: 'Time to First Byte - İlk bayt alım süresi',
};

const getRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
};

export const useCoreWebVitals = () => {
  const [result, setResult] = useState<WebVitalsResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<Partial<Record<string, WebVitalMetric>>>({});

  // Measure using Performance API
  const measurePerformance = useCallback((): WebVitalMetric[] => {
    const metrics: WebVitalMetric[] = [];

    // TTFB - Time to First Byte
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0];
      const ttfb = nav.responseStart - nav.requestStart;
      if (ttfb > 0) {
        metrics.push({
          name: 'TTFB',
          value: Math.round(ttfb),
          rating: getRating('TTFB', ttfb),
          description: METRIC_DESCRIPTIONS.TTFB,
        });
      }
    }

    // FCP - First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      metrics.push({
        name: 'FCP',
        value: Math.round(fcpEntry.startTime),
        rating: getRating('FCP', fcpEntry.startTime),
        description: METRIC_DESCRIPTIONS.FCP,
      });
    }

    // LCP - Largest Contentful Paint (using PerformanceObserver data if available)
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint') as PerformanceEntry[];
    if (lcpEntries.length > 0) {
      const lastLcp = lcpEntries[lcpEntries.length - 1];
      metrics.push({
        name: 'LCP',
        value: Math.round(lastLcp.startTime),
        rating: getRating('LCP', lastLcp.startTime),
        description: METRIC_DESCRIPTIONS.LCP,
      });
    }

    // CLS - Cumulative Layout Shift (estimate from layout-shift entries)
    const layoutShiftEntries = performance.getEntriesByType('layout-shift') as (PerformanceEntry & { value: number; hadRecentInput: boolean })[];
    let clsValue = 0;
    layoutShiftEntries.forEach(entry => {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
      }
    });
    if (layoutShiftEntries.length > 0 || clsValue === 0) {
      metrics.push({
        name: 'CLS',
        value: Math.round(clsValue * 1000) / 1000,
        rating: getRating('CLS', clsValue),
        description: METRIC_DESCRIPTIONS.CLS,
      });
    }

    return metrics;
  }, []);

  // Set up PerformanceObserver for real-time metrics
  useEffect(() => {
    const observers: PerformanceObserver[] = [];

    try {
      // LCP Observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          setLiveMetrics(prev => ({
            ...prev,
            LCP: {
              name: 'LCP',
              value: Math.round(lastEntry.startTime),
              rating: getRating('LCP', lastEntry.startTime),
              description: METRIC_DESCRIPTIONS.LCP,
            },
          }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      observers.push(lcpObserver);
    } catch (e) {
      // LCP not supported
    }

    try {
      // CLS Observer
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        setLiveMetrics(prev => ({
          ...prev,
          CLS: {
            name: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            rating: getRating('CLS', clsValue),
            description: METRIC_DESCRIPTIONS.CLS,
          },
        }));
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      observers.push(clsObserver);
    } catch (e) {
      // CLS not supported
    }

    try {
      // FID/INP Observer
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & { processingStart: number })[]) {
          const delay = entry.processingStart - entry.startTime;
          setLiveMetrics(prev => ({
            ...prev,
            FID: {
              name: 'FID',
              value: Math.round(delay),
              rating: getRating('FID', delay),
              description: METRIC_DESCRIPTIONS.FID,
            },
          }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      observers.push(fidObserver);
    } catch (e) {
      // FID not supported
    }

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, []);

  const scanWebVitals = useCallback(() => {
    setIsScanning(true);

    // Give time for metrics to settle
    setTimeout(() => {
      const metrics = measurePerformance();

      // Merge with live metrics
      const allMetrics = [...metrics];
      Object.values(liveMetrics).forEach(lm => {
        if (lm && !allMetrics.find(m => m.name === lm.name)) {
          allMetrics.push(lm);
        }
      });

      // Calculate overall score
      const ratings = allMetrics.map(m => m.rating);
      let overallScore: 'good' | 'needs-improvement' | 'poor' = 'good';
      if (ratings.includes('poor')) {
        overallScore = 'poor';
      } else if (ratings.includes('needs-improvement')) {
        overallScore = 'needs-improvement';
      }

      setResult({
        metrics: allMetrics,
        overallScore,
        scannedAt: new Date(),
        pageUrl: window.location.href,
      });

      setIsScanning(false);
    }, 1000);
  }, [measurePerformance, liveMetrics]);

  return {
    result,
    liveMetrics,
    isScanning,
    scanWebVitals,
  };
};
