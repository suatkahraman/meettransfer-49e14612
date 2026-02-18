import { useState, useEffect } from "react";
import { Car, Timer } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

// Minimal Hero component to isolate the issue
export const HeroMinimal = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"ride" | "hourly">("ride");

  // Simple safe translation function
  const tSafe = (key: string, fallback: string) => {
    try {
      const value = t?.(key);
      if (!value || value === key) return fallback;
      return value;
    } catch {
      return fallback;
    }
  };

  return (
    <section id="booking-form" className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 z-0 bg-background" />
      
      <div className="container relative z-10 px-0 pt-0 pb-0 sm:px-3 sm:pt-4 sm:pb-4 md:px-4 md:pt-8 md:pb-8 lg:pb-16">
        <div className="grid min-h-[100svh] items-start gap-0 sm:min-h-[calc(100svh-8rem)] sm:gap-4 md:min-h-[calc(100svh-6rem)] md:grid-cols-5 md:gap-6 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left Side - Form */}
          <div className="h-full md:col-span-3 md:h-auto lg:col-span-1">
            <div className="flex min-h-[100svh] flex-col overflow-hidden bg-card shadow-lg sm:min-h-0 sm:rounded-2xl">
              {/* Header */}
              <div className="p-4 pb-2 pt-6 sm:p-5 sm:pb-3 sm:pt-4 md:p-6">
                <h1 className="text-2xl font-bold text-center sm:text-left">
                  {tSafe("welcomeBack", "Welcome Back!")}
                </h1>
                <p className="mt-2 text-sm font-semibold text-primary/90 text-center sm:text-left">
                  {tSafe("heroAITagline", "Meet AI: Plan Your Journey, Book with One Click!")}
                </p>
              </div>

              {/* Simple Tabs */}
              <div className="flex-1 flex flex-col p-4">
                <div className="relative flex border-b border-amber-200 bg-muted/50">
                  <button 
                    onClick={() => setActiveTab("ride")} 
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-4 py-4 text-xl font-bold transition-all",
                      activeTab === "ride" ? "bg-amber-200 text-primary shadow-sm" : "text-muted-foreground hover:bg-amber-100 hover:text-foreground"
                    )}
                  >
                    <Car className="h-6 w-6" />
                    <span>{tSafe("pointToPoint", "Transfer")}</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab("hourly")} 
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 px-4 py-4 text-xl font-bold transition-all",
                      activeTab === "hourly" ? "bg-amber-200 text-primary shadow-sm" : "text-muted-foreground hover:bg-amber-100 hover:text-foreground"
                    )}
                  >
                    <Timer className="h-6 w-6" />
                    <span>{tSafe("perHour", "Hourly")}</span>
                  </button>
                </div>

                {/* Simple Content */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-4">Form content will appear here...</p>
                    <p className="text-sm">Active tab: {activeTab}</p>
                    <p className="text-sm">Language: {language}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Visual */}
          <div className="hidden md:block md:col-span-2 lg:col-span-1">
            <div className="h-full flex items-center justify-center p-8">
              <div className="text-center text-muted-foreground">
                <p>Hero visual content will appear here...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroMinimal;