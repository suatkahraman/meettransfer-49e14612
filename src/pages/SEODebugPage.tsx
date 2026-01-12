import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Code, Star } from 'lucide-react';

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

const SEODebugPage = () => {
  const [schemas, setSchemas] = useState<SchemaScript[]>([]);
  const [aggregateRatings, setAggregateRatings] = useState<AggregateRating[]>([]);

  useEffect(() => {
    const scanSchemas = () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const foundSchemas: SchemaScript[] = [];
      const foundRatings: AggregateRating[] = [];

      scripts.forEach((script, index) => {
        try {
          const content = script.textContent || '';
          const parsed = JSON.parse(content);
          
          const schemaType = parsed['@type'] || 'Unknown';
          let hasAggregateRating = false;
          let aggregateRating: AggregateRating | undefined;

          // Check for aggregateRating in the schema
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

      setSchemas(foundSchemas);
      setAggregateRatings(foundRatings);
    };

    // Initial scan
    scanSchemas();

    // Re-scan after a delay to catch dynamically added schemas
    const timer = setTimeout(scanSchemas, 2000);
    return () => clearTimeout(timer);
  }, []);

  const hasMultipleRatings = aggregateRatings.length > 1;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">SEO Debug - JSON-LD Inspector</h1>
          <p className="text-muted-foreground">
            Sayfadaki tüm JSON-LD schema scriptlerini ve aggregateRating değerlerini inceleyin
          </p>
        </div>

        {/* Summary Card */}
        <Card className={hasMultipleRatings ? 'border-destructive' : 'border-green-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasMultipleRatings ? (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Multiple Aggregate Ratings Detected!</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Schema OK</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-foreground">{schemas.length}</div>
                <div className="text-sm text-muted-foreground">JSON-LD Scripts</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className={`text-2xl font-bold ${hasMultipleRatings ? 'text-destructive' : 'text-foreground'}`}>
                  {aggregateRatings.length}
                </div>
                <div className="text-sm text-muted-foreground">Aggregate Ratings</div>
              </div>
              {aggregateRatings[0] && (
                <>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground flex items-center justify-center gap-1">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      {aggregateRatings[0].ratingValue}
                    </div>
                    <div className="text-sm text-muted-foreground">Rating Value</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{aggregateRatings[0].reviewCount}</div>
                    <div className="text-sm text-muted-foreground">Review Count</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aggregate Ratings Detail */}
        {aggregateRatings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Aggregate Ratings ({aggregateRatings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aggregateRatings.map((rating, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <Badge variant="outline">{rating.source}</Badge>
                    <Badge variant="secondary">{rating.schemaType}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold">{rating.ratingValue}</span>
                    </div>
                    <span className="text-muted-foreground">|</span>
                    <span>{rating.reviewCount} reviews</span>
                    {rating.bestRating && (
                      <span className="text-xs text-muted-foreground">
                        (Best: {rating.bestRating}, Worst: {rating.worstRating})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Schemas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              All JSON-LD Scripts ({schemas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schemas.map((schema) => (
                <div key={schema.index} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted">
                    <div className="flex items-center gap-2">
                      <Badge>#{schema.index}</Badge>
                      <Badge variant="secondary">{schema.type}</Badge>
                      {schema.hasAggregateRating && (
                        <Badge variant="default" className="bg-yellow-500">
                          Has Rating
                        </Badge>
                      )}
                    </div>
                  </div>
                  <details className="group">
                    <summary className="px-3 py-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Click to expand JSON
                    </summary>
                    <pre className="p-3 bg-black text-green-400 text-xs overflow-x-auto max-h-80">
                      {schema.raw}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Nasıl Kullanılır?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              1. <strong>Ana sayfaya</strong> gidin ve sayfa yüklendikten sonra bu debug sayfasını açın
            </p>
            <p>
              2. <strong>Aggregate Ratings</strong> sayısı 1'den fazlaysa Google "multiple ratings" hatası verecektir
            </p>
            <p>
              3. <strong>Rating Value</strong> ve <strong>Review Count</strong> değerlerini kontrol edin
            </p>
            <p>
              4. Sorunu çözmek için SchemaOrg bileşeninde tek bir aggregateRating olmalı
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SEODebugPage;
