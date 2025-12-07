import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Share, Plus, MoreVertical, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    // Check platform
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isStandalone || isInstalled) {
    return (
      <div className="min-h-screen flex flex-col bg-secondary">
        <header className="sticky top-0 z-50 bg-card border-b border-border">
          <div className="flex items-center h-14 px-4">
            <Link to="/" className="flex items-center gap-2 text-foreground">
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-serif">App Installed!</CardTitle>
              <CardDescription>
                Meet Transfer is now installed on your device. You can access it from your home screen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/">
                <Button variant="accent" className="w-full h-12 rounded-xl">
                  Continue to App
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
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <Smartphone className="h-10 w-10 text-accent" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-serif">Install Meet Transfer</CardTitle>
            <CardDescription>
              Get the full app experience with quick access from your home screen
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span>Quick access from your home screen</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span>Fullscreen app experience</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span>Faster loading times</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-accent" />
                </div>
                <span>Works offline</span>
              </div>
            </div>

            {/* Install Button (Android/Desktop) */}
            {deferredPrompt && (
              <Button 
                variant="accent" 
                className="w-full h-12 rounded-xl text-base font-medium gap-2"
                onClick={handleInstallClick}
              >
                <Download className="h-5 w-5" />
                Install App
              </Button>
            )}

            {/* iOS Instructions */}
            {isIOS && !deferredPrompt && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  To install on iPhone/iPad:
                </p>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">1</div>
                    <div className="flex items-center gap-2">
                      Tap the <Share className="h-4 w-4 text-accent" /> Share button
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">2</div>
                    <div className="flex items-center gap-2">
                      Scroll and tap <Plus className="h-4 w-4 text-accent" /> "Add to Home Screen"
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">3</div>
                    <span>Tap "Add" to install</span>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions (fallback) */}
            {isAndroid && !deferredPrompt && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  To install on Android:
                </p>
                <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">1</div>
                    <div className="flex items-center gap-2">
                      Tap the <MoreVertical className="h-4 w-4 text-accent" /> menu button
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">2</div>
                    <span>Tap "Install app" or "Add to Home screen"</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold">3</div>
                    <span>Confirm to install</span>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop fallback */}
            {!isIOS && !isAndroid && !deferredPrompt && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Look for the install icon in your browser's address bar or menu to install this app.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstallApp;
