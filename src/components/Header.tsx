import { Button } from "@/components/ui/button";
import { Menu, Phone, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import meetTransferLogo from "@/assets/meet-transfer-logo.jpg";

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
            <a href="#services" className="text-white/90 hover:text-white transition-colors font-sans">
              Services
            </a>
            <a href="#destinations" className="text-white/90 hover:text-white transition-colors font-sans">
              Destinations
            </a>
            <a href="#about" className="text-white/90 hover:text-white transition-colors font-sans">
              About
            </a>
            
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

          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};