import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Code, Star, Search, Home, RefreshCw, ExternalLink, AlertTriangle, Info } from 'lucide-react';

interface AggregateRating {
  ratingValue: string | number;
  reviewCount: string | number;
  bestRating?: string | number;
  worstRating?: string | number;
  source: string;
  schemaType: string;
}

interface SchemaScript {
  index: number;
  type: string;
  hasAggregateRating: boolean;
  aggregateRating?: AggregateRating;
  raw: string;
  parsed?: Record<string, unknown>;
}

interface ValidationIssue {
  level: 'error' | 'warning' | 'info';
  schemaIndex: number;
  schemaType: string;
  field: string;
  message: string;
}

interface ScanResult {
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  validationIssues: ValidationIssue[];
  scannedAt: Date;
}

// Schema.org validation rules
const validateSchema = (parsed: Record<string, unknown>, index: number): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const schemaType = (parsed['@type'] as string) || 'Unknown';

  // Check for @context
  if (!parsed['@context']) {
    issues.push({
      level: 'error',
      schemaIndex: index,
      schemaType,
      field: '@context',
      message: '@context eksik - "https://schema.org" olmalı'
    });
  }

  // LocalBusiness validations
  if (schemaType === 'LocalBusiness' || schemaType === 'Organization') {
    if (!parsed['name']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'name', message: 'name alanı zorunlu' });
    }
    if (!parsed['url']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'url', message: 'url alanı önerilir' });
    }
    if (!parsed['telephone'] && !parsed['email']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'contact', message: 'telephone veya email önerilir' });
    }
    if (!parsed['address']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'address', message: 'address alanı önerilir' });
    }
  }

  // AggregateRating validations
  if (parsed['aggregateRating']) {
    const rating = parsed['aggregateRating'] as Record<string, unknown>;
    
    if (!rating['ratingValue']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'aggregateRating.ratingValue', message: 'ratingValue zorunlu' });
    } else {
      const val = Number(rating['ratingValue']);
      if (isNaN(val) || val < 1 || val > 5) {
        issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'aggregateRating.ratingValue', message: 'ratingValue 1-5 arasında olmalı' });
      }
    }
    
    if (!rating['reviewCount'] && !rating['ratingCount']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'aggregateRating.reviewCount', message: 'reviewCount veya ratingCount zorunlu' });
    }
    
    if (!rating['bestRating']) {
      issues.push({ level: 'info', schemaIndex: index, schemaType, field: 'aggregateRating.bestRating', message: 'bestRating belirtilmemiş (varsayılan: 5)' });
    }
  }

  // Service validations
  if (schemaType === 'Service' || schemaType === 'TransportationService') {
    if (!parsed['provider']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'provider', message: 'provider alanı önerilir' });
    }
    if (!parsed['areaServed']) {
      issues.push({ level: 'info', schemaIndex: index, schemaType, field: 'areaServed', message: 'areaServed belirtilmemiş' });
    }
  }

  // WebSite validations
  if (schemaType === 'WebSite') {
    if (!parsed['url']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'url', message: 'url alanı zorunlu' });
    }
  }

  // Article validations
  if (schemaType === 'Article' || schemaType === 'BlogPosting') {
    if (!parsed['headline']) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'headline', message: 'headline alanı zorunlu' });
    }
    if (!parsed['author']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'author', message: 'author alanı önerilir' });
    }
    if (!parsed['datePublished']) {
      issues.push({ level: 'warning', schemaIndex: index, schemaType, field: 'datePublished', message: 'datePublished alanı önerilir' });
    }
  }

  // FAQPage validations
  if (schemaType === 'FAQPage') {
    if (!parsed['mainEntity'] || !Array.isArray(parsed['mainEntity']) || (parsed['mainEntity'] as unknown[]).length === 0) {
      issues.push({ level: 'error', schemaIndex: index, schemaType, field: 'mainEntity', message: 'mainEntity dizisi zorunlu ve en az bir soru içermeli' });
    }
  }

  return issues;
};

const SEODebugPage = () => {
  const [currentPageSchemas, setCurrentPageSchemas] = useState<SchemaScript[]>([]);
  const [currentPageRatings, setCurrentPageRatings] = useState<AggregateRating[]>([]);
  const [currentPageIssues, setCurrentPageIssues] = useState<ValidationIssue[]>([]);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [customUrl, setCustomUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'scanned'>('current');

  // Scan current page
  useEffect(() => {
    const scanCurrentPage = () => {
      const result = parsePageSchemas(document);
      setCurrentPageSchemas(result.schemas);
      setCurrentPageRatings(result.ratings);
      setCurrentPageIssues(result.issues);
    };

    scanCurrentPage();
    const timer = setTimeout(scanCurrentPage, 2000);
    return () => clearTimeout(timer);
  }, []);

  const parsePageSchemas = (doc: Document): { schemas: SchemaScript[]; ratings: AggregateRating[]; issues: ValidationIssue[] } => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const foundSchemas: SchemaScript[] = [];
    const foundRatings: AggregateRating[] = [];
    let allIssues: ValidationIssue[] = [];

    scripts.forEach((script, index) => {
      try {
        const content = script.textContent || '';
        const parsed = JSON.parse(content);
        
        const schemaType = parsed['@type'] || 'Unknown';
        let hasAggregateRating = false;
        let aggregateRating: AggregateRating | undefined;

        if (parsed.aggregateRating) {
          hasAggregateRating = true;
          aggregateRating = {
            ratingValue: parsed.aggregateRating.ratingValue,
            reviewCount: parsed.aggregateRating.reviewCount,
            bestRating: parsed.aggregateRating.bestRating,
            worstRating: parsed.aggregateRating.worstRating,
            source: `Script #${index + 1}`,
            schemaType: schemaType,
          };
          foundRatings.push(aggregateRating);
        }

        // Validate schema
        const schemaIssues = validateSchema(parsed, index + 1);
        allIssues = [...allIssues, ...schemaIssues];

        foundSchemas.push({
          index: index + 1,
          type: schemaType,
          hasAggregateRating,
          aggregateRating,
          raw: JSON.stringify(parsed, null, 2),
          parsed,
        });
      } catch (e) {
        foundSchemas.push({
          index: index + 1,
          type: 'Parse Error',
          hasAggregateRating: false,
          raw: script.textContent || 'Empty',
        });
        allIssues.push({
          level: 'error',
          schemaIndex: index + 1,
          schemaType: 'Unknown',
          field: 'JSON',
          message: 'JSON parse hatası - geçersiz format'
        });
      }
    });

    // Check for multiple aggregate ratings (global issue)
    if (foundRatings.length > 1) {
      allIssues.unshift({
        level: 'error',
        schemaIndex: 0,
        schemaType: 'Global',
        field: 'aggregateRating',
        message: `Birden fazla aggregateRating tespit edildi (${foundRatings.length} adet) - Google "multiple ratings" hatası verecektir!`
      });
    }

    return { schemas: foundSchemas, ratings: foundRatings, issues: allIssues };
  };

  const parseHtmlString = (html: string): { schemas: SchemaScript[]; ratings: AggregateRating[]; issues: ValidationIssue[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return parsePageSchemas(doc);
  };

  const scanUrl = async (url: string) => {
    setIsScanning(true);
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const result = parseHtmlString(html);

      const scanResult: ScanResult = {
        url,
        schemas: result.schemas,
        aggregateRatings: result.ratings,
        validationIssues: result.issues,
        scannedAt: new Date(),
      };

      setScanResults(prev => [scanResult, ...prev.filter(r => r.url !== url)]);
      setActiveTab('scanned');
    } catch (error) {
      console.error('Scan error:', error);
      alert(`Sayfa taranamadı: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsScanning(false);
    }
  };

  const scanHomepage = () => {
    const baseUrl = window.location.origin;
    scanUrl(baseUrl + '/');
  };

  const scanCustomUrl = () => {
    if (!customUrl) return;
    let url = customUrl;
    if (!url.startsWith('http')) {
      url = window.location.origin + (url.startsWith('/') ? url : '/' + url);
    }
    scanUrl(url);
  };

  const quickScanUrls = [
    { label: 'Ana Sayfa', path: '/' },
    { label: 'Reviews', path: '/reviews' },
    { label: 'Istanbul Transfer', path: '/istanbul-transfer' },
    { label: 'About', path: '/about' },
  ];

  const getIssueCounts = (issues: ValidationIssue[]) => {
    return {
      errors: issues.filter(i => i.level === 'error').length,
      warnings: issues.filter(i => i.level === 'warning').length,
      infos: issues.filter(i => i.level === 'info').length,
    };
  };

  const renderValidationCard = (issues: ValidationIssue[]) => {
    const counts = getIssueCounts(issues);
    const hasErrors = counts.errors > 0;
    const hasWarnings = counts.warnings > 0;

    return (
      <Card className={hasErrors ? 'border-destructive' : hasWarnings ? 'border-yellow-500' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasErrors ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Validasyon Hataları</span>
              </>
            ) : hasWarnings ? (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-600">Uyarılar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Validasyon Başarılı</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xl font-bold text-destructive">{counts.errors}</div>
              <div className="text-xs text-muted-foreground">Hata</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{counts.warnings}</div>
              <div className="text-xs text-muted-foreground">Uyarı</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{counts.infos}</div>
              <div className="text-xs text-muted-foreground">Bilgi</div>
            </div>
          </div>

          {issues.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                    issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                    issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
                    'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                   issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                   <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                  <div>
                    <span className="font-medium">{issue.schemaType}</span>
                    {issue.schemaIndex > 0 && <span className="opacity-70"> (#{issue.schemaIndex})</span>}
                    <span className="opacity-70"> → {issue.field}:</span>
                    <span className="ml-1">{issue.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSummaryCard = (ratings: AggregateRating[], title: string) => {
    const hasMultipleRatings = ratings.length > 1;
    
    return (
      <Card className={hasMultipleRatings ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasMultipleRatings ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Multiple Ratings! ({title})</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">OK ({title})</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className={`text-xl font-bold ${hasMultipleRatings ? 'text-destructive' : 'text-foreground'}`}>
                {ratings.length}
              </div>
              <div className="text-xs text-muted-foreground">Ratings</div>
            </div>
            {ratings[0] && (
              <>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    {ratings[0].ratingValue}
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground">{ratings[0].reviewCount}</div>
                  <div className="text-xs text-muted-foreground">Reviews</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-xl font-bold text-foreground">{ratings[0].schemaType}</div>
                  <div className="text-xs text-muted-foreground">Type</div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSchemaList = (schemas: SchemaScript[], ratings: AggregateRating[]) => (
    <>
      {ratings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4" />
              Aggregate Ratings ({ratings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ratings.map((rating, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                >
                  <Badge variant="outline" className="text-xs">{rating.source}</Badge>
                  <Badge variant="secondary" className="text-xs">{rating.schemaType}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{rating.ratingValue}</span>
                  </div>
                  <span className="text-muted-foreground">|</span>
                  <span>{rating.reviewCount} reviews</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Code className="h-4 w-4" />
            JSON-LD Scripts ({schemas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {schemas.map((schema) => (
              <div key={schema.index} className="border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 p-2 bg-muted">
                  <Badge className="text-xs">#{schema.index}</Badge>
                  <Badge variant="secondary" className="text-xs">{schema.type}</Badge>
                  {schema.hasAggregateRating && (
                    <Badge variant="default" className="bg-yellow-500 text-xs">Rating</Badge>
                  )}
                </div>
                <details className="group">
                  <summary className="px-3 py-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    JSON göster
                  </summary>
                  <pre className="p-2 bg-black text-green-400 text-[10px] overflow-x-auto max-h-60">
                    {schema.raw}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">SEO Debug - JSON-LD Validator</h1>
          <p className="text-sm text-muted-foreground">
            Schema.org validasyonu ile JSON-LD scriptlerini kontrol edin
          </p>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Sayfa Tara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={scanHomepage}
                disabled={isScanning}
                variant="default"
                size="sm"
              >
                <Home className="h-4 w-4 mr-1" />
                Ana Sayfa
                {isScanning && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
              </Button>
              {quickScanUrls.slice(1).map((item) => (
                <Button
                  key={item.path}
                  onClick={() => scanUrl(window.location.origin + item.path)}
                  disabled={isScanning}
                  variant="outline"
                  size="sm"
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="/sayfa-yolu veya tam URL"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scanCustomUrl()}
                className="text-sm"
              />
              <Button
                onClick={scanCustomUrl}
                disabled={isScanning || !customUrl}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'current'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Bu Sayfa ({currentPageSchemas.length})
          </button>
          <button
            onClick={() => setActiveTab('scanned')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'scanned'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Taranan Sayfalar ({scanResults.length})
          </button>
        </div>

        {activeTab === 'current' ? (
          <div className="space-y-4">
            {renderValidationCard(currentPageIssues)}
            {renderSummaryCard(currentPageRatings, 'Bu Sayfa')}
            {renderSchemaList(currentPageSchemas, currentPageRatings)}
          </div>
        ) : (
          <div className="space-y-6">
            {scanResults.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Henüz sayfa taranmadı. Yukarıdaki butonları kullanarak sayfa tarayın.
                </CardContent>
              </Card>
            ) : (
              scanResults.map((result, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {result.url}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      ({result.scannedAt.toLocaleTimeString()})
                    </span>
                  </div>
                  {renderValidationCard(result.validationIssues)}
                  {renderSummaryCard(result.aggregateRatings, new URL(result.url).pathname)}
                  {renderSchemaList(result.schemas, result.aggregateRatings)}
                </div>
              ))
            )}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Validasyon Kuralları</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong className="text-destructive">Hata:</strong> Zorunlu alanlar eksik veya geçersiz format</p>
            <p>• <strong className="text-yellow-600">Uyarı:</strong> Önerilen alanlar eksik</p>
            <p>• <strong className="text-blue-600">Bilgi:</strong> Opsiyonel iyileştirmeler</p>
            <p className="pt-2">• Birden fazla aggregateRating olması Google "multiple ratings" hatasına neden olur</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEODebugPage;
