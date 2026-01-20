import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share, Plus, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/meet-transfer-logo.webp";

interface IOSInstallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IOSInstallModal({ open, onOpenChange }: IOSInstallModalProps) {
  const { language } = useLanguage();
  const isTurkish = language === 'TR';

  const texts = {
    title: isTurkish ? 'Uygulamayı Yükle' : 'Install App',
    description: isTurkish 
      ? 'Meet Transfer uygulamasını ana ekranınıza ekleyin' 
      : 'Add Meet Transfer to your home screen',
    step1: isTurkish ? 'Paylaş butonuna dokunun' : 'Tap the Share button',
    step2: isTurkish ? '"Ana Ekrana Ekle" seçeneğine dokunun' : 'Tap "Add to Home Screen"',
    step3: isTurkish ? '"Ekle" butonuna dokunun' : 'Tap "Add" to confirm',
    note: isTurkish 
      ? 'Safari tarayıcısında olduğunuzdan emin olun' 
      : 'Make sure you are using Safari browser',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-border">
            <img src={logo} alt="Meet Transfer" className="w-full h-full object-cover" />
          </div>
          <DialogTitle className="text-xl font-serif">{texts.title}</DialogTitle>
          <DialogDescription>{texts.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">
              1
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{texts.step1}</span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Share className="h-4 w-4 text-accent" />
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">
              2
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{texts.step2}</span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Plus className="h-4 w-4 text-accent" />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold shrink-0">
              3
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>{texts.step3}</span>
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-3">
          💡 {texts.note}
        </p>
      </DialogContent>
    </Dialog>
  );
}