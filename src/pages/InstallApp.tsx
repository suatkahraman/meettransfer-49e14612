import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Share, Plus, MoreVertical, Check, Bell, Zap, Wifi, AlertTriangle, Menu, Chrome, Globe } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import logo from '@/assets/meet-transfer-logo-optimized.webp';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useLanguage } from '@/contexts/LanguageContext';

const InstallApp = () => {
  const { 
    canInstall, 
    isInstalled, 
    isStandalone, 
    isIOS, 
    isAndroid, 
    promptInstall, 
    browserInfo,
    getInstallInstructions 
  } = usePWAInstall();
  
  const { language } = useLanguage();
  const isTurkish = language === 'TR';
  
  const [isInstalling, setIsInstalling] = useState(false);
  const instructions = getInstallInstructions();

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const success = await promptInstall();
      if (!success) {
        console.log('[InstallApp] Install prompt was dismissed or not available');
      }
    } finally {
      setIsInstalling(false);
    }
  };

  // Already installed view
  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-pt">
          <div className="flex items-center h-14 px-4">
            <Link to="/" className="flex items-center gap-2 text-foreground">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">{isTurkish ? 'Geri' : 'Back'}</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl font-serif">
                {isTurkish ? 'Uygulama Yüklendi!' : 'App Installed!'}
              </CardTitle>
              <CardDescription>
                {isTurkish 
                  ? 'Meet Transfer artık cihazınızda yüklü. Ana ekranınızdan erişebilirsiniz.'
                  : 'Meet Transfer is now installed on your device. You can access it from your home screen.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button variant="accent" className="w-full h-12 rounded-xl">
                  {isTurkish ? 'Uygulamaya Devam Et' : 'Continue to App'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-secondary">
      <SEOHead 
        title={isTurkish ? 'Meet Transfer Uygulamasını Yükle | Premium Havalimanı Transfer' : 'Install Meet Transfer App | Premium Airport Transfer'}
        description={isTurkish 
          ? 'Meet Transfer uygulamasını cihazınıza yükleyin ve lüks havalimanı transferlerine hızlı erişim sağlayın.'
          : 'Install Meet Transfer app on your device for quick access to luxury airport transfers across Turkey.'}
        canonicalPath="/install"
      />
      
      <header className="sticky top-0 z-50 bg-card border-b border-border safe-area-pt">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">{isTurkish ? 'Geri' : 'Back'}</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-24 h-24 rounded-2xl overflow-hidden shadow-lg border border-border">
              <img src={logo} alt="Meet Transfer" className="w-full h-full object-cover" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">
              {isTurkish ? 'Meet Transfer\'i Yükle' : 'Install Meet Transfer'}
            </CardTitle>
            <CardDescription>
              {isTurkish 
                ? 'Ana ekranınızdan hızlı erişim için uygulamayı yükleyin'
                : 'Get the full app experience with quick access from your home screen'}
            </CardDescription>
            
            {/* Browser info badge */}
            {browserInfo && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{browserInfo.name} {browserInfo.version !== 'unknown' ? `v${browserInfo.version}` : ''}</span>
                {browserInfo.isSupported ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-amber-500">!</span>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Browser compatibility warning */}
            {browserInfo && !browserInfo.isSupported && (
              <Alert variant="destructive" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-sm">
                  {browserInfo.instructions || (isTurkish 
                    ? 'Bu tarayıcı PWA desteği sağlamayabilir. Chrome veya Safari kullanmanızı öneririz.'
                    : 'This browser may not fully support PWA. We recommend using Chrome or Safari.')}
                </AlertDescription>
              </Alert>
            )}
            
            {/* iOS Chrome/Firefox warning */}
            {isIOS && browserInfo?.name !== 'Safari' && (
              <Alert className="border-accent/50 bg-accent/10">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <AlertDescription className="text-sm">
                  {isTurkish 
                    ? 'iOS\'ta uygulamayı yüklemek için Safari tarayıcısını kullanmanız gerekiyor.'
                    : 'You need to use Safari browser to install the app on iOS.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-accent" />
                </div>
                <span>{isTurkish ? 'Ana ekrandan hızlı erişim' : 'Quick access from your home screen'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-accent" />
                </div>
                <span>{isTurkish ? 'Transfer güncellemeleri için bildirimler' : 'Push notifications for trip updates'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Download className="h-4 w-4 text-accent" />
                </div>
                <span>{isTurkish ? 'Daha hızlı yükleme süreleri' : 'Faster loading times'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Wifi className="h-4 w-4 text-accent" />
                </div>
                <span>{isTurkish ? 'Çevrimdışı çalışır' : 'Works offline'}</span>
              </div>
            </div>

            {/* Native Install Button */}
            {canInstall && !isIOS && (
              <Button 
                variant="accent" 
                className="w-full h-12 rounded-xl text-base font-medium gap-2"
                onClick={handleInstallClick}
                disabled={isInstalling}
              >
                <Download className="h-5 w-5" />
                {isInstalling 
                  ? (isTurkish ? 'Yükleniyor...' : 'Installing...')
                  : (isTurkish ? 'Uygulamayı Yükle' : 'Install App')}
              </Button>
            )}

            {/* iOS Instructions */}
            {isIOS && browserInfo?.name === 'Safari' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {isTurkish ? 'iPhone/iPad\'e yüklemek için:' : 'To install on iPhone/iPad:'}
                </p>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">1</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span>{isTurkish ? 'Alt kısımdaki' : 'Tap the'}</span>
                      <Share className="h-4 w-4 text-accent shrink-0" />
                      <span>{isTurkish ? 'paylaş butonuna dokunun' : 'Share button below'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">2</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span>{isTurkish ? 'Kaydırın ve' : 'Scroll and tap'}</span>
                      <Plus className="h-4 w-4 text-accent shrink-0" />
                      <span>{isTurkish ? '"Ana Ekrana Ekle" seçin' : '"Add to Home Screen"'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">3</div>
                    <span className="pt-1">{isTurkish ? '"Ekle" butonuna dokunun' : 'Tap "Add" to confirm'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Android Manual Instructions (when native prompt not available) */}
            {isAndroid && !canInstall && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {isTurkish ? 'Android\'e yüklemek için:' : 'To install on Android:'}
                </p>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">1</div>
                    <div className="flex items-center gap-2 pt-1">
                      <span>{isTurkish ? 'Sağ üstteki' : 'Tap the'}</span>
                      <MoreVertical className="h-4 w-4 text-accent shrink-0" />
                      <span>{isTurkish ? 'menü butonuna dokunun' : 'menu button'}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">2</div>
                    <span className="pt-1">
                      {isTurkish 
                        ? '"Uygulamayı yükle" veya "Ana ekrana ekle" seçin' 
                        : 'Tap "Install app" or "Add to Home screen"'}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">3</div>
                    <span className="pt-1">{isTurkish ? 'Yüklemeyi onaylayın' : 'Confirm installation'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop fallback */}
            {!isIOS && !isAndroid && !canInstall && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center font-medium">
                  {isTurkish ? 'Masaüstüne yüklemek için:' : 'To install on desktop:'}
                </p>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  {browserInfo?.name === 'Chrome' || browserInfo?.name === 'Edge' ? (
                    <>
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">1</div>
                        <span className="pt-1">
                          {isTurkish 
                            ? 'Adres çubuğunun sağındaki yükleme simgesine (⊕) tıklayın' 
                            : 'Click the install icon (⊕) in the address bar'}
                        </span>
                      </div>
                      <div className="flex items-start gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">2</div>
                        <span className="pt-1">
                          {isTurkish ? '"Yükle" butonuna tıklayın' : 'Click "Install"'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      <p>{isTurkish 
                        ? 'Tarayıcı menüsünden "Uygulamayı yükle" veya "Kısayol oluştur" seçeneğini arayın.'
                        : 'Look for "Install app" or "Create shortcut" in your browser menu.'}</p>
                      <p className="mt-2 text-xs">
                        {isTurkish 
                          ? 'En iyi deneyim için Chrome veya Edge kullanmanızı öneririz.'
                          : 'We recommend using Chrome or Edge for the best experience.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Helpful note */}
            {instructions.note && (
              <p className="text-xs text-center text-muted-foreground">
                {instructions.note}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstallApp;
