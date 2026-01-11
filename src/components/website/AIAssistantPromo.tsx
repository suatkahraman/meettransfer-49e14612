import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { MessageCircle, Bot, Sparkles, Clock, Globe, CheckCircle2 } from "lucide-react";
import aiChatImage from "@/assets/ai-chat-assistant.png";

const AIAssistantPromo = () => {
  const { t } = useLanguage();

  const scrollToAssistant = () => {
    // Trigger the chat assistant to open
    const chatButton = document.querySelector('[data-chat-trigger]') as HTMLButtonElement;
    if (chatButton) {
      chatButton.click();
    }
  };

  const features = [
    { icon: Clock, key: "aiPromoFeature1" },
    { icon: Globe, key: "aiPromoFeature2" },
    { icon: Sparkles, key: "aiPromoFeature3" },
    { icon: CheckCircle2, key: "aiPromoFeature4" },
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
              <Bot className="w-4 h-4" />
              <span>{t("aiPromoBadge")}</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {t("aiPromoTitle")}
            </h2>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("aiPromoDesc")}
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{t(feature.key)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={scrollToAssistant}
                size="lg"
                className="gap-2 text-lg px-8"
              >
                <MessageCircle className="w-5 h-5" />
                {t("aiPromoButton")}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground italic">
              {t("aiPromoHint")}
            </p>
          </div>

          {/* Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-2xl opacity-50" />
              
              {/* Phone mockup */}
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl max-w-sm mx-auto transform hover:scale-105 transition-transform duration-500">
                <img
                  src={aiChatImage}
                  alt={t("aiPromoImageAlt")}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-lg animate-bounce z-20">
                <Bot className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <div className="absolute -bottom-4 -left-4 px-4 py-2 bg-background rounded-full shadow-lg flex items-center gap-2 z-20">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">{t("aiPromoOnline")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantPromo;
