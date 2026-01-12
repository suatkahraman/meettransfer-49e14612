import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Link2, Code } from 'lucide-react';
import { type HreflangValidationResult, type HreflangSummary } from './types';

interface SEODebugHreflangTabProps {
  hreflangResults: HreflangValidationResult[];
  getHreflangSummary: () => HreflangSummary;
}

export const SEODebugHreflangTab = ({ 
  hreflangResults,
  getHreflangSummary 
}: SEODebugHreflangTabProps) => {
  if (hreflangResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz hreflang taraması yapılmadı. Yukarıdaki "Hreflang Tara" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  const summary = getHreflangSummary();
  const hasIssues = summary.languagesWithIssues > 0 || summary.missingBidirectional > 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={hasIssues ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasIssues ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Hreflang Kontrolü - Sorunlar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Hreflang Kontrolü - Tamamlandı</span>
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
            <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xl font-bold text-destructive">{summary.languagesWithIssues}</div>
              <div className="text-xs text-muted-foreground">Sorunlu</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingBidirectional > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.missingBidirectional > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {summary.missingBidirectional}
              </div>
              <div className="text-xs text-muted-foreground">Çift Yön Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingXDefault > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.missingXDefault > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {summary.missingXDefault}
              </div>
              <div className="text-xs text-muted-foreground">x-default Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingSelfReference > 0 ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <div className={`text-xl font-bold ${summary.missingSelfReference > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {summary.missingSelfReference}
              </div>
              <div className="text-xs text-muted-foreground">Self-Ref Eksik</div>
            </div>
          </div>

          {summary.missingBidirectional > 0 && (
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg text-sm text-destructive flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>Çift yönlü bağlantı hatası: A sayfası B'ye bağlanıyorsa, B de A'ya bağlanmalı!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hreflang by language table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Dil Bazlı Hreflang Sonuçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Dil</th>
                  <th className="text-center py-2 px-3">Etiket</th>
                  <th className="text-center py-2 px-3">x-default</th>
                  <th className="text-center py-2 px-3">Self-Ref</th>
                  <th className="text-center py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {hreflangResults.map((result, idx) => {
                  const errorCount = result.issues.filter(i => i.level === 'error').length;
                  const warningCount = result.issues.filter(i => i.level === 'warning').length;
                  
                  return (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="text-xs">{result.language}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">Hata</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">{result.hreflangTags.length}</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.hasXDefault ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.hasSelfReference ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-destructive mx-auto" />
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

      {/* Detailed hreflang issues */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
          <Code className="h-4 w-4" />
          Detaylı Hreflang Sonuçları
        </summary>
        <div className="mt-4 space-y-6">
          {hreflangResults.map((result, idx) => (
            <div key={idx} className="space-y-3 border-l-4 border-blue-500 pl-4">
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

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs">Hreflang Etiketleri ({result.hreflangTags.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {result.hreflangTags.map((tag, tagIdx) => (
                          <div key={tagIdx} className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px]">{tag.hreflang}</Badge>
                            <span className="text-muted-foreground truncate">{tag.href}</span>
                          </div>
                        ))}
                        {result.hreflangTags.length === 0 && (
                          <p className="text-muted-foreground text-xs">Hreflang etiketi bulunamadı</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};
