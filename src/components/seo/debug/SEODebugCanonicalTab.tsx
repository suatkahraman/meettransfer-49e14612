import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info, FileText, Code } from 'lucide-react';
import { type CanonicalValidationResult, type CanonicalSummary } from './types';

interface SEODebugCanonicalTabProps {
  canonicalResults: CanonicalValidationResult[];
  getCanonicalSummary: () => CanonicalSummary;
}

export const SEODebugCanonicalTab = ({ 
  canonicalResults,
  getCanonicalSummary 
}: SEODebugCanonicalTabProps) => {
  if (canonicalResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz canonical taraması yapılmadı. Yukarıdaki "Canonical Tara" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  const summary = getCanonicalSummary();
  const hasIssues = summary.languagesWithIssues > 0 || summary.missingCanonical > 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={hasIssues ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasIssues ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Canonical Kontrolü - Sorunlar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Canonical Kontrolü - Tamamlandı</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <div className="text-center p-2 bg-muted rounded-lg">
              <div className="text-xl font-bold">{summary.totalLanguages}</div>
              <div className="text-xs text-muted-foreground">Toplam Dil</div>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-xl font-bold text-green-600">{summary.scannedLanguages}</div>
              <div className="text-xs text-muted-foreground">Başarılı</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingCanonical > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.missingCanonical > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {summary.missingCanonical}
              </div>
              <div className="text-xs text-muted-foreground">Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.nonSelfReferencing > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.nonSelfReferencing > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {summary.nonSelfReferencing}
              </div>
              <div className="text-xs text-muted-foreground">Farklı URL</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.relativeUrls > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.relativeUrls > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {summary.relativeUrls}
              </div>
              <div className="text-xs text-muted-foreground">Göreli URL</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.inconsistentPatterns ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.inconsistentPatterns ? 'text-yellow-600' : 'text-green-600'}`}>
                {summary.inconsistentPatterns ? '✗' : '✓'}
              </div>
              <div className="text-xs text-muted-foreground">Tutarlı</div>
            </div>
          </div>

          {summary.missingCanonical > 0 && (
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Canonical etiketi eksik olan sayfalar var - SEO için her sayfada canonical olmalı!</span>
            </div>
          )}

          {summary.relativeUrls > 0 && (
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Göreli URL kullanan canonical etiketleri var - mutlak URL kullanılmalı!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canonical by language table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Dil Bazlı Canonical Sonuçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Dil</th>
                  <th className="text-left py-2 px-3">Canonical URL</th>
                  <th className="text-center py-2 px-3">Self-Ref</th>
                  <th className="text-center py-2 px-3">Absolute</th>
                  <th className="text-center py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {canonicalResults.map((result, idx) => {
                  const errorCount = result.issues.filter(i => i.level === 'error').length;
                  const warningCount = result.issues.filter(i => i.level === 'warning').length;
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{result.language}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">Hata</Badge>
                        ) : result.canonicalUrl ? (
                          <span className="text-xs text-muted-foreground truncate block max-w-[300px]" title={result.canonicalUrl}>
                            {result.canonicalUrl}
                          </span>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Eksik</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.isSelfReferencing ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : result.canonicalUrl ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.isAbsoluteUrl ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : result.canonicalUrl ? (
                          <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
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

      {/* Detailed canonical issues */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
          <Code className="h-4 w-4" />
          Detaylı Canonical Sonuçları
        </summary>
        <div className="mt-4 space-y-6">
          {canonicalResults.map((result, idx) => (
            <div key={idx} className="space-y-3 border-l-4 border-green-500 pl-4">
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
                <>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Canonical URL:</div>
                    <code className="text-xs break-all">{result.canonicalUrl ?? 'Tanımlı değil'}</code>
                  </div>

                  {result.issues.length > 0 && (
                    <div className="space-y-2">
                      {result.issues.map((issue, issueIdx) => (
                        <div
                          key={issueIdx}
                          className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                            issue.level === 'error' ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300' :
                            issue.level === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300' :
                            'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {issue.level === 'error' ? <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                           issue.level === 'warning' ? <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" /> :
                           <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
