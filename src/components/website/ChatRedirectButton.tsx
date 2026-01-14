import { memo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatRedirectButtonProps {
  language: string;
  onRedirect: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ChatRedirectButton = memo(function ChatRedirectButton({
  language,
  onRedirect,
  isLoading = false,
  className,
}: ChatRedirectButtonProps) {
  const isTurkish = language === "TR";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("mt-3 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20", className)}
    >
      {/* Info Section */}
      <div className="space-y-2 mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          {isTurkish ? "Son Adım: Hesap Oluşturma" : "Final Step: Create Account"}
        </h4>
        
        <div className="text-[11px] text-muted-foreground space-y-1.5">
          <p className="flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
            {isTurkish 
              ? "E-posta ile giriş yapın veya Google hesabınızı kullanın" 
              : "Sign in with email or use your Google account"
            }
          </p>
          <p className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
            {isTurkish 
              ? "Giriş yaptıktan sonra şoför bilginiz atanacak" 
              : "After login, your driver will be assigned"
            }
          </p>
          <p className="flex items-start gap-2">
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            {isTurkish 
              ? "İstediğiniz zaman rezervasyonunuzu iptal edebilirsiniz" 
              : "You can cancel your reservation anytime"
            }
          </p>
        </div>
      </div>

      {/* Redirect Button */}
      <Button
        onClick={onRedirect}
        disabled={isLoading}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25"
      >
        <motion.div
          className="flex items-center gap-2"
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <UserPlus className="h-4 w-4" />
          <span>
            {isTurkish ? "Hesap Oluştur & Rezervasyonu Tamamla" : "Create Account & Complete Booking"}
          </span>
          <ArrowRight className="h-4 w-4" />
        </motion.div>
      </Button>

      {/* Skip Option */}
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        {isTurkish 
          ? "İsterseniz daha sonra da devam edebilirsiniz" 
          : "You can also continue later if you prefer"
        }
      </p>
    </motion.div>
  );
});

export default ChatRedirectButton;
