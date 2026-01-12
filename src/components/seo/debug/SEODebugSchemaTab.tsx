import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Star, Code, AlertTriangle, Info } from 'lucide-react';
import { SchemaScript, AggregateRating, ValidationIssue } from './types';
import { getIssueLevelVariant } from './utils';

interface SEODebugSchemaTabProps {
  schemas: SchemaScript[];
  ratings: AggregateRating[];
  issues: ValidationIssue[];
}

export const SEODebugSchemaTab = ({ schemas, ratings, issues }: SEODebugSchemaTabProps) => {
  const errorCount = issues.filter(i => i.level === 'error').length;
  const warningCount = issues.filter(i => i.level === 'warning').length;
  const infoCount = issues.filter(i => i.level === 'info').length;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Özet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{schemas.length}</div>
              <div className="text-xs text-muted-foreground">JSON-LD Script</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{ratings.length}</div>
              <div className="text-xs text-muted-foreground">Aggregate Rating</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${errorCount > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {errorCount}
              </div>
              <div className="text-xs text-muted-foreground">Hata</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${warningCount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {warningCount}
              </div>
              <div className="text-xs text-muted-foreground">Uyarı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {issues.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Validasyon Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2 p-2 rounded text-sm ${
                    issue.level === 'error' ? 'bg-destructive/10' : 
                    issue.level === 'warning' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                  }`}
                >
                  {issue.level === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  ) : issue.level === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <Badge variant={getIssueLevelVariant(issue.level)} className="mr-2 text-xs">
                      {issue.schemaType}
                    </Badge>
                    <span className="font-medium">{issue.field}:</span> {issue.message}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ratings */}
      {ratings.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-4 w-4 text-yellow-500" />
              Aggregate Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratings.map((rating, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <span className="text-xl font-bold">{rating.ratingValue}</span>
                      <span className="text-muted-foreground">/ {rating.bestRating || 5}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rating.reviewCount} değerlendirme</p>
                  </div>
                  <Badge variant="outline">{rating.schemaType}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schemas */}
      {schemas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="h-4 w-4" />
              JSON-LD Scripts ({schemas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schemas.map((schema) => (
                <div key={schema.index} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-2 bg-muted">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">#{schema.index}</Badge>
                      <span className="font-medium">{schema.type}</span>
                    </div>
                    {schema.hasAggregateRating ? (
                      <Badge className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Rating
                      </Badge>
                    ) : (
                      <Badge variant="outline">No Rating</Badge>
                    )}
                  </div>
                  <pre className="p-2 text-xs overflow-x-auto max-h-48 bg-background">
                    {schema.raw}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {schemas.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Bu sayfada JSON-LD script bulunamadı</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
