import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openWhatsApp } from "@/lib/contact";

interface DayTourPromoCardProps {
  title: string;
  description: string;
  ctaLabel: string;
  whatsappMessage?: string;
  /** Optional: used to dynamically build a city-specific WhatsApp message */
  city?: string;
  /** Optional template (supports {city}). If not provided, whatsappMessage will be used. */
  whatsappMessageTemplate?: string;
}

export default function DayTourPromoCard({
  title,
  description,
  ctaLabel,
  whatsappMessage,
  city,
  whatsappMessageTemplate,
}: DayTourPromoCardProps) {
  const resolvedMessage =
    whatsappMessageTemplate && city
      ? whatsappMessageTemplate.split("{city}").join(city)
      : whatsappMessage || "";

  return (
    <Card>
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="shrink-0">
            <Button variant="accent" onClick={() => openWhatsApp(resolvedMessage)}>
              {ctaLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
