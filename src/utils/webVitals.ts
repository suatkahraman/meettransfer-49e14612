import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

// Performance thresholds based on Google's recommendations
const THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 },
  INP: { good: 200, needsImprovement: 500 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
} as const;

type MetricName = keyof typeof THRESHOLDS;

function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}

function formatValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function logMetric(metric: Metric) {
  const rating = getRating(metric.name as MetricName, metric.value);
  const formattedValue = formatValue(metric.name, metric.value);
  
  const colors = {
    good: 'color: #0cce6b; font-weight: bold',
    'needs-improvement': 'color: #ffa400; font-weight: bold',
    poor: 'color: #ff4e42; font-weight: bold',
  };

  console.log(
    `%c[Web Vitals] ${metric.name}: ${formattedValue} (${rating})`,
    colors[rating]
  );

  // Log detailed info in development
  if (import.meta.env.DEV) {
    console.log(`  → ID: ${metric.id}`);
    console.log(`  → Delta: ${formatValue(metric.name, metric.delta)}`);
    console.log(`  → Navigation Type: ${metric.navigationType}`);
  }
}

// Store metrics for later analysis
const collectedMetrics: Record<string, Metric> = {};

export function getCollectedMetrics() {
  return { ...collectedMetrics };
}

export function getWebVitalsSummary(): { score: number; metrics: Record<string, { value: number; rating: string }> } {
  const metrics: Record<string, { value: number; rating: string }> = {};
  let goodCount = 0;
  let totalCount = 0;

  for (const [name, metric] of Object.entries(collectedMetrics)) {
    const rating = getRating(name as MetricName, metric.value);
    metrics[name] = { value: metric.value, rating };
    if (rating === 'good') goodCount++;
    totalCount++;
  }

  // Score out of 100 based on percentage of "good" metrics
  const score = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;

  return { score, metrics };
}

// Initialize web vitals measurement
export function initWebVitals(options?: { debug?: boolean; reportToAnalytics?: boolean }) {
  const debug = options?.debug === true;

  const handleMetric = (metric: Metric) => {
    collectedMetrics[metric.name] = metric;

    if (debug) {
      logMetric(metric);
    }

    // Optional: Send to analytics endpoint
    if (options?.reportToAnalytics) {
      // Could send to backend function or analytics service
      // For now, just store in sessionStorage for later inspection
      try {
        const stored = sessionStorage.getItem('web_vitals') || '{}';
        const data = JSON.parse(stored);
        data[metric.name] = {
          value: metric.value,
          rating: getRating(metric.name as MetricName, metric.value),
          timestamp: Date.now(),
        };
        sessionStorage.setItem('web_vitals', JSON.stringify(data));
      } catch {
        // Ignore storage errors
      }
    }
  };

  // Core Web Vitals
  onLCP(handleMetric);
  onINP(handleMetric);
  onCLS(handleMetric);

  // Additional metrics
  onFCP(handleMetric);
  onTTFB(handleMetric);

  // Log summary after page is fully loaded (debug only)
  if (debug && typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const summary = getWebVitalsSummary();
        if (Object.keys(summary.metrics).length > 0) {
          console.log(
            '%c[Web Vitals] Summary - Score: ' + summary.score + '/100',
            'color: #4285f4; font-weight: bold; font-size: 14px'
          );
          console.table(summary.metrics);
        }
      }, 3000); // Wait for metrics to settle
    });
  }
}
