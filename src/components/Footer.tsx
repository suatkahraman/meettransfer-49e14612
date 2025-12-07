import { Mail, MapPin } from "lucide-react";
export const Footer = () => {
  return <footer className="bg-primary text-white py-12 px-4">
      <div className="container max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Meet Transfer</h3>
            <p className="text-white/80 font-sans text-sm leading-relaxed">🌍 Destinations
Meet Transfer provides premium VIP transfer services from all major international airports and top holiday destinations across Turkey.

✈ Istanbul Airport (IST & SAW) – VIP Airport Transfer
Exclusive private transfers to Taksim, Sultanahmet, Galataport Cruise Port, Beşiktaş, Levent, and all hotels on the European & Asian side
Mercedes Vito, V-Class, Sprinter VIP

🏖 Antalya Airport (AYT) – Resort Transfers
Luxury transfers to Lara, Kundu, Belek, Side, Alanya, Kemer, Manavgat
Perfect for hotel groups, golfers & family travel

⚓ Bodrum Airport (BJV) – Luxury Transfers
VIP service to Yalıkavak, Türkbükü, Torba, Gündoğan, Turgutreis, Bodrum Center

🌊 Dalaman Airport (DLM) – Private Chauffeur Service
Private transfers to Fethiye, Ölüdeniz, Göcek Marina, Marmaris, Datça, Kaş, Kalkan
Premium fleet & yacht/marina transfer options available

🏙 Izmir Airport (ADB) – Business & Hotel Transfers
Exclusive transfers to Kuşadası, Alaçatı, Çeşme, Selçuk, Şirince & Izmir hotels

🏜 Cappadocia (NAV & ASR) – VIP Airport Shuttle
Luxury transfers to Göreme, Uçhisar, Avanos, Ürgüp & cave & balloon hotels
Special hot air balloon tour packages available

🚘 Our Premium Fleet

Mercedes V-Class VIP

Mercedes Vito Luxury

Mercedes Sprinter VIP

Minibus 12–16 seats

Luxury Executive Limousine

⭐ All Vehicles Include

Leather seats

Large luggage capacity

A/C & high-speed Wi-Fi

USB & mobile charging ports

Privacy glass & extra comfort</p>
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
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="whitespace-pre-line text-xs leading-relaxed">
                  🌍 Meet Transfer – Global Office Locations{"\n"}
                  🇹🇷 Türkiye – İstanbul Headquarters{"\n"}
                  📍 Istanbul Airport (IST) – VIP Meet & Greet Terminal Office{"\n"}
                  📞 +90 532 174 8390{"\n"}
                  ✉ info@meettransfer.com{"\n\n"}
                  🇺🇸 USA Office – Los Angeles{"\n"}
                  📍 La Fashion District, Los Angeles, CA 854{"\n"}
                  📞 +1 205 650 8400{"\n\n"}
                  🇩🇪 Germany Office – Berlin{"\n"}
                  📍 Street Business Center, Berlin 245{"\n"}
                  📞 +1 205 650 8400{"\n\n"}
                  🇦🇪 UAE Office – Dubai{"\n"}
                  📍 Downtown Business Tower, Dubai 35{"\n"}
                  📞 +1 205 650 8400
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="whitespace-pre-line text-xs leading-relaxed">
                  🌍 Meet Transfer – Global Office Locations{"\n"}
                  🇹🇷 Türkiye – İstanbul Headquarters{"\n"}
                  📍 Istanbul Airport (IST) – VIP Meet & Greet Terminal Office{"\n"}
                  📞 +90 532 174 8390{"\n"}
                  ✉ info@meettransfer.com{"\n\n"}
                  🇺🇸 USA Office – Los Angeles{"\n"}
                  📍 La Fashion District, Los Angeles, CA 854{"\n"}
                  📞 +1 205 650 8400{"\n\n"}
                  🇩🇪 Germany Office – Berlin{"\n"}
                  📍 Street Business Center, Berlin 245{"\n"}
                  📞 +1 205 650 8400{"\n\n"}
                  🇦🇪 UAE Office – Dubai{"\n"}
                  📍 Downtown Business Tower, Dubai 35{"\n"}
                  📞 +1 205 650 8400
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 text-center text-white/60 font-sans text-sm">
          <p>© 2024 Meet Transfer. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};