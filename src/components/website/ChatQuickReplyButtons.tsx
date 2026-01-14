import { motion } from "framer-motion";
import { Check, X, RotateCcw, ArrowRight, Car, CreditCard, Banknote, Users, Baby, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuickReplyType = 
  | "return_transfer" 
  | "confirm" 
  | "yes_no" 
  | "vehicle_selection" 
  | "payment_method"
  | "passenger_count"
  | "extras";

interface ChatQuickReplyButtonsProps {
  language: string;
  type: QuickReplyType;
  onReply: (answer: string) => void;
  disabled?: boolean;
  className?: string;
}

interface QuickReplyButton {
  text: string;
  value: string;
  icon: typeof Check;
  variant: "default" | "outline";
  className: string;
}

const getLocalizedText = (language: string, translations: Record<string, string>): string => {
  return translations[language] || translations["EN"];
};

export function ChatQuickReplyButtons({
  language,
  type,
  onReply,
  disabled = false,
  className,
}: ChatQuickReplyButtonsProps) {
  const getButtons = (): QuickReplyButton[] => {
    switch (type) {
      case "return_transfer":
        return [
          {
            text: getLocalizedText(language, {
              TR: "Evet, İstiyorum",
              EN: "Yes, I want",
              DE: "Ja, bitte",
              FR: "Oui, je veux",
              RU: "Да, хочу",
              AR: "نعم، أريد",
              ES: "Sí, quiero",
              IT: "Sì, voglio",
            }),
            value: getLocalizedText(language, {
              TR: "Evet, dönüş transferi istiyorum",
              EN: "Yes, I want a return transfer",
              DE: "Ja, ich möchte einen Rücktransfer",
              FR: "Oui, je veux un transfert retour",
              RU: "Да, я хочу обратный трансфер",
              AR: "نعم، أريد نقل العودة",
              ES: "Sí, quiero un transfer de regreso",
              IT: "Sì, voglio un transfer di ritorno",
            }),
            icon: RotateCcw,
            variant: "default",
            className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
          },
          {
            text: getLocalizedText(language, {
              TR: "Hayır, Sadece Gidiş",
              EN: "No, One Way Only",
              DE: "Nein, nur Hinfahrt",
              FR: "Non, aller simple",
              RU: "Нет, только в одну сторону",
              AR: "لا، ذهاب فقط",
              ES: "No, solo ida",
              IT: "No, solo andata",
            }),
            value: getLocalizedText(language, {
              TR: "Hayır, sadece tek yön istiyorum",
              EN: "No, I only want one-way transfer",
              DE: "Nein, ich möchte nur eine Hinfahrt",
              FR: "Non, je veux seulement un aller simple",
              RU: "Нет, мне нужен только односторонний трансфер",
              AR: "لا، أريد نقل ذهاب فقط",
              ES: "No, solo quiero un transfer de ida",
              IT: "No, voglio solo un transfer di andata",
            }),
            icon: ArrowRight,
            variant: "outline",
            className: "border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50",
          },
        ];

      case "vehicle_selection":
        return [
          {
            text: getLocalizedText(language, { TR: "Sedan (1-3)", EN: "Sedan (1-3)", DE: "Limousine (1-3)", FR: "Berline (1-3)", RU: "Седан (1-3)", AR: "سيدان (1-3)", ES: "Sedán (1-3)", IT: "Berlina (1-3)" }),
            value: getLocalizedText(language, { TR: "Sedan araç istiyorum (1-3 kişi)", EN: "I want a Sedan vehicle (1-3 passengers)", DE: "Ich möchte eine Limousine (1-3 Passagiere)", FR: "Je veux une berline (1-3 passagers)", RU: "Хочу седан (1-3 пассажира)", AR: "أريد سيارة سيدان (1-3 ركاب)", ES: "Quiero un sedán (1-3 pasajeros)", IT: "Voglio una berlina (1-3 passeggeri)" }),
            icon: Car,
            variant: "outline",
            className: "border-2 border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10 text-blue-600",
          },
          {
            text: getLocalizedText(language, { TR: "VIP Minivan (4-6)", EN: "VIP Minivan (4-6)", DE: "VIP Minivan (4-6)", FR: "Minivan VIP (4-6)", RU: "VIP минивэн (4-6)", AR: "ميني فان VIP (4-6)", ES: "Minivan VIP (4-6)", IT: "Minivan VIP (4-6)" }),
            value: getLocalizedText(language, { TR: "VIP Minivan istiyorum (4-6 kişi)", EN: "I want a VIP Minivan (4-6 passengers)", DE: "Ich möchte einen VIP Minivan (4-6 Passagiere)", FR: "Je veux un minivan VIP (4-6 passagers)", RU: "Хочу VIP минивэн (4-6 пассажиров)", AR: "أريد ميني فان VIP (4-6 ركاب)", ES: "Quiero un minivan VIP (4-6 pasajeros)", IT: "Voglio un minivan VIP (4-6 passeggeri)" }),
            icon: Car,
            variant: "default",
            className: "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-white shadow-lg shadow-amber-500/30",
          },
          {
            text: getLocalizedText(language, { TR: "Minibüs (7-14)", EN: "Minibus (7-14)", DE: "Kleinbus (7-14)", FR: "Minibus (7-14)", RU: "Минибус (7-14)", AR: "ميني باص (7-14)", ES: "Minibús (7-14)", IT: "Minibus (7-14)" }),
            value: getLocalizedText(language, { TR: "Minibüs istiyorum (7-14 kişi)", EN: "I want a Minibus (7-14 passengers)", DE: "Ich möchte einen Kleinbus (7-14 Passagiere)", FR: "Je veux un minibus (7-14 passagers)", RU: "Хочу минибус (7-14 пассажиров)", AR: "أريد ميني باص (7-14 راكب)", ES: "Quiero un minibús (7-14 pasajeros)", IT: "Voglio un minibus (7-14 passeggeri)" }),
            icon: Users,
            variant: "outline",
            className: "border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-600",
          },
        ];

      case "payment_method":
        return [
          {
            text: getLocalizedText(language, { TR: "Kredi Kartı", EN: "Credit Card", DE: "Kreditkarte", FR: "Carte de crédit", RU: "Кредитная карта", AR: "بطاقة ائتمان", ES: "Tarjeta de crédito", IT: "Carta di credito" }),
            value: getLocalizedText(language, { TR: "Kredi kartı ile ödeme yapmak istiyorum", EN: "I want to pay by credit card", DE: "Ich möchte mit Kreditkarte bezahlen", FR: "Je veux payer par carte de crédit", RU: "Хочу оплатить кредитной картой", AR: "أريد الدفع ببطاقة الائتمان", ES: "Quiero pagar con tarjeta de crédito", IT: "Voglio pagare con carta di credito" }),
            icon: CreditCard,
            variant: "default",
            className: "bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-lg shadow-emerald-500/30",
          },
          {
            text: getLocalizedText(language, { TR: "Nakit", EN: "Cash", DE: "Bargeld", FR: "Espèces", RU: "Наличные", AR: "نقداً", ES: "Efectivo", IT: "Contanti" }),
            value: getLocalizedText(language, { TR: "Nakit ödeme yapmak istiyorum", EN: "I want to pay in cash", DE: "Ich möchte bar bezahlen", FR: "Je veux payer en espèces", RU: "Хочу оплатить наличными", AR: "أريد الدفع نقداً", ES: "Quiero pagar en efectivo", IT: "Voglio pagare in contanti" }),
            icon: Banknote,
            variant: "outline",
            className: "border-2 border-green-500/30 hover:border-green-500/50 hover:bg-green-500/10 text-green-600",
          },
        ];

      case "passenger_count":
        return [
          {
            text: "1-2",
            value: getLocalizedText(language, { TR: "1-2 yolcu", EN: "1-2 passengers", DE: "1-2 Passagiere", FR: "1-2 passagers", RU: "1-2 пассажира", AR: "1-2 ركاب", ES: "1-2 pasajeros", IT: "1-2 passeggeri" }),
            icon: Users,
            variant: "outline",
            className: "border-2 border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/10",
          },
          {
            text: "3-4",
            value: getLocalizedText(language, { TR: "3-4 yolcu", EN: "3-4 passengers", DE: "3-4 Passagiere", FR: "3-4 passagers", RU: "3-4 пассажира", AR: "3-4 ركاب", ES: "3-4 pasajeros", IT: "3-4 passeggeri" }),
            icon: Users,
            variant: "default",
            className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
          },
          {
            text: "5-6",
            value: getLocalizedText(language, { TR: "5-6 yolcu", EN: "5-6 passengers", DE: "5-6 Passagiere", FR: "5-6 passagers", RU: "5-6 пассажиров", AR: "5-6 ركاب", ES: "5-6 pasajeros", IT: "5-6 passeggeri" }),
            icon: Users,
            variant: "outline",
            className: "border-2 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-600",
          },
          {
            text: "7+",
            value: getLocalizedText(language, { TR: "7 veya daha fazla yolcu", EN: "7 or more passengers", DE: "7 oder mehr Passagiere", FR: "7 passagers ou plus", RU: "7 и более пассажиров", AR: "7 ركاب أو أكثر", ES: "7 o más pasajeros", IT: "7 o più passeggeri" }),
            icon: Users,
            variant: "outline",
            className: "border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-600",
          },
        ];

      case "extras":
        return [
          {
            text: getLocalizedText(language, { TR: "Bebek Koltuğu", EN: "Baby Seat", DE: "Kindersitz", FR: "Siège bébé", RU: "Детское кресло", AR: "مقعد طفل", ES: "Silla de bebé", IT: "Seggiolino" }),
            value: getLocalizedText(language, { TR: "Bebek koltuğu istiyorum", EN: "I need a baby seat", DE: "Ich brauche einen Kindersitz", FR: "J'ai besoin d'un siège bébé", RU: "Мне нужно детское кресло", AR: "أحتاج مقعد طفل", ES: "Necesito una silla de bebé", IT: "Ho bisogno di un seggiolino" }),
            icon: Baby,
            variant: "outline",
            className: "border-2 border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10 text-pink-600",
          },
          {
            text: getLocalizedText(language, { TR: "Ekstra Bagaj", EN: "Extra Luggage", DE: "Extra Gepäck", FR: "Bagages supplémentaires", RU: "Дополнительный багаж", AR: "أمتعة إضافية", ES: "Equipaje extra", IT: "Bagaglio extra" }),
            value: getLocalizedText(language, { TR: "Ekstra bagaj alanı istiyorum", EN: "I need extra luggage space", DE: "Ich brauche extra Gepäckraum", FR: "J'ai besoin d'espace supplémentaire pour les bagages", RU: "Мне нужно дополнительное место для багажа", AR: "أحتاج مساحة أمتعة إضافية", ES: "Necesito espacio extra para equipaje", IT: "Ho bisogno di spazio extra per i bagagli" }),
            icon: Briefcase,
            variant: "outline",
            className: "border-2 border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10 text-orange-600",
          },
          {
            text: getLocalizedText(language, { TR: "Hayır, Teşekkürler", EN: "No, Thanks", DE: "Nein, danke", FR: "Non, merci", RU: "Нет, спасибо", AR: "لا، شكراً", ES: "No, gracias", IT: "No, grazie" }),
            value: getLocalizedText(language, { TR: "Ekstra hizmet istemiyorum", EN: "I don't need any extras", DE: "Ich brauche keine Extras", FR: "Je n'ai pas besoin d'extras", RU: "Мне не нужны дополнительные услуги", AR: "لا أحتاج إضافات", ES: "No necesito extras", IT: "Non ho bisogno di extra" }),
            icon: X,
            variant: "outline",
            className: "border-2 border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50",
          },
        ];

      case "confirm":
        return [
          {
            text: getLocalizedText(language, { TR: "Onayla", EN: "Confirm", DE: "Bestätigen", FR: "Confirmer", RU: "Подтвердить", AR: "تأكيد", ES: "Confirmar", IT: "Conferma" }),
            value: getLocalizedText(language, { TR: "Evet, onaylıyorum", EN: "Yes, I confirm", DE: "Ja, ich bestätige", FR: "Oui, je confirme", RU: "Да, подтверждаю", AR: "نعم، أؤكد", ES: "Sí, confirmo", IT: "Sì, confermo" }),
            icon: Check,
            variant: "default",
            className: "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/30",
          },
          {
            text: getLocalizedText(language, { TR: "İptal", EN: "Cancel", DE: "Abbrechen", FR: "Annuler", RU: "Отмена", AR: "إلغاء", ES: "Cancelar", IT: "Annulla" }),
            value: getLocalizedText(language, { TR: "Hayır, iptal et", EN: "No, cancel", DE: "Nein, abbrechen", FR: "Non, annuler", RU: "Нет, отменить", AR: "لا، إلغاء", ES: "No, cancelar", IT: "No, annulla" }),
            icon: X,
            variant: "outline",
            className: "border-2 border-destructive/30 hover:border-destructive/50 text-destructive hover:bg-destructive/10",
          },
        ];

      case "yes_no":
      default:
        return [
          {
            text: getLocalizedText(language, { TR: "Evet", EN: "Yes", DE: "Ja", FR: "Oui", RU: "Да", AR: "نعم", ES: "Sí", IT: "Sì" }),
            value: getLocalizedText(language, { TR: "Evet", EN: "Yes", DE: "Ja", FR: "Oui", RU: "Да", AR: "نعم", ES: "Sí", IT: "Sì" }),
            icon: Check,
            variant: "default",
            className: "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30",
          },
          {
            text: getLocalizedText(language, { TR: "Hayır", EN: "No", DE: "Nein", FR: "Non", RU: "Нет", AR: "لا", ES: "No", IT: "No" }),
            value: getLocalizedText(language, { TR: "Hayır", EN: "No", DE: "Nein", FR: "Non", RU: "Нет", AR: "لا", ES: "No", IT: "No" }),
            icon: X,
            variant: "outline",
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
