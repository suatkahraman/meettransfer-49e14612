import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Code, Star, Search, Home, RefreshCw, ExternalLink } from 'lucide-react';

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
}

interface ScanResult {
  url: string;
  schemas: SchemaScript[];
  aggregateRatings: AggregateRating[];
  scannedAt: Date;
}

const SEODebugPage = () => {
  const [currentPageSchemas, setCurrentPageSchemas] = useState<SchemaScript[]>([]);
  const [currentPageRatings, setCurrentPageRatings] = useState<AggregateRating[]>([]);
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
    };

    scanCurrentPage();
    const timer = setTimeout(scanCurrentPage, 2000);
    return () => clearTimeout(timer);
  }, []);

  const parsePageSchemas = (doc: Document): { schemas: SchemaScript[]; ratings: AggregateRating[] } => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const foundSchemas: SchemaScript[] = [];
    const foundRatings: AggregateRating[] = [];

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

        foundSchemas.push({
          index: index + 1,
          type: schemaType,
          hasAggregateRating,
          aggregateRating,
          raw: JSON.stringify(parsed, null, 2),
        });
      } catch (e) {
        foundSchemas.push({
          index: index + 1,
          type: 'Parse Error',
          hasAggregateRating: false,
          raw: script.textContent || 'Empty',
        });
      }
    });

    return { schemas: foundSchemas, ratings: foundRatings };
  };

  const parseHtmlString = (html: string): { schemas: SchemaScript[]; ratings: AggregateRating[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return parsePageSchemas(doc);
  };

  const scanUrl = async (url: string) => {
    setIsScanning(true);
    try {
      // Fetch the page HTML
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
        },
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
      {/* Ratings Detail */}
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

      {/* All Schemas */}
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
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">SEO Debug - JSON-LD Inspector</h1>
          <p className="text-sm text-muted-foreground">
            Sayfalardaki JSON-LD schema scriptlerini ve aggregateRating değerlerini inceleyin
          </p>
        </div>

        {/* Quick Scan Buttons */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4" />
              Sayfa Tara
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick scan buttons */}
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

            {/* Custom URL input */}
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

        {/* Tabs */}
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

        {/* Content */}
        {activeTab === 'current' ? (
          <div className="space-y-4">
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
                  {renderSummaryCard(result.aggregateRatings, new URL(result.url).pathname)}
                  {renderSchemaList(result.schemas, result.aggregateRatings)}
                </div>
              ))
            )}
          </div>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kullanım</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>Aggregate Ratings</strong> sayısı 1'den fazlaysa Google "multiple ratings" hatası verir</p>
            <p>• <strong>Ana Sayfa</strong> butonuyla canlı sitenin ana sayfasını tarayın</p>
            <p>• Özel URL girerek herhangi bir sayfayı tarayabilirsiniz</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEODebugPage;
