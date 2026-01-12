import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Share2, Twitter, Facebook, Image, AlertCircle, CheckCircle, 
  Info, ExternalLink 
} from 'lucide-react';
import { type SocialPreviewResult, type SocialPreviewIssue } from '@/hooks/useSocialPreview';
import { getIssueLevelVariant } from './utils';

interface SEODebugSocialTabProps {
  socialResult: SocialPreviewResult | null;
  imageLoading?: boolean;
}

export const SEODebugSocialTab = ({ socialResult, imageLoading }: SEODebugSocialTabProps) => {
  if (!socialResult) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sosyal medya önizlemesi taramak için yukarıdaki "Sosyal Medya" butonuna tıklayın</p>
        </CardContent>
      </Card>
    );
  }

  const result = socialResult;
  const errorCount = result.issues.filter(i => i.level === 'error').length;
  const warningCount = result.issues.filter(i => i.level === 'warning').length;

  const getIssueIcon = (level: 'error' | 'warning' | 'info') => {
    switch (level) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
      case 'warning': return <Info className="h-4 w-4 text-yellow-600 shrink-0" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600 shrink-0" />;
    }
  };

  const getIssueBg = (level: 'error' | 'warning' | 'info') => {
    switch (level) {
      case 'error': return 'bg-destructive/10';
      case 'warning': return 'bg-yellow-500/10';
      case 'info': return 'bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4" />
            Sosyal Medya Meta Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {result.meta.ogImage ? <CheckCircle className="h-6 w-6 mx-auto text-green-600" /> : <AlertCircle className="h-6 w-6 mx-auto text-destructive" />}
              </div>
              <div className="text-xs text-muted-foreground">OG Image</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {result.meta.twitterCard ? <CheckCircle className="h-6 w-6 mx-auto text-green-600" /> : <AlertCircle className="h-6 w-6 mx-auto text-yellow-600" />}
              </div>
              <div className="text-xs text-muted-foreground">Twitter Card</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues */}
      {result.issues.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tespit Edilen Sorunlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.issues.map((issue, idx) => (
                <div key={idx} className={`flex items-start gap-2 p-2 rounded text-sm ${getIssueBg(issue.level)}`}>
                  {getIssueIcon(issue.level)}
                  <div className="flex-1">
                    <Badge variant={getIssueLevelVariant(issue.level)} className="mr-2 text-xs">
                      {issue.platform.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{issue.field}:</span> {issue.message}
                    {issue.recommendation && (
                      <p className="text-xs text-muted-foreground mt-1">💡 {issue.recommendation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OG Image Analysis */}
      {result.ogImageAnalysis && (
        <Card className={`border-l-4 ${result.ogImageAnalysis.isOptimalSize && result.ogImageAnalysis.isOptimalAspectRatio ? 'border-l-green-500' : 'border-l-yellow-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Image className="h-4 w-4" />
              OG Image Analizi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.ogImageAnalysis.error ? (
              <p className="text-destructive text-sm">{result.ogImageAnalysis.error}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-2 rounded bg-muted">
                    <p className="text-xs text-muted-foreground">Boyut</p>
                    <p className={`font-semibold ${result.ogImageAnalysis.isOptimalSize ? 'text-green-600' : 'text-yellow-600'}`}>
                      {result.ogImageAnalysis.width}x{result.ogImageAnalysis.height}px
                    </p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-xs text-muted-foreground">En-Boy Oranı</p>
                    <p className={`font-semibold ${result.ogImageAnalysis.isOptimalAspectRatio ? 'text-green-600' : 'text-yellow-600'}`}>
                      {result.ogImageAnalysis.aspectRatioLabel}
                    </p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-xs text-muted-foreground">Format</p>
                    <p className="font-semibold">{result.ogImageAnalysis.format}</p>
                  </div>
                  <div className="p-2 rounded bg-muted">
                    <p className="text-xs text-muted-foreground">Dosya Boyutu</p>
                    <p className={`font-semibold ${result.ogImageAnalysis.isOptimalFileSize ? 'text-green-600' : 'text-yellow-600'}`}>
                      {result.ogImageAnalysis.fileSizeFormatted || 'Ölçülemedi'}
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <p className="text-xs text-muted-foreground mb-1">Cache Busting</p>
                  <p className={`font-semibold ${result.ogImageAnalysis.hasCacheBusting ? 'text-green-600' : 'text-yellow-600'}`}>
                    {result.ogImageAnalysis.hasCacheBusting ? '✓ Aktif' : '✗ Yok'}
                  </p>
                </div>
                {result.ogImageAnalysis.recommendations.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground">Öneriler:</p>
                    {result.ogImageAnalysis.recommendations.map((rec, idx) => (
                      <p key={idx} className="text-sm">{rec}</p>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Facebook Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Facebook className="h-4 w-4 text-primary" />
              Facebook Önizleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="aspect-[1.91/1] bg-muted flex items-center justify-center">
                {result.meta.ogImage ? (
                  <img 
                    src={result.meta.ogImage.startsWith('/') ? window.location.origin + result.meta.ogImage : result.meta.ogImage} 
                    alt="OG" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Image className="h-12 w-12 opacity-30" />
                )}
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground uppercase">
                  {result.meta.ogSiteName || new URL(result.url).hostname}
                </p>
                <h3 className="font-semibold line-clamp-2">
                  {result.meta.ogTitle || result.meta.title || 'Başlık Yok'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.meta.ogDescription || 'Açıklama yok'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Twitter Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Twitter className="h-4 w-4 text-primary" />
              Twitter Önizleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-2xl overflow-hidden">
              <div className="aspect-[2/1] bg-muted flex items-center justify-center">
                {(result.meta.twitterImage || result.meta.ogImage) ? (
                  <img 
                    src={(result.meta.twitterImage || result.meta.ogImage || '').startsWith('/') 
                      ? window.location.origin + (result.meta.twitterImage || result.meta.ogImage) 
                      : (result.meta.twitterImage || result.meta.ogImage)} 
                    alt="Twitter" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Image className="h-12 w-12 opacity-30" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold line-clamp-2">
                  {result.meta.twitterTitle || result.meta.ogTitle || 'Başlık Yok'}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {result.meta.twitterDescription || result.meta.ogDescription || 'Açıklama yok'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* External Test Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Harici Test Araçları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(result.url)}`, '_blank')}
            >
              <Facebook className="h-4 w-4 mr-1" /> Facebook Debugger
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://cards-dev.twitter.com/validator', '_blank')}
            >
              <Twitter className="h-4 w-4 mr-1" /> Twitter Validator
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open(`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(result.url)}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-1" /> LinkedIn Inspector
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
