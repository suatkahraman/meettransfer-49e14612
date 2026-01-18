import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, CheckCircle, RefreshCw, Server, 
  ExternalLink, AlertTriangle, Code, Globe, Zap
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, LANGUAGE_TO_PREFIX } from '@/hooks/useLanguageFromUrl';
import { supabase } from '@/integrations/supabase/client';

interface SSRMetaResult {
  path: string;
  language: string;
  success: boolean;
  title?: string;
  metaTags?: string;
  responseTime: number;
  error?: string;
  scannedAt: Date;
}

interface SSRMetaSummary {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  averageResponseTime: number;
}

export const SEODebugSSRTab = () => {
  const [results, setResults] = useState<SSRMetaResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [testPath, setTestPath] = useState('/');
  const [singleResult, setSingleResult] = useState<SSRMetaResult | null>(null);

  const testSinglePath = async (path: string) => {
    setIsScanning(true);
    setSingleResult(null);
    
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('seo-meta', {
        body: { path }
      });
      
      const responseTime = Math.round(performance.now() - startTime);
      
      if (error) throw error;
      
      const result: SSRMetaResult = {
        path,
        language: data?.language || 'en',
        success: data?.success || false,
        title: data?.title,
        metaTags: data?.metaTags,
        responseTime,
        scannedAt: new Date()
      };
      
      setSingleResult(result);
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      setSingleResult({
        path,
        language: 'unknown',
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        scannedAt: new Date()
      });
    } finally {
      setIsScanning(false);
    }
  };

  const testAllLanguages = async (basePath: string = '/') => {
    setIsScanning(true);
    setScanProgress(0);
    setResults([]);
    
    const allResults: SSRMetaResult[] = [];
    
    for (let i = 0; i < SUPPORTED_LANGUAGES.length; i++) {
      const lang = SUPPORTED_LANGUAGES[i];
      const prefix = LANGUAGE_TO_PREFIX[lang];
      const path = prefix + (basePath === '/' ? '' : basePath);
      const finalPath = path || '/';
      
      const startTime = performance.now();
      
      try {
        const { data, error } = await supabase.functions.invoke('seo-meta', {
          body: { path: finalPath }
        });
        
        const responseTime = Math.round(performance.now() - startTime);
        
        if (error) throw error;
        
        allResults.push({
          path: finalPath,
          language: lang,
          success: data?.success || false,
          title: data?.title,
          metaTags: data?.metaTags,
          responseTime,
          scannedAt: new Date()
        });
      } catch (error) {
        const responseTime = Math.round(performance.now() - startTime);
        allResults.push({
          path: finalPath,
          language: lang,
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Bilinmeyen hata',
          scannedAt: new Date()
        });
      }
      
      setScanProgress(((i + 1) / SUPPORTED_LANGUAGES.length) * 100);
      setResults([...allResults]);
    }
    
    setIsScanning(false);
  };

  const getSummary = (): SSRMetaSummary => {
    const successfulTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    const avgTime = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
      : 0;
    
    return {
      totalTests: results.length,
      successfulTests,
      failedTests,
      averageResponseTime: avgTime
    };
  };

  const summary = getSummary();

  return (
    <div className="space-y-4">
      {/* Edge Function Info */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            SSR Meta Edge Function Testi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Bu test, <code className="bg-muted px-1 rounded">seo-meta</code> edge function'ını çağırarak 
            arama motorları için sunucu tarafında üretilen meta tag'leri kontrol eder.
          </p>
          
          {/* Single Path Test */}
          <div className="flex gap-2">
            <Input 
              placeholder="Sayfa yolu (örn: / veya /blog/antalya-airport-transfer-guide)" 
              value={testPath} 
              onChange={(e) => setTestPath(e.target.value)}
              className="text-sm"
            />
            <Button 
              onClick={() => testSinglePath(testPath)} 
              disabled={isScanning} 
              size="sm"
            >
              <Zap className="h-4 w-4 mr-1" />
              Test Et
              {isScanning && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>
          </div>
          
          {/* All Languages Test */}
          <div className="flex gap-2">
            <Button 
              onClick={() => testAllLanguages(testPath)} 
              disabled={isScanning}
              variant="outline" 
              size="sm"
            >
              <Globe className="h-4 w-4 mr-1" />
              {SUPPORTED_LANGUAGES.length} Dili Test Et
              {isScanning && <RefreshCw className="h-3 w-3 ml-1 animate-spin" />}
            </Button>
          </div>
          
          {isScanning && <Progress value={scanProgress} className="h-2" />}
        </CardContent>
      </Card>

      {/* Single Result */}
      {singleResult && (
        <Card className={singleResult.success ? 'border-green-500' : 'border-destructive'}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {singleResult.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-green-500">Edge Function Başarılı</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-destructive">Edge Function Hatası</span>
                </>
              )}
              <Badge variant="outline" className="ml-auto">
                {singleResult.responseTime}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">{singleResult.path}</Badge>
              <Badge variant="outline">{singleResult.language}</Badge>
            </div>
            
            {singleResult.error && (
              <div className="p-2 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                {singleResult.error}
              </div>
            )}
            
            {singleResult.title && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">Title:</span>
                <div className="p-2 bg-muted rounded-lg text-sm font-medium">
                  {singleResult.title}
                </div>
              </div>
            )}
            
            {singleResult.metaTags && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Code className="h-3 w-3" />
                  Meta Tag'leri Göster
                </summary>
                <pre className="mt-2 p-3 bg-black text-green-400 text-[10px] overflow-x-auto max-h-60 rounded-lg">
                  {singleResult.metaTags}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Test Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-xl font-bold">{summary.totalTests}</div>
                <div className="text-xs text-muted-foreground">Toplam Test</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xl font-bold text-green-600">{summary.successfulTests}</div>
                <div className="text-xs text-muted-foreground">Başarılı</div>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-xl font-bold text-destructive">{summary.failedTests}</div>
                <div className="text-xs text-muted-foreground">Başarısız</div>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{summary.averageResponseTime}ms</div>
                <div className="text-xs text-muted-foreground">Ort. Süre</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Dil Bazlı Sonuçlar ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/50' 
                      : 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Badge variant="secondary" className="text-xs">{result.language}</Badge>
                    <code className="text-xs bg-muted px-1 rounded">{result.path}</code>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {result.responseTime}ms
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <div className="text-xs text-destructive mt-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      {result.error}
                    </div>
                  )}
                  
                  {result.title && (
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      <strong>Title:</strong> {result.title}
                    </div>
                  )}
                  
                  {result.metaTags && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        Meta tag'leri göster
                      </summary>
                      <pre className="mt-1 p-2 bg-black text-green-400 text-[9px] overflow-x-auto max-h-32 rounded">
                        {result.metaTags}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Server className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-700 dark:text-blue-300">Edge Function SSR Nasıl Çalışır?</p>
              <ul className="text-muted-foreground space-y-1 text-xs">
                <li>• <code className="bg-muted px-1 rounded">seo-meta</code> edge function, her URL için meta tag'ler üretir</li>
                <li>• Arama motorları bu meta tag'leri JavaScript çalıştırmadan görebilir</li>
                <li>• Canonical, hreflang, OG ve Twitter tag'leri otomatik oluşturulur</li>
                <li>• 1 saat boyunca cache'lenir (CDN düzeyinde)</li>
              </ul>
              <a 
                href="https://meettransfer.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Production URL'de Test Et
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
