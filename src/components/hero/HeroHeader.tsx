import { memo } from "react";
import { Plane } from "lucide-react";

interface HeroHeaderProps {
  language: string;
}

const translations = {
  title: {
    EN: "Your Reliable Airport Transfers",
    TR: "Güvenilir Havalimanı Transferleriniz",
    DE: "Ihre zuverlässigen Flughafentransfers",
    FR: "Vos transferts aéroport fiables",
    RU: "Ваши надежные трансферы в аэропорт",
    IT: "I tuoi trasferimenti aeroportuali affidabili",
    ES: "Sus traslados fiables al aeropuerto",
    AR: "تنقلاتك الموثوقة من وإلى المطار",
    UK: "Ваші надійні трансфери в аеропорт",
    JA: "信頼できる空港送迎",
    PT: "Seus traslados de aeroporto confiáveis"
  },
  discount: {
    EN: "Return 25% Discount",
    TR: "Dönüş %25 İndirim",
    DE: "Rückfahrt 25% Rabatt",
    FR: "Retour 25% de réduction",
    RU: "Обратный трансфер скидка 25%",
    IT: "Ritorno sconto 25%",
    ES: "Regreso 25% de descuento",
    AR: "خصم 25% على العودة",
    UK: "Зворотній трансфер знижка 25%",
    JA: "復路25%割引",
    PT: "Retorno 25% de desconto"
  }
};

export const HeroHeader = memo(({ language }: HeroHeaderProps) => {
  const lang = language.toUpperCase() as keyof typeof translations.title;
  const title = translations.title[lang] || translations.title.EN;
  const discount = translations.discount[lang] || translations.discount.EN;

  return (
    <div className="text-center">
      {/* Mobile-first: base size then scale up */}
      <h1 className="text-[1.75rem] font-black leading-[1.15] tracking-tight text-foreground sm:text-[2rem] md:text-[2.5rem] lg:text-[2.75rem]">
        {title}
      </h1>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="text-xl sm:text-2xl">🇹🇷</span>
        <Plane className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        <span className="text-lg font-bold text-primary sm:text-xl md:text-2xl">
          {discount}
        </span>
      </div>
    </div>
  );
});

HeroHeader.displayName = "HeroHeader";
