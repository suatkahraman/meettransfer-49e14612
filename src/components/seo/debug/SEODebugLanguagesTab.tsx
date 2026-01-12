import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Languages, Star, Globe, Code } from 'lucide-react';
import { type LanguageScanResult, type LanguageComparisonSummary } from './types';

interface SEODebugLanguagesTabProps {
  languageScanResults: LanguageScanResult[];
  getLanguageComparisonSummary: () => LanguageComparisonSummary;
}

export const SEODebugLanguagesTab = ({ 
  languageScanResults,
  getLanguageComparisonSummary 
}: SEODebugLanguagesTabProps) => {
  if (languageScanResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz dil taraması yapılmadı. Yukarıdaki "Tüm Dilleri Tara" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  const summary = getLanguageComparisonSummary();

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={summary.languagesWithErrors > 0 || summary.inconsistentRatings ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {summary.languagesWithErrors > 0 || summary.inconsistentRatings ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Dil Karşılaştırması - Sorunlar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Dil Karşılaştırması - Tutarlı</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="text-xl font-bold">{summary.totalLanguages}</div>
              <div className="text-xs text-muted-foreground">Toplam Dil</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-xl font-bold text-green-600">{summary.scannedLanguages}</div>
              <div className="text-xs text-muted-foreground">Başarılı</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xl font-bold text-destructive">{summary.languagesWithErrors}</div>
              <div className="text-xs text-muted-foreground">Hatalı</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{summary.languagesWithRatings}</div>
              <div className="text-xs text-muted-foreground">Rating Var</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.inconsistentRatings ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.inconsistentRatings ? 'text-destructive' : 'text-green-600'}`}>
                {summary.inconsistentRatings ? '✗' : '✓'}
              </div>
              <div className="text-xs text-muted-foreground">Rating Tutarlı</div>
            </div>
          </div>

          {summary.inconsistentRatings && (
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Farklı dillerde farklı rating değerleri tespit edildi. Tüm dillerde aynı değer olmalı!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language-by-language comparison table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" />
            Dil Bazlı Sonuçlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Dil</th>
                  <th className="text-left py-2 px-3">URL</th>
                  <th className="text-center py-2 px-3">Schema</th>
                  <th className="text-center py-2 px-3">Rating</th>
                  <th className="text-center py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {languageScanResults.map((result, idx) => {
                  const errorCount = result.validationIssues.filter(i => i.level === 'error').length;
                  const warningCount = result.validationIssues.filter(i => i.level === 'warning').length;

                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{result.language}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs truncate block max-w-[200px]"
                        >
                          {result.path}
                        </a>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">Hata</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{result.schemas.length}</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.aggregateRatings.length > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs">{result.aggregateRatings[0]?.ratingValue}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                        ) : errorCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                        ) : warningCount > 0 ? (
                          <Badge className="bg-yellow-500 text-xs">{warningCount} uyarı</Badge>
                        ) : (
                          <Badge className="bg-green-500 text-xs">OK</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed results (collapsible) */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
          <Code className="h-4 w-4" />
          Detaylı Sonuçlar
        </summary>
        <div className="mt-4 space-y-4">
          {languageScanResults.map((result, idx) => (
            <div key={idx} className="space-y-3 border-l-4 border-primary pl-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="default">{result.language}</Badge>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {result.url}
                </a>
              </div>
              
              {result.error ? (
                <Card className="border-destructive">
                  <CardContent className="py-4 text-destructive text-sm">
                    Sayfa yüklenemedi: {result.error}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs">Schema ({result.schemas.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      {result.schemas.map(s => (
                        <Badge key={s.index} variant="outline" className="mr-1 mb-1 text-[10px]">
                          {s.type}
                        </Badge>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs">Rating</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      {result.aggregateRatings.length > 0 ? (
                        result.aggregateRatings.map((r, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            <span>{r.ratingValue} ({r.reviewCount} reviews)</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground">Rating yok</span>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
