import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, AlertTriangle, Play, RotateCcw, Clock, Loader2, XCircle, Globe, Filter } from 'lucide-react';
import { type RobotsResult, type SitemapResult } from '@/hooks/useSitemapRobotsValidation';
import { useSitemapUrlValidation } from '@/hooks/useSitemapUrlValidation';

type StatusFilter = 'all' | '2xx' | '3xx' | '4xx' | '5xx' | 'error';

interface SEODebugSitemapTabProps {
  robotsResult: RobotsResult | null;
  sitemapResults: SitemapResult[];
}

export const SEODebugSitemapTab = ({ robotsResult, sitemapResults }: SEODebugSitemapTabProps) => {
  const [showValidation, setShowValidation] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { results, summary, isValidating, progress, startedAt, completedAt, validateUrls, reset } = useSitemapUrlValidation();

  const handleValidateUrls = async () => {
    // Collect all URLs from all sitemaps
    const allUrls = sitemapResults.flatMap(sitemap => 
      sitemap.urls.map(u => u.loc)
    );
    
    if (allUrls.length === 0) {
      return;
    }

    setShowValidation(true);
    setStatusFilter('all');
    await validateUrls(allUrls, 3); // Validate 3 URLs at a time
  };

  const handleReset = () => {
    reset();
    setShowValidation(false);
    setStatusFilter('all');
  };

  const getStatusColor = (ok: boolean, status: number | null) => {
    if (ok) return 'text-green-600 bg-green-50 dark:bg-green-950';
    if (status && status >= 300 && status < 400) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950';
    if (status && status >= 400 && status < 500) return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
    return 'text-red-600 bg-red-50 dark:bg-red-950';
  };

  const getStatusIcon = (ok: boolean, status: number | null) => {
    if (ok) return <CheckCircle className="h-3.5 w-3.5" />;
    if (status && status >= 300 && status < 400) return <AlertTriangle className="h-3.5 w-3.5" />;
    return <XCircle className="h-3.5 w-3.5" />;
  };

  // Filter results based on selected status
  const filteredResults = useMemo(() => {
    if (statusFilter === 'all') return results;
    
    return results.filter(result => {
      const status = result.status;
      switch (statusFilter) {
        case '2xx':
          return status !== null && status >= 200 && status < 300;
        case '3xx':
          return status !== null && status >= 300 && status < 400;
        case '4xx':
          return status !== null && status >= 400 && status < 500;
        case '5xx':
          return status !== null && status >= 500 && status < 600;
        case 'error':
          return !result.ok;
        default:
          return true;
      }
    });
  }, [results, statusFilter]);

  // Count results by status category
  const statusCounts = useMemo(() => {
    return results.reduce((acc, result) => {
      const status = result.status;
      if (status === null) {
        acc.error++;
      } else if (status >= 200 && status < 300) {
        acc['2xx']++;
      } else if (status >= 300 && status < 400) {
        acc['3xx']++;
      } else if (status >= 400 && status < 500) {
        acc['4xx']++;
      } else if (status >= 500 && status < 600) {
        acc['5xx']++;
      }
      if (!result.ok) acc.error++;
      return acc;
    }, { '2xx': 0, '3xx': 0, '4xx': 0, '5xx': 0, error: 0 } as Record<string, number>);
  }, [results]);

  const totalSitemapUrls = sitemapResults.reduce((acc, s) => acc + s.urlCount, 0);

  if (!robotsResult && sitemapResults.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henüz robots.txt/sitemap taraması yapılmadı. Yukarıdaki "Robots & Sitemap Tara" butonunu kullanın.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Robots.txt Card */}
      {robotsResult && (
        <Card className={robotsResult.issues.some(i => i.level === 'error') ? 'border-destructive' : robotsResult.accessible ? 'border-green-500' : 'border-yellow-500'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {robotsResult.accessible ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              <span>robots.txt - {robotsResult.accessible ? 'Erişilebilir' : 'Bulunamadı'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.sitemapUrls.length}</div><div className="text-muted-foreground">Sitemap</div></div>
              <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.disallowRules.length}</div><div className="text-muted-foreground">Disallow</div></div>
              <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.allowRules.length}</div><div className="text-muted-foreground">Allow</div></div>
              <div className="p-2 bg-muted rounded"><div className="font-bold">{robotsResult.crawlDelay ?? '—'}</div><div className="text-muted-foreground">Delay</div></div>
            </div>
            {robotsResult.issues.map((issue, i) => (
              <div key={i} className={`p-2 rounded text-xs flex gap-2 ${issue.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700'}`}>
                <AlertCircle className="h-3 w-3 mt-0.5" /><span>{issue.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sitemap Cards */}
      {sitemapResults.map((sitemap, idx) => (
        <Card key={idx} className={sitemap.accessible ? 'border-green-500' : 'border-destructive'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              {sitemap.accessible ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
              <span className="truncate">{sitemap.url}</span>
              <Badge variant="secondary" className="text-xs">{sitemap.urlCount} URL</Badge>
              {sitemap.hasHreflang && <Badge className="text-xs">Hreflang ✓</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sitemap.issues.map((issue, i) => (
              <div key={i} className={`p-2 rounded text-xs mb-2 ${issue.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700'}`}>
                {issue.message}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* URL Validation Section */}
      {sitemapResults.length > 0 && sitemapResults.some(s => s.urlCount > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="h-5 w-5" />
                URL Validation
              </CardTitle>
              <div className="flex gap-2">
                {showValidation && (
                  <Button variant="outline" size="sm" onClick={handleReset} disabled={isValidating}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Sıfırla
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={handleValidateUrls} 
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Doğrulanıyor...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      {totalSitemapUrls} URL Doğrula
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!showValidation ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                <p>Sitemap'teki tüm URL'lerin 200 OK döndüğünü doğrulamak için butona tıklayın.</p>
                <p className="text-xs mt-1">Bu işlem {totalSitemapUrls} URL için birkaç dakika sürebilir.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Progress */}
                {(isValidating || results.length > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">İlerleme</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mt-3">
                      <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
                        <div className="font-bold text-green-600">{summary.ok}</div>
                        <div className="text-green-600/70">OK (200)</div>
                      </div>
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
                        <div className="font-bold text-red-600">{summary.errors}</div>
                        <div className="text-red-600/70">Hata</div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="font-bold">{summary.total}</div>
                        <div className="text-muted-foreground">Toplam</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time info */}
                {startedAt && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Başlangıç: {startedAt.toLocaleTimeString('tr-TR')}
                    </span>
                    {completedAt && (
                      <span>
                        Süre: {Math.round((completedAt.getTime() - startedAt.getTime()) / 1000)}s
                      </span>
                    )}
                  </div>
                )}

                {/* Results List */}
                {results.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Sonuçlar</h4>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                          <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="Status Filtrele" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tümü ({results.length})</SelectItem>
                            <SelectItem value="2xx" disabled={statusCounts['2xx'] === 0}>
                              2xx Başarılı ({statusCounts['2xx']})
                            </SelectItem>
                            <SelectItem value="3xx" disabled={statusCounts['3xx'] === 0}>
                              3xx Yönlendirme ({statusCounts['3xx']})
                            </SelectItem>
                            <SelectItem value="4xx" disabled={statusCounts['4xx'] === 0}>
                              4xx İstemci Hatası ({statusCounts['4xx']})
                            </SelectItem>
                            <SelectItem value="5xx" disabled={statusCounts['5xx'] === 0}>
                              5xx Sunucu Hatası ({statusCounts['5xx']})
                            </SelectItem>
                            <SelectItem value="error" disabled={summary.errors === 0}>
                              Tüm Hatalar ({summary.errors})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {filteredResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm border rounded-md">
                        Bu filtreye uygun sonuç bulunamadı.
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] border rounded-md">
                        <div className="p-2 space-y-1">
                          {filteredResults.map((result, idx) => (
                            <div 
                              key={idx} 
                              className={`flex items-center justify-between p-2 rounded text-xs ${getStatusColor(result.ok, result.status)}`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {getStatusIcon(result.ok, result.status)}
                                <span className="truncate" title={result.url}>
                                  {result.url.replace(window.location.origin, '')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 ml-2 shrink-0">
                                {result.responseTime && (
                                  <span className="text-muted-foreground">{result.responseTime}ms</span>
                                )}
                                <Badge 
                                  variant={result.ok ? "secondary" : "destructive"} 
                                  className="text-xs font-mono"
                                >
                                  {result.status ?? 'ERR'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    
                    {statusFilter !== 'all' && (
                      <div className="text-xs text-muted-foreground text-center">
                        {filteredResults.length} / {results.length} sonuç gösteriliyor
                      </div>
                    )}
                  </div>
                )}

                {/* Error URLs Summary */}
                {completedAt && summary.errors > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-md">
                    <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Hatalı URL'ler ({summary.errors})
                    </h4>
                    <div className="space-y-1 text-xs">
                      {results.filter(r => !r.ok).slice(0, 10).map((result, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="truncate text-destructive" title={result.url}>
                            {result.url.replace(window.location.origin, '')}
                          </span>
                          <span className="text-destructive font-mono ml-2">
                            {result.status ?? result.error ?? 'ERR'}
                          </span>
                        </div>
                      ))}
                      {summary.errors > 10 && (
                        <div className="text-muted-foreground mt-1">
                          ...ve {summary.errors - 10} daha
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {completedAt && summary.errors === 0 && summary.total > 0 && (
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">
                      Tüm {summary.total} URL başarıyla doğrulandı! ✓
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
