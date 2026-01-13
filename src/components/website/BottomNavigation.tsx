import { Home, MapPin, Car, Info, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIChat } from "@/contexts/AIChatContext";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();
  const { t, getLocalizedPath } = useLanguage();
  const { isAIChatOpen } = useAIChat();

  const navItems = [
    { path: "/", icon: Home, label: t("home") },
    { path: "/destinations", icon: MapPin, label: t("cities") },
    { path: "/fleet", icon: Car, label: t("fleet") },
    { path: "/about", icon: Info, label: t("about") },
    { path: "/contact", icon: Phone, label: t("contact") },
  ];

  // Check if path matches considering language prefix
  const isActive = (path: string) => {
    const localizedPath = getLocalizedPath(path);
    return location.pathname === localizedPath;
  };

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom transition-transform duration-300",
        isAIChatOpen && "translate-y-full pointer-events-none"
      )}
    >
      <div className="flex items-center justify-around h-16 sm:h-18">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={getLocalizedPath(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 sm:h-6 sm:w-6 mb-0.5 sm:mb-1" />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
