import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import meetTransferLogo from "@/assets/meet-transfer-logo-small.webp";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/services", label: "Services" },
    { path: "/destinations", label: "Destinations" },
    { path: "/about", label: "About" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src={meetTransferLogo} 
              alt="Meet Transfer Logo" 
              className="h-12 w-12 rounded-full object-cover"
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Meet Transfer
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.path}
                href={link.path} 
                className="text-white/90 hover:text-white transition-colors font-sans"
              >
                {link.label}
              </a>
            ))}
            
            {user ? (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => navigate('/bookings')}
                >
                  <User className="h-4 w-4 mr-2" />
                  My Bookings
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="text-white hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => navigate('/auth')}
                className="ml-4"
              >
                Sign In
              </Button>
            )}
          </nav>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-md rounded-lg mt-2 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className="text-white/90 hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-white/10"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              
              <div className="border-t border-white/20 my-2" />
              
              {user ? (
                <>
                  <Button
                    variant="accent"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate('/bookings');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Bookings
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-white hover:bg-white/10"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={() => {
                    navigate('/auth');
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};