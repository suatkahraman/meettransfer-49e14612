import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, User, Download, Building2, ChevronDown } from "lucide-react";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";

const WebsiteHeader = () => {
  const { t, getLocalizedPath } = useLanguage();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
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
    { path: "/terms", label: t("terms") || "Terms" },
  ];

  const destinationLinks = [
    { path: "/istanbul-transfer", label: t("footerIstanbul") || "Istanbul Transfer" },
    { path: "/antalya-transfer", label: t("footerAntalya") || "Antalya Transfer" },
    { path: "/bodrum-transfer", label: t("footerBodrum") || "Bodrum Transfer" },
    { path: "/dalaman-transfer", label: t("footerDalaman") || "Dalaman Transfer" },
    { path: "/izmir-transfer", label: t("footerIzmir") || "Izmir Transfer" },
    { path: "/cappadocia-transfer", label: t("footerCappadocia") || "Cappadocia Transfer" },
    { path: "/dubai-transfer", label: t("footerDubai") || "Dubai Transfer" },
    { path: "/cyprus-transfer", label: t("footerCyprus") || "Cyprus Transfer" },
    { path: "/switzerland-transfer", label: t("footerSwitzerland") || "Switzerland Transfer" },
  ];

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'driver') return '/driver';
    return '/customer';
  };

  const scrollToBookingForm = useCallback(() => {
    const home = getLocalizedPath("/");

    // If not on homepage, navigate with hash; HashScroll will handle the actual scroll.
    if (location.pathname !== home) {
      navigate(`${home}#booking-form`);
      return;
    }

    const bookingForm = document.getElementById("booking-form");
    if (bookingForm) {
      bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Fallback: ensure hash is set so HashScroll can retry after mount.
    navigate(`${home}#booking-form`);
  }, [getLocalizedPath, location.pathname, navigate]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 h-14 sm:h-[4.5rem] relative flex items-center">
        {/* Left - Logo */}
        <Link to={getLocalizedPath("/")} className="flex items-center flex-shrink-0">
          <img
            src={meetTransferLogo}
            alt="Meet Transfer Logo"
            className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover shadow-xl ring-2 ring-primary/40 hover:ring-primary/60 transition-all"
          />
        </Link>

        {/* Center - Brand + Trust Text */}
        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center leading-none pointer-events-none">
          <Link to={getLocalizedPath("/")} className="pointer-events-auto">
            <span className="font-serif text-lg sm:text-2xl font-bold whitespace-nowrap tracking-tight">
              <span className="text-primary">Meet</span> Transfer
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
            <span>{t("fixedPrice")}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
            <span>{t("freeCancel")}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/60" aria-hidden="true" />
            <span>{t("proDriver")}</span>
          </div>
        </div>

        {/* Center - Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-4 ml-6">
          <Link
            to={getLocalizedPath("/services")}
            className={`text-sm font-medium transition-colors ${
              isActive("/services") 
                ? "text-primary font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("services") || "Services"}
          </Link>
          
          {/* Destinations Dropdown */}
          <NavigationMenu className="flex-none">
            <NavigationMenuList className="flex-none">
              <NavigationMenuItem>
                <NavigationMenuTrigger 
                  className={`text-sm font-medium bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent px-0 ${
                    location.pathname.includes("transfer") || isActive("/destinations")
                      ? "text-primary font-semibold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("cities")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-1 p-2 w-[200px]">
                    {destinationLinks.map((dest) => (
                      <NavigationMenuLink key={dest.path} asChild>
                        <Link
                          to={getLocalizedPath(dest.path)}
                          className={`block px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent ${
                            isActive(dest.path) ? "bg-primary/10 text-primary font-semibold" : ""
                          }`}
                        >
                          {dest.label}
                        </Link>
                      </NavigationMenuLink>
                    ))}
                    <NavigationMenuLink asChild>
                      <Link
                        to={getLocalizedPath("/destinations")}
                        className="block px-3 py-2 text-sm rounded-md transition-colors bg-primary/5 hover:bg-primary/10 text-primary font-medium mt-1"
                      >
                        {t("viewAllDestinations") || "View All →"}
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <Link
            to={getLocalizedPath("/fleet")}
            className={`text-sm font-medium transition-colors ${
              isActive("/fleet") 
                ? "text-primary font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("fleet")}
          </Link>
          <Link
            to={getLocalizedPath("/blog")}
            className={`text-sm font-medium transition-colors ${
              isActive("/blog") 
                ? "text-primary font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("blog") || "Blog"}
          </Link>
          <Link
            to={getLocalizedPath("/about")}
            className={`text-sm font-medium transition-colors ${
              isActive("/about") 
                ? "text-primary font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("about")}
          </Link>
          <Link
            to={getLocalizedPath("/contact")}
            className={`text-sm font-medium transition-colors ${
              isActive("/contact") 
                ? "text-primary font-semibold" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("contact")}
          </Link>
        </nav>

        {/* Right - Actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Book Button (Mobile) */}
          {user ? (
            <Link to={getLocalizedPath("/book")} className="md:hidden">
              <Button variant="accent" size="sm" className="font-bold text-xs px-3 py-2 shadow-md">
                {t("bookNow")}
              </Button>
            </Link>
          ) : (
            <Button
              variant="accent"
              size="sm"
              className="md:hidden font-bold text-xs px-3 py-2 shadow-md"
              onClick={scrollToBookingForm}
            >
              {t("bookNow")}
            </Button>
          )}
          {/* Book Button (Desktop) */}
          {user ? (
            <Link to={getLocalizedPath("/book")} className="hidden md:block">
              <Button variant="accent" size="sm" className="font-semibold">
                {t("bookNow")}
              </Button>
            </Link>
          ) : (
            <Button 
              variant="accent" 
              size="sm" 
              className="hidden md:block font-semibold"
              onClick={scrollToBookingForm}
            >
              {t("bookNow")}
            </Button>
          )}
          {/* Install App Button (Desktop) - More prominent */}
          <div className="hidden md:block">
            <InstallAppButton 
              variant="prominent" 
              size="sm"
              animated
            />
          </div>
          <div className="hidden md:block">
            <PushNotificationToggle />
          </div>
          <UniversalLanguageSelector variant="compact" />
          
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
                  {t("guestLogin") || "Guest Login"}
                </Button>
              </Link>
              <Link to="/login/agency">
                <Button variant="secondary" size="sm" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  {t("agencyLogin") || "Agency"}
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu - Dropdown - Compact */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="relative w-8 h-8 p-0">
                <span className="sr-only">Toggle menu</span>
                <span 
                  className={`absolute h-0.5 w-4 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "rotate-45" : "-translate-y-1"
                  }`}
                />
                <span 
                  className={`absolute h-0.5 w-4 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span 
                  className={`absolute h-0.5 w-4 bg-foreground transition-all duration-300 ease-in-out ${
                    menuOpen ? "-rotate-45" : "translate-y-1"
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
              <div className="p-2">
                <InstallAppButton 
                  variant="prominent" 
                  size="default"
                  fullWidth
                  animated
                />
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
                      {t("guestLogin") || "Guest Login"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/login/agency" className="w-full cursor-pointer gap-2">
                      <Building2 className="h-4 w-4" />
                      {t("agencyLogin") || "Agency"}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-2">
                    <Link to="/signup/customer" className="block">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setMenuOpen(false)}
                      >
                        {t("guestRegistration") || "Guest Registration"}
                      </Button>
                    </Link>
                    <Button 
                      variant="accent" 
                      className="w-full"
                      onClick={() => {
                        setMenuOpen(false);
                        scrollToBookingForm();
                      }}
                    >
                      {t("bookNow")}
                    </Button>
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
