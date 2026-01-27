import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import meetTransferLogo from "@/assets/meet-transfer-logo-new.png";

const WebsiteHeader = () => {
  const { t, getLocalizedPath } = useLanguage();

  return (
    <header className="sticky top-0 w-full z-50 bg-black border-b border-border/20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 sm:h-16">
        {/* Left - Logo + Brand Name */}
        <Link to={getLocalizedPath("/")} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-black rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer" 
              width={48}
              height={48}
              loading="eager"
              className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            />
          </div>
          <h1 className="text-lg sm:text-xl font-black text-white whitespace-nowrap tracking-tight">
            Meet Transfer
          </h1>
        </Link>

        {/* Right - Book Now Button Only */}
        <Link to={getLocalizedPath("/")}>
          <Button 
            size="sm" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 sm:px-6"
          >
            {t("bookNow") || "Book Now"}
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default WebsiteHeader;
