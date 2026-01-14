import { motion } from "framer-motion";
import { Check, X, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatQuickReplyButtonsProps {
  language: string;
  type: "return_transfer" | "confirm" | "yes_no";
  onReply: (answer: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatQuickReplyButtons({
  language,
  type,
  onReply,
  disabled = false,
  className,
}: ChatQuickReplyButtonsProps) {
  const getButtons = () => {
    switch (type) {
      case "return_transfer":
        return [
          {
            text: language === "TR" ? "Evet, İstiyorum" : "Yes, I want",
            value: language === "TR" ? "Evet, dönüş transferi istiyorum" : "Yes, I want a return transfer",
            icon: RotateCcw,
            variant: "default" as const,
            className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
          },
          {
            text: language === "TR" ? "Hayır, Sadece Gidiş" : "No, One Way Only",
            value: language === "TR" ? "Hayır, sadece tek yön istiyorum" : "No, I only want one-way transfer",
            icon: ArrowRight,
            variant: "outline" as const,
            className: "border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50",
          },
        ];
      case "confirm":
        return [
          {
            text: language === "TR" ? "Onayla" : "Confirm",
            value: language === "TR" ? "Evet, onaylıyorum" : "Yes, I confirm",
            icon: Check,
            variant: "default" as const,
            className: "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30",
          },
          {
            text: language === "TR" ? "İptal" : "Cancel",
            value: language === "TR" ? "Hayır, iptal et" : "No, cancel",
            icon: X,
            variant: "outline" as const,
            className: "border-2 border-destructive/30 hover:border-destructive/50 text-destructive hover:bg-destructive/10",
          },
        ];
      case "yes_no":
      default:
        return [
          {
            text: language === "TR" ? "Evet" : "Yes",
            value: language === "TR" ? "Evet" : "Yes",
            icon: Check,
            variant: "default" as const,
            className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
          },
          {
            text: language === "TR" ? "Hayır" : "No",
            value: language === "TR" ? "Hayır" : "No",
            icon: X,
            variant: "outline" as const,
            className: "border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50",
          },
        ];
    }
  };

  const buttons = getButtons();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn("flex flex-wrap gap-2 mt-3", className)}
    >
      {buttons.map((button, index) => {
        const Icon = button.icon;
        return (
          <motion.div
            key={button.value}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.1 }}
          >
            <Button
              size="sm"
              variant={button.variant}
              disabled={disabled}
              onClick={() => onReply(button.value)}
              className={cn(
                "h-10 px-4 rounded-xl font-medium transition-all duration-200 touch-manipulation",
                "active:scale-95",
                button.className
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {button.text}
            </Button>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
