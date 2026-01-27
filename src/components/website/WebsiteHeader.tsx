import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Menu, X, MapPin, Car, Phone, FileText, Info, LogIn, LogOut, User, UserPlus, Building2 } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import meetTransferLogo from "@/assets/meet-transfer-logo-new.png";

const WebsiteHeader = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { user, signOut } = useAuth();
  const { role: userRole } = useUserRole();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

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
    <header className={`w-full z-50 bg-black border-b border-border/20 transition-all duration-300 ${isSticky ? 'fixed top-0 left-0 right-0 shadow-lg animate-in slide-in-from-top-2' : ''}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-20 sm:h-24">
        {/* Left - Logo + Brand Name + Sign Up */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to={getLocalizedPath("/")} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="h-14 w-14 sm:h-16 sm:w-16 bg-black rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src={meetTransferLogo} 
                alt="Meet Transfer" 
                width={64}
                height={64}
                loading="eager"
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white whitespace-nowrap tracking-tight">
              Meet Transfer
            </h1>
          </Link>
          
          {/* Sign Up Button - Next to brand */}
          {!user && (
            <Link to="/signup">
              <Button 
                size="sm" 
                variant="accent"
                className="font-bold px-2 sm:px-4 md:px-6 h-8 sm:h-10 text-xs sm:text-sm"
              >
                <UserPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">{t("signUp") || "Sign Up"}</span>
                <span className="xs:hidden">{t("signUp")?.split(' ')[0] || "Sign"}</span>
              </Button>
            </Link>
          )}
        </div>

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

          {/* Mobile Menu Button */}
          <Button
            ref={buttonRef}
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu - Slide-in Panel from Right */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Slide Panel */}
          <div 
            ref={menuRef}
            className="lg:hidden fixed right-0 top-0 h-full w-72 bg-black border-l border-white/10 shadow-2xl z-50 animate-in slide-in-from-right duration-300"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link 
                to={getLocalizedPath("/")} 
                className="flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <img 
                  src={meetTransferLogo} 
                  alt="Meet Transfer" 
                  className="h-10 w-10 object-contain"
                />
                <span className="text-white font-bold text-lg">Meet Transfer</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 flex flex-col gap-1 overflow-y-auto h-[calc(100%-80px)]">
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

              {/* Agency Registration Link */}
              <div className="pt-3 mt-2 border-t border-white/10">
                <Link
                  to="/signup/agency"
                  className="flex items-center gap-3 text-accent hover:text-accent/80 hover:bg-accent/10 py-3 px-3 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="font-medium">{t("agencyRegistration") || "Agency Registration"}</span>
                </Link>
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
        </>
      )}
    </header>
  );
};

export default WebsiteHeader;
