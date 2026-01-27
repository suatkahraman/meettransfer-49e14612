import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, User, Building2, Briefcase, BookOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import UniversalLanguageSelector from "@/components/UniversalLanguageSelector";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { InstallAppButton } from "./InstallAppButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";

const WebsiteHeader = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Check if path matches considering language prefix
  const isActive = (path: string) => {
    const localizedPath = getLocalizedPath(path);
    return location.pathname === localizedPath;
  };

  // Simplified nav links - removed: cities, fleet, terms, about
  const navLinks = [
    { path: "/services", label: t("services") || "Services", icon: Briefcase },
    { path: "/blog", label: t("blog") || "Blog", icon: BookOpen },
    { path: "/contact", label: t("contact"), icon: Mail },
  ];

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'driver') return '/driver';
    return '/customer';
  };

  return (
    <header className="w-full z-50 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-28 sm:h-32">
        {/* Left - Logo (links to homepage) */}
        <Link to={getLocalizedPath("/")} className="flex-shrink-0 hover:scale-105 transition-transform">
          <img 
            src={meetTransferLogo} 
            alt="Meet Transfer" 
            width={72}
            height={72}
            loading="eager"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover shadow-xl ring-2 ring-primary/40"
          />
        </Link>

        {/* Center - Brand Name (links to homepage) */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link to={getLocalizedPath("/")} className="flex items-center hover:opacity-80 transition-opacity">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              <span className="text-primary">Meet</span> Transfer
            </h1>
          </Link>
        </div>

        {/* Right - Language & Menu */}
        <div className="flex items-center gap-2">
          <UniversalLanguageSelector variant="compact" />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3 ml-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={getLocalizedPath(link.path)}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.path) 
                    ? "text-primary font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <InstallAppButton variant="prominent" size="sm" animated />
            <PushNotificationToggle />
            
            {user ? (
              <>
                <Link to={getDashboardPath()}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    {t("myAccount")}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => signOut()} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    {t("guestLogin") || "Guest Login"}
                  </Button>
                </Link>
                <Link to="/login/agency">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    {t("agencyLogin") || "Agency"}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu - Hamburger */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="relative w-10 h-10 p-0 hover:bg-primary/10 rounded-lg">
                <span className="sr-only">Toggle menu</span>
                <span className={`absolute h-0.5 w-5 bg-foreground rounded-full transition-all duration-400 ease-out ${menuOpen ? "rotate-45" : "-translate-y-1.5"}`} />
                <span className={`absolute h-0.5 w-5 bg-foreground rounded-full transition-all duration-400 ease-out ${menuOpen ? "opacity-0 scale-0" : "opacity-100 scale-100"}`} />
                <span className={`absolute h-0.5 w-5 bg-foreground rounded-full transition-all duration-400 ease-out ${menuOpen ? "-rotate-45" : "translate-y-1.5"}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-card/98 backdrop-blur-lg border border-border shadow-xl z-50 animate-in slide-in-from-top-3 fade-in-0 duration-300">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                const IconComponent = link.icon;
                return (
                  <DropdownMenuItem key={link.path} className={`py-2.5 ${active ? "bg-primary/15 focus:bg-primary/20" : ""}`} onClick={() => setMenuOpen(false)}>
                    <Link to={getLocalizedPath(link.path)} className={`w-full flex items-center gap-3 ${active ? "text-primary font-semibold" : ""}`}>
                      <IconComponent className={`h-4 w-4 flex-shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              
              <div className="p-2">
                <InstallAppButton variant="prominent" size="default" fullWidth animated />
              </div>
              
              <DropdownMenuSeparator />
              
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="w-full cursor-pointer gap-2">
                      <User className="h-4 w-4" />
                      {t("myAccount")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer gap-2">
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="w-full cursor-pointer gap-2">
                      <LogIn className="h-4 w-4" />
                      {t("guestLogin") || "Guest Login"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/login/agency" className="w-full cursor-pointer gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("agencyLogin") || "Agency"}
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default WebsiteHeader;
