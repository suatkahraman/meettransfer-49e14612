import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { type RobotsResult, type SitemapResult } from '@/hooks/useSitemapRobotsValidation';

interface SEODebugSitemapTabProps {
  robotsResult: RobotsResult | null;
  sitemapResults: SitemapResult[];
}

export const SEODebugSitemapTab = ({ robotsResult, sitemapResults }: SEODebugSitemapTabProps) => {
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
    </div>
  );
};
