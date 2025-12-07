import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
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
import meetTransferLogo from "@/assets/meet-transfer-logo.jpg";

const WebsiteHeader = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/services", label: "Services" },
    { path: "/destinations", label: t("cities") },
    { path: "/fleet", label: t("fleet") },
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
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={meetTransferLogo} 
            alt="Meet Transfer Logo" 
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-serif text-xl font-bold">Meet Transfer</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
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

        <div className="flex items-center gap-3">
          <LanguageSelector />
          
          {/* Auth Buttons - Desktop */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link to={getDashboardPath()}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  My Account
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signOut()}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/book">
                <Button variant="accent" size="sm">
                  {t("bookNow")}
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
              className="w-56 bg-card border border-border z-50"
            >
              {navLinks.map((link) => (
                <DropdownMenuItem 
                  key={link.path} 
                  asChild
                  className={isActive(link.path) ? "bg-primary/10 text-primary font-semibold" : ""}
                >
                  <Link
                    to={link.path}
                    className="w-full cursor-pointer flex items-center gap-2"
                  >
                    {isActive(link.path) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardPath()} className="w-full cursor-pointer gap-2">
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => signOut()}
                    className="cursor-pointer gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/login" className="w-full cursor-pointer gap-2">
                      <LogIn className="h-4 w-4" />
                      Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <Link to="/book">
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
