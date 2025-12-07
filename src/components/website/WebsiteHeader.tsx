import { Link } from "react-router-dom";
import { Menu, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "./LanguageSelector";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import meetTransferLogo from "@/assets/meet-transfer-logo.jpg";

const WebsiteHeader = () => {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();

  const navLinks = [
    { path: "/destinations", label: t("cities") },
    { path: "/fleet", label: t("fleet") },
    { path: "/about", label: t("about") },
    { path: "/contact", label: t("contact") },
    { path: "/reviews", label: t("reviews") },
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
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-lg font-medium hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                
                <div className="border-t border-border my-4 pt-4">
                  {user ? (
                    <>
                      <Link to={getDashboardPath()}>
                        <Button variant="outline" className="w-full mb-3 gap-2">
                          <User className="h-4 w-4" />
                          My Account
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full gap-2"
                        onClick={() => signOut()}
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login">
                        <Button variant="outline" className="w-full mb-3 gap-2">
                          <LogIn className="h-4 w-4" />
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button variant="ghost" className="w-full mb-3">
                          Create Account
                        </Button>
                      </Link>
                      <Link to="/book">
                        <Button variant="accent" className="w-full">
                          {t("bookNow")}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default WebsiteHeader;
