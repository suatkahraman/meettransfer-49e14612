import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Home, RefreshCw, ExternalLink } from 'lucide-react';

interface QuickScanUrl {
  label: string;
  path: string;
}

interface SEODebugHeaderProps {
  customUrl: string;
  setCustomUrl: (url: string) => void;
  isScanning: boolean;
  onScanHomepage: () => void;
  onScanCustomUrl: () => void;
  quickScanUrls: QuickScanUrl[];
  onQuickScan: (path: string) => void;
}

export const SEODebugHeader = ({
  customUrl,
  setCustomUrl,
  isScanning,
  onScanHomepage,
  onScanCustomUrl,
  quickScanUrls,
  onQuickScan
}: SEODebugHeaderProps) => {
  return (
    <>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold mb-2">SEO Debug - JSON-LD Validator</h1>
        <p className="text-muted-foreground">Schema.org validasyonu ile JSON-LD scriptlerini kontrol edin</p>
      </div>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Sayfa Tara
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            <Button 
              onClick={onScanHomepage} 
              disabled={isScanning}
              size="sm"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-1" />
              Ana Sayfa
            </Button>
            {quickScanUrls.map(url => (
              <Button 
                key={url.path}
                onClick={() => onQuickScan(url.path)} 
                disabled={isScanning}
                size="sm"
                variant="outline"
              >
                {url.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input 
              placeholder="/sayfa-yolu veya tam URL" 
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={onScanCustomUrl} 
              disabled={isScanning || !customUrl}
              size="icon"
            >
              {isScanning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
