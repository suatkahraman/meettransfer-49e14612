import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  
  // Construct the external URL with current search params
  const externalUrl = new URL("https://reservations.meettransfer.app/");
  searchParams.forEach((value, key) => {
    externalUrl.searchParams.set(key, value);
  });
  
  // Add language if not present
  if (!externalUrl.searchParams.has("lang")) {
    const { language } = useLanguage();
    externalUrl.searchParams.set("lang", language);
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="bg-black border-b border-white/10 h-16 flex items-center px-4">
        <Link to="/" className="text-white flex items-center gap-2 hover:text-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">{t("back") || "Geri Dön"}</span>
        </Link>
      </header>
      <div className="flex-1 w-full overflow-hidden bg-white">
        <iframe 
          src={externalUrl.toString()} 
          className="w-full h-full border-none" 
          title="Booking"
          style={{ minHeight: "calc(100vh - 64px)" }}
        />
      </div>
    </div>
  );
};

export default BookingPage;
