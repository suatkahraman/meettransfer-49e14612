import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Languages, Globe, Link2, Tag, Bot, Gauge, Share2, RefreshCw 
} from 'lucide-react';

interface SEODebugScanCardsProps {
  // Language scan
  languageScanPath: string;
  setLanguageScanPath: (path: string) => void;
  isScanningLanguages: boolean;
  languageScanProgress: number;
  onScanLanguages: (path: string) => void;
  
  // Canonical scan
  canonicalScanPath: string;
  setCanonicalScanPath: (path: string) => void;
  isScanningCanonical: boolean;
  canonicalScanProgress: number;
  onScanCanonical: (path: string) => void;
  
  // Hreflang scan
  hreflangScanPath: string;
  setHreflangScanPath: (path: string) => void;
  isScanningHreflang: boolean;
  hreflangScanProgress: number;
  onScanHreflang: (path: string) => void;
  
  // Meta tag scan
  metaTagScanPath: string;
  setMetaTagScanPath: (path: string) => void;
  isScanningMetaTags: boolean;
  metaTagScanProgress: number;
  onScanMetaTags: (path: string) => void;
  
  // Robots/Sitemap scan
  isScanningRobots: boolean;
  robotsScanProgress: number;
  onScanRobots: () => void;
  
  // Social scan
  isScanningSocial: boolean;
  onScanSocial: () => void;
}

export const SEODebugScanCards = ({
  languageScanPath,
  setLanguageScanPath,
  isScanningLanguages,
  languageScanProgress,
  onScanLanguages,
  canonicalScanPath,
  setCanonicalScanPath,
  isScanningCanonical,
  canonicalScanProgress,
  onScanCanonical,
  hreflangScanPath,
  setHreflangScanPath,
  isScanningHreflang,
  hreflangScanProgress,
  onScanHreflang,
  metaTagScanPath,
  setMetaTagScanPath,
  isScanningMetaTags,
  metaTagScanProgress,
  onScanMetaTags,
  isScanningRobots,
  robotsScanProgress,
  onScanRobots,
  isScanningSocial,
  onScanSocial
}: SEODebugScanCardsProps) => {
  return (
    <div className="space-y-4 mb-6">
      {/* Language Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4 text-primary" />
            Tüm Dilleri Tara
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Bir sayfanın tüm dil versiyonlarını (/tr, /de, /fr, vb.) tarayıp karşılaştırın
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="/" 
              value={languageScanPath}
              onChange={(e) => setLanguageScanPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => onScanLanguages(languageScanPath)}
              disabled={isScanningLanguages}
              size="sm"
            >
              {isScanningLanguages ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Globe className="h-4 w-4 mr-1" />
              )}
              10 Dili Tara
            </Button>
          </div>
          {isScanningLanguages && (
            <Progress value={languageScanProgress} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Canonical Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Link2 className="h-4 w-4 text-primary" />
            Canonical URL Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Tüm dil versiyonlarının canonical URL etiketlerini doğrulayın
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="/" 
              value={canonicalScanPath}
              onChange={(e) => setCanonicalScanPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => onScanCanonical(canonicalScanPath)}
              disabled={isScanningCanonical}
              size="sm"
            >
              {isScanningCanonical ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Link2 className="h-4 w-4 mr-1" />
              )}
              Canonical Tara
            </Button>
          </div>
          {isScanningCanonical && (
            <Progress value={canonicalScanProgress} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Hreflang Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-primary" />
            Hreflang Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Tüm dil versiyonlarının hreflang etiketlerini doğrulayın (çift yönlü bağlantı, x-default, vb.)
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="/" 
              value={hreflangScanPath}
              onChange={(e) => setHreflangScanPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => onScanHreflang(hreflangScanPath)}
              disabled={isScanningHreflang}
              size="sm"
            >
              {isScanningHreflang ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Globe className="h-4 w-4 mr-1" />
              )}
              Hreflang Tara
            </Button>
          </div>
          {isScanningHreflang && (
            <Progress value={hreflangScanProgress} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Meta Tag Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Tag className="h-4 w-4 text-primary" />
            Meta Tag Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Tüm dil versiyonlarının title, description, robots, Open Graph etiketlerini doğrulayın
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="/" 
              value={metaTagScanPath}
              onChange={(e) => setMetaTagScanPath(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => onScanMetaTags(metaTagScanPath)}
              disabled={isScanningMetaTags}
              size="sm"
            >
              {isScanningMetaTags ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Tag className="h-4 w-4 mr-1" />
              )}
              Meta Tara
            </Button>
          </div>
          {isScanningMetaTags && (
            <Progress value={metaTagScanProgress} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Robots/Sitemap Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bot className="h-4 w-4 text-primary" />
            Robots.txt & Sitemap Kontrolü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            robots.txt ve sitemap.xml dosyalarını kontrol edin, dil kapsama ve hreflang tanımlarını doğrulayın
          </p>
          <Button 
            onClick={onScanRobots}
            disabled={isScanningRobots}
            size="sm"
          >
            {isScanningRobots ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Bot className="h-4 w-4 mr-1" />
            )}
            Robots & Sitemap Tara
          </Button>
          {isScanningRobots && (
            <Progress value={robotsScanProgress} className="mt-2 h-2" />
          )}
        </CardContent>
      </Card>

      {/* Social Preview Scan */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" />
            Sosyal Medya Önizleme
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Open Graph ve Twitter Card meta etiketlerini kontrol edin, sosyal paylaşım önizlemesi görün
          </p>
          <Button 
            onClick={onScanSocial}
            disabled={isScanningSocial}
            size="sm"
          >
            {isScanningSocial ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Share2 className="h-4 w-4 mr-1" />
            )}
            Sosyal Önizleme Tara
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
