import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle, Info, Tag, Code } from 'lucide-react';
import { type MetaTagValidationResult, type MetaTagSummary } from './types';

interface SEODebugMetaTagsTabProps {
  metaTagResults: MetaTagValidationResult[];
  getMetaTagSummary: () => MetaTagSummary;
}

export const SEODebugMetaTagsTab = ({ 
  metaTagResults,
  getMetaTagSummary 
}: SEODebugMetaTagsTabProps) => {
  if (metaTagResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz meta tag taraması yapılmadı. Yukarıdaki "Meta Tara" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  const summary = getMetaTagSummary();
  const hasIssues = summary.languagesWithIssues > 0 || summary.missingTitle > 0 || summary.missingDescription > 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className={hasIssues ? 'border-destructive' : 'border-green-500'}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            {hasIssues ? (
              <>
                <AlertCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Meta Tag Kontrolü - Sorunlar Var</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500">Meta Tag Kontrolü - Tamamlandı</span>
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
            <div className={`text-center p-2 rounded-lg ${summary.missingTitle > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <div className={`text-xl font-bold ${summary.missingTitle > 0 ? 'text-destructive' : 'text-primary'}`}>
                {summary.missingTitle}
              </div>
              <div className="text-xs text-muted-foreground">Title Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingDescription > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              <div className={`text-xl font-bold ${summary.missingDescription > 0 ? 'text-destructive' : 'text-primary'}`}>
                {summary.missingDescription}
              </div>
              <div className="text-xs text-muted-foreground">Desc Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.missingOgTags > 0 ? 'bg-accent' : 'bg-primary/10'}`}>
              <div className={`text-xl font-bold ${summary.missingOgTags > 0 ? 'text-foreground' : 'text-primary'}`}>
                {summary.missingOgTags}
              </div>
              <div className="text-xs text-muted-foreground">OG Eksik</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${summary.titleTooLong > 0 || summary.descriptionTooLong > 0 ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-primary/10'}`}>
              <div className={`text-xl font-bold ${summary.titleTooLong > 0 || summary.descriptionTooLong > 0 ? 'text-yellow-600' : 'text-primary'}`}>
                {summary.titleTooLong + summary.descriptionTooLong}
              </div>
              <div className="text-xs text-muted-foreground">Çok Uzun</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta tags by language table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Dil Bazlı Meta Tag Sonuçları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Dil</th>
                  <th className="text-left py-2 px-3">Title</th>
                  <th className="text-left py-2 px-3">Description</th>
                  <th className="text-left py-2 px-3">Robots</th>
                  <th className="text-center py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody>
                {metaTagResults.map((result, idx) => {
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
                        ) : result.metaTags.title ? (
                          <span className="text-xs text-muted-foreground truncate block max-w-[240px]" title={result.metaTags.title}>
                            {result.metaTags.title}
                          </span>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Eksik</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {result.error ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : result.metaTags.description ? (
                          <span className="text-xs text-muted-foreground truncate block max-w-[300px]" title={result.metaTags.description}>
                            {result.metaTags.description}
                          </span>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Eksik</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {result.error ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : result.metaTags.robots ? (
                          <code className="text-xs text-muted-foreground">{result.metaTags.robots}</code>
                        ) : (
                          <span className="text-xs text-muted-foreground">varsayılan</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {result.error ? (
                          <Badge variant="destructive" className="text-xs">{result.error}</Badge>
                        ) : errorCount > 0 ? (
                          <Badge variant="destructive" className="text-xs">{errorCount} hata</Badge>
                        ) : warningCount > 0 ? (
                          <Badge variant="secondary" className="text-xs">{warningCount} uyarı</Badge>
                        ) : (
                          <Badge className="text-xs">OK</Badge>
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

      {/* Detailed meta tag results */}
      <details className="group">
        <summary className="cursor-pointer p-3 bg-muted rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-muted/80">
          <Code className="h-4 w-4" />
          Detaylı Meta Tag Sonuçları
        </summary>

        <div className="mt-4 space-y-6">
          {metaTagResults.map((result, idx) => (
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
                <>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Title ({result.metaTags.titleLength}):</div>
                      <div className="text-xs break-words">{result.metaTags.title ?? '—'}</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Description ({result.metaTags.descriptionLength}):</div>
                      <div className="text-xs break-words">{result.metaTags.description ?? '—'}</div>
                    </div>
                  </div>

                  {result.issues.length > 0 ? (
                    <div className="space-y-2">
                      {result.issues.map((issue, issueIdx) => (
                        <div
                          key={issueIdx}
                          className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                            issue.level === 'error'
                              ? 'bg-destructive/10 text-destructive'
                              : issue.level === 'warning'
                                ? 'bg-accent text-foreground'
                                : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {issue.level === 'error' ? (
                            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          ) : issue.level === 'warning' ? (
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          )}
                          <span>{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-primary/10 rounded-lg text-xs text-primary flex items-center gap-2">
                      <CheckCircle className="h-3 w-3" />
                      <span>Meta tag'ler beklenen seviyede</span>
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
