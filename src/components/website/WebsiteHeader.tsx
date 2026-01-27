import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Menu, X, MapPin, Car, Phone, FileText, Info, LogIn, LogOut, User } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import meetTransferLogo from "@/assets/meet-transfer-logo-new.png";

const WebsiteHeader = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { user, signOut } = useAuth();
  const { role: userRole } = useUserRole();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/destinations", label: t("cities") || "Cities", icon: MapPin },
    { path: "/fleet", label: t("fleet") || "Fleet", icon: Car },
    { path: "/about", label: t("about") || "About", icon: Info },
    { path: "/terms", label: t("terms") || "Terms", icon: FileText },
    { path: "/contact", label: t("contact") || "Contact", icon: Phone },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const getAccountPath = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'driver') return '/driver';
    if (userRole === 'agency') return '/agency';
    return '/customer';
  };

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

        {/* Center - Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={getLocalizedPath(link.path)}
              className="text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right - Language + Auth + Book Now + Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Selector - Desktop */}
          <div className="hidden sm:block">
            <LanguageSelector />
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                <Link to={getAccountPath()}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10"
                  >
                    <User className="h-4 w-4 mr-1.5" />
                    {t("myAccount") || "My Account"}
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4 mr-1.5" />
                  {t("logout") || "Logout"}
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  {t("login") || "Login"}
                </Button>
              </Link>
            )}
          </div>

          {/* Book Now Button */}
          <Link to={getLocalizedPath("/")}>
            <Button 
              size="sm" 
              variant="accent"
              className="font-bold px-3 sm:px-6"
            >
              {t("bookNow") || "Book Now"}
            </Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-md border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={getLocalizedPath(link.path)}
                className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 py-3 px-3 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
            
            {/* Mobile Auth Buttons */}
            <div className="pt-3 mt-2 border-t border-white/10">
              {user ? (
                <>
                  <Link
                    to={getAccountPath()}
                    className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 py-3 px-3 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">{t("myAccount") || "My Account"}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 py-3 px-3 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">{t("logout") || "Logout"}</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 py-3 px-3 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="h-5 w-5" />
                  <span className="font-medium">{t("login") || "Login"}</span>
                </Link>
              )}
            </div>

            {/* Mobile Language Selector */}
            <div className="pt-3 mt-2 border-t border-white/10">
              <div className="flex items-center gap-3 px-3 py-2">
                <span className="text-white/60 text-sm">Language:</span>
                <LanguageSelector onLanguageChange={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default WebsiteHeader;
