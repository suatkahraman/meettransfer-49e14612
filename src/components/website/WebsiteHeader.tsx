import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, User, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
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
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

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

  const navLinks = [
    { path: "/services", label: t("services") || "Services" },
    { path: "/destinations", label: t("cities") },
    { path: "/fleet", label: t("fleet") },
    { path: "/blog", label: t("blog") || "Blog" },
    { path: "/about", label: t("about") },
    { path: "/contact", label: t("contact") },
  ];

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'driver') return '/driver';
    return '/customer';
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left - Logo */}
        <Link to={getLocalizedPath("/")} className="flex items-center gap-2 flex-shrink-0">
          <img 
            src={meetTransferLogo} 
            alt="Meet Transfer Logo" 
            className="h-9 w-9 rounded-full object-cover"
          />
          <span className="font-serif text-lg font-bold hidden sm:block">Meet Transfer</span>
        </Link>

        {/* Center - Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
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

        {/* Center - Book Button (Mobile) */}
        <Link to={user ? getLocalizedPath("/book") : getLocalizedPath("/#booking-form")} className="md:hidden">
          <Button variant="accent" size="sm" className="font-semibold text-xs px-3">
            {t("bookNow")}
          </Button>
        </Link>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Book Button (Desktop) */}
          <Link to={user ? getLocalizedPath("/book") : getLocalizedPath("/#booking-form")} className="hidden md:block">
            <Button variant="accent" size="sm" className="font-semibold">
              {t("bookNow")}
            </Button>
          </Link>
          {/* Install App Button (Desktop) - More prominent */}
          <div className="hidden md:block">
            <InstallAppButton 
              variant="outline" 
              size="sm" 
              className="border-accent/50 hover:bg-accent/10 hover:border-accent text-foreground"
            />
          </div>
          <div className="hidden md:block">
            <PushNotificationToggle />
          </div>
          <LanguageSelector />
          
          {/* Auth Buttons - Desktop */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to={getDashboardPath()}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  {t("myAccount")}
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  {t("login")}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu - Dropdown */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="relative w-10 h-10">
                <span className="sr-only">Toggle menu</span>
                <span 
                  className={`absolute h-0.5 w-5 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "rotate-45" : "-translate-y-1.5"
                  }`}
                />
                <span 
                  className={`absolute h-0.5 w-5 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span 
                  className={`absolute h-0.5 w-5 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "-rotate-45" : "translate-y-1.5"
                  }`}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-card border border-border z-50 animate-in slide-in-from-top-2 fade-in-0 duration-200"
            >
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <DropdownMenuItem 
                    key={link.path} 
                    className={active ? "bg-primary/15 focus:bg-primary/20" : ""}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Link
                      to={getLocalizedPath(link.path)}
                      className={`w-full flex items-center gap-2 ${active ? "text-primary font-semibold" : ""}`}
                    >
                      {active && (
                        <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <span>{link.label}</span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
              
              {/* Install App - Mobile Menu */}
              <DropdownMenuItem asChild>
                <Link to="/install" className="w-full cursor-pointer gap-2">
                  <Download className="h-4 w-4" />
                  {t("installApp") || "Install App"}
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="w-full cursor-pointer gap-2">
                      <User className="h-4 w-4" />
                      {t("myAccount")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="w-full cursor-pointer gap-2">
                      <LogIn className="h-4 w-4" />
                      {t("login")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Link to={getLocalizedPath("/#booking-form")}>
                      <Button variant="accent" className="w-full">
                        {t("bookNow")}
                      </Button>
                    </Link>
                  </div>
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
