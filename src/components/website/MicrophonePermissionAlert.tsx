import { memo, useCallback, useMemo } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mic, X, ExternalLink, Settings, RefreshCw } from "lucide-react";

interface MicrophonePermissionAlertProps {
  language: string;
  onDismiss: () => void;
}

// Detect platform for settings deep links
const getPlatformInfo = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isSamsung = /Samsung/i.test(ua);
  const isChrome = /Chrome/i.test(ua) && !/Edge|Edg/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isFirefox = /Firefox/i.test(ua);
  
  return { isIOS, isAndroid, isSamsung, isChrome, isSafari, isFirefox };
};

// Get platform-specific instructions
const getInstructions = (language: string, platform: ReturnType<typeof getPlatformInfo>) => {
  const { isIOS, isAndroid, isSamsung, isChrome, isSafari, isFirefox } = platform;
  
  if (isIOS) {
    return language === "TR" ? {
      title: "iPhone/iPad için:",
      steps: [
        "Ayarlar uygulamasını açın",
        `Safari (veya ${isChrome ? 'Chrome' : 'tarayıcınız'}) > Mikrofon'a gidin`,
        "Bu site için mikrofona izin verin",
        "Sayfayı yenileyin"
      ],
      settingsUrl: "app-settings:",
      settingsLabel: "Ayarları Aç"
    } : {
      title: "For iPhone/iPad:",
      steps: [
        "Open Settings app",
        `Go to Safari (or ${isChrome ? 'Chrome' : 'your browser'}) > Microphone`,
        "Allow microphone for this site",
        "Refresh the page"
      ],
      settingsUrl: "app-settings:",
      settingsLabel: "Open Settings"
    };
  }
  
  if (isAndroid) {
    const browserName = isSamsung ? 'Samsung Internet' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'tarayıcı';
    
    return language === "TR" ? {
      title: "Android için:",
      steps: [
        "Adres çubuğundaki kilit/bilgi simgesine dokunun",
        "Site ayarları > Mikrofon'a gidin",
        '"İzin Ver" seçeneğini seçin',
        "Sayfayı yenileyin"
      ],
      settingsUrl: isChrome ? "chrome://settings/content/microphone" : null,
      settingsLabel: `${browserName} Ayarları`
    } : {
      title: "For Android:",
      steps: [
        "Tap the lock/info icon in address bar",
        "Go to Site settings > Microphone",
        'Select "Allow"',
        "Refresh the page"
      ],
      settingsUrl: isChrome ? "chrome://settings/content/microphone" : null,
      settingsLabel: `${browserName} Settings`
    };
  }
  
  // Desktop
  return language === "TR" ? {
    title: "Masaüstü tarayıcı için:",
    steps: [
      "Adres çubuğundaki kilit simgesine tıklayın",
      "Mikrofon iznini 'İzin Ver' olarak değiştirin",
      "Sayfayı yenileyin"
    ],
    settingsUrl: isChrome ? "chrome://settings/content/microphone" : isFirefox ? "about:preferences#privacy" : null,
    settingsLabel: "Tarayıcı Ayarları"
  } : {
    title: "For desktop browser:",
    steps: [
      "Click the lock icon in the address bar",
      "Change microphone permission to 'Allow'",
      "Refresh the page"
    ],
    settingsUrl: isChrome ? "chrome://settings/content/microphone" : isFirefox ? "about:preferences#privacy" : null,
    settingsLabel: "Browser Settings"
  };
};

export const MicrophonePermissionAlert = memo(function MicrophonePermissionAlert({ 
  language, 
  onDismiss 
}: MicrophonePermissionAlertProps) {
  const platform = useMemo(() => getPlatformInfo(), []);
  const instructions = useMemo(() => getInstructions(language, platform), [language, platform]);
  
  const handleOpenSettings = useCallback(() => {
    if (platform.isIOS && instructions.settingsUrl) {
      // iOS app settings deep link
      window.location.href = instructions.settingsUrl;
    } else if (platform.isAndroid) {
      // For Android Chrome, we can try to open the site-specific permissions
      // Unfortunately, there's no reliable deep link for all Android browsers
      // Show a toast or guide the user
      alert(language === "TR" 
        ? "Adres çubuğundaki kilit/bilgi simgesine dokunarak site ayarlarına erişebilirsiniz."
        : "You can access site settings by tapping the lock/info icon in the address bar."
      );
    } else if (instructions.settingsUrl) {
      // Try to open desktop browser settings (may not work in all cases)
      try {
        window.open(instructions.settingsUrl, '_blank');
      } catch {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  }, [platform, instructions, language]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <Alert className="mb-2 border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
            <Mic className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
            {language === "TR" 
              ? "Mikrofon İzni Gerekli"
              : "Microphone Permission Required"
            }
          </AlertTitle>
          <AlertDescription className="text-xs text-amber-700 dark:text-amber-300 space-y-2">
            <p>
              {language === "TR" 
                ? "Sesli komut kullanabilmek için tarayıcınızda mikrofon iznini etkinleştirmeniz gerekiyor."
                : "To use voice commands, you need to enable microphone permission in your browser."
              }
            </p>
            <div className="flex flex-col gap-1.5 mt-2 p-2 bg-amber-100/50 dark:bg-amber-900/30 rounded-md">
              <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                {platform.isIOS ? "📱" : platform.isAndroid ? "🤖" : "💻"} {instructions.title}
              </p>
              <ul className="text-[11px] space-y-0.5 list-decimal list-inside">
                {instructions.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Settings Button - Primary action for mobile */}
              {(platform.isIOS || platform.isAndroid) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleOpenSettings}
                  className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
                >
                  <Settings className="h-3 w-3 mr-1.5" />
                  {instructions.settingsLabel}
                  {platform.isIOS && <ExternalLink className="h-3 w-3 ml-1" />}
                </Button>
              )}
              
              {/* Refresh Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="h-7 px-3 text-xs bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200"
              >
                <RefreshCw className="h-3 w-3 mr-1.5" />
                {language === "TR" ? "Yenile" : "Refresh"}
              </Button>
              
              {/* Dismiss Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onDismiss}
                className="h-7 px-3 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
              >
                {language === "TR" ? "Kapat" : "Dismiss"}
              </Button>
            </div>
          </AlertDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDismiss} 
          className="h-6 w-6 p-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 flex-shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
});

export default MicrophonePermissionAlert;
