import { Phone, Mail, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-primary text-white py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Elite Transfer</h3>
            <p className="text-white/80 font-sans text-sm leading-relaxed">
              Premium airport transfer and chauffeur service providing luxury transportation across Turkey.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-white/80 font-sans text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Destinations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Services</h4>
            <ul className="space-y-2 text-white/80 font-sans text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Airport Transfer</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hourly Rental</a></li>
              <li><a href="#" className="hover:text-white transition-colors">City Tours</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Corporate Service</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact</h4>
            <ul className="space-y-3 text-white/80 font-sans text-sm">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>+90 532 XXX XX XX</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>info@elitetransfer.com</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Istanbul, Turkey</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-white/60 font-sans text-sm">
          <p>© 2024 Elite Transfer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};