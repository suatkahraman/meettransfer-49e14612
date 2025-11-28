import { Button } from "@/components/ui/button";
import { Menu, Phone } from "lucide-react";

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Elite Transfer
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
            <Button variant="accent" size="sm" className="ml-4">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </Button>
          </nav>

          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
};