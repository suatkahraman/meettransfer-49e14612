import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, Clock, Car, Maximize2 } from 'lucide-react';
import { LazyDialog as Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/lazy-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface LocationPhoto {
  url: string;
  caption?: string;
  captionTR?: string;
}

interface LocationInfo {
  name: string;
  nameTR?: string;
  description?: string;
  descriptionTR?: string;
  transferTime?: string;
  distance?: string;
  photos: LocationPhoto[];
}

// Real photo URLs for destinations
const locationPhotos: Record<string, Record<string, LocationPhoto[]>> = {
  istanbul: {
    'Istanbul Airport (IST)': [
      { url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80', caption: 'Modern Terminal Building', captionTR: 'Modern Terminal Binası' },
      { url: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80', caption: 'Departure Hall', captionTR: 'Gidiş Salonu' },
    ],
    'Taksim Square': [
      { url: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80', caption: 'Taksim Square at Night', captionTR: 'Gece Taksim Meydanı' },
      { url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80', caption: 'İstiklal Avenue', captionTR: 'İstiklal Caddesi' },
      { url: 'https://images.unsplash.com/photo-1558637845-c8b7ead71a3e?w=800&q=80', caption: 'Republic Monument', captionTR: 'Cumhuriyet Anıtı' },
    ],
    'Sultanahmet': [
      { url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80', caption: 'Hagia Sophia', captionTR: 'Ayasofya' },
      { url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80', caption: 'Blue Mosque', captionTR: 'Sultanahmet Camii' },
      { url: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=80', caption: 'Historic Square', captionTR: 'Tarihi Meydan' },
    ],
    'Galataport': [
      { url: 'https://images.unsplash.com/photo-1565019011521-d5e2e99a1f17?w=800&q=80', caption: 'Waterfront View', captionTR: 'Sahil Manzarası' },
      { url: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=80', caption: 'Modern Architecture', captionTR: 'Modern Mimari' },
    ],
  },
  antalya: {
    'Lara Beach': [
      { url: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=800&q=80', caption: 'Golden Sand Beach', captionTR: 'Altın Kum Plajı' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', caption: 'Luxury Resorts', captionTR: 'Lüks Tatil Köyleri' },
      { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80', caption: 'Beach Sunset', captionTR: 'Plaj Gün Batımı' },
    ],
    'Belek Golf': [
      { url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80', caption: 'Championship Golf Course', captionTR: 'Şampiyonluk Golf Sahası' },
      { url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80', caption: 'Golf Resort', captionTR: 'Golf Tatil Köyü' },
    ],
    'Side': [
      { url: 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=800&q=80', caption: 'Ancient Ruins', captionTR: 'Antik Kalıntılar' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', caption: 'Temple of Apollo', captionTR: 'Apollo Tapınağı' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', caption: 'Beach View', captionTR: 'Plaj Manzarası' },
    ],
    'Old Town (Kaleiçi)': [
      { url: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800&q=80', caption: 'Historic Harbor', captionTR: 'Tarihi Liman' },
      { url: 'https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=800&q=80', caption: 'Ottoman Houses', captionTR: 'Osmanlı Evleri' },
    ],
  },
  bodrum: {
    'Bodrum Marina': [
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', caption: 'Marina with Castle View', captionTR: 'Kale Manzaralı Marina' },
      { url: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=800&q=80', caption: 'Luxury Yachts', captionTR: 'Lüks Yatlar' },
    ],
    'Yalıkavak (Palmarina)': [
      { url: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=800&q=80', caption: 'Superyacht Marina', captionTR: 'Süper Yat Marina' },
      { url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80', caption: 'Beach Clubs', captionTR: 'Beach Clublar' },
    ],
    'Türkbükü': [
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', caption: 'Exclusive Bay', captionTR: 'Özel Koy' },
      { url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&q=80', caption: 'Beach Club Scene', captionTR: 'Beach Club Atmosferi' },
    ],
  },
  dalaman: {
    'Ölüdeniz Blue Lagoon': [
      { url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80', caption: 'Famous Blue Lagoon', captionTR: 'Ünlü Mavi Lagün' },
      { url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80', caption: 'Paragliding Paradise', captionTR: 'Yamaç Paraşütü Cenneti' },
      { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', caption: 'Crystal Waters', captionTR: 'Berrak Sular' },
    ],
    'Fethiye': [
      { url: 'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=800&q=80', caption: 'Harbor View', captionTR: 'Liman Manzarası' },
      { url: 'https://images.unsplash.com/photo-1589561454226-796a8aa89b05?w=800&q=80', caption: 'Lycian Rock Tombs', captionTR: 'Likya Kaya Mezarları' },
    ],
    'Göcek Marina': [
      { url: 'https://images.unsplash.com/photo-1544551763-8dd44758c2dd?w=800&q=80', caption: 'Boutique Marina', captionTR: 'Butik Marina' },
      { url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', caption: 'Blue Cruise Starting Point', captionTR: 'Mavi Yolculuk Başlangıcı' },
    ],
  },
  cappadocia: {
    'Göreme': [
      { url: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80', caption: 'Hot Air Balloons', captionTR: 'Sıcak Hava Balonları' },
      { url: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80', caption: 'Fairy Chimneys', captionTR: 'Peri Bacaları' },
      { url: 'https://images.unsplash.com/photo-1565018054866-968e244671af?w=800&q=80', caption: 'Cave Hotels', captionTR: 'Mağara Otelleri' },
    ],
    'Ürgüp': [
      { url: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80', caption: 'Stone Houses', captionTR: 'Taş Evler' },
      { url: 'https://images.unsplash.com/photo-1641128324972-af3212f0f6bd?w=800&q=80', caption: 'Sunrise View', captionTR: 'Gündoğumu Manzarası' },
    ],
    'Uçhisar Castle': [
      { url: 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800&q=80', caption: 'Rock Castle', captionTR: 'Kaya Kalesi' },
      { url: 'https://images.unsplash.com/photo-1565018054866-968e244671af?w=800&q=80', caption: 'Panoramic Views', captionTR: 'Panoramik Manzaralar' },
    ],
  },
  dubai: {
    'Downtown Dubai (Burj Khalifa)': [
      { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', caption: 'Burj Khalifa at Night', captionTR: 'Gece Burj Khalifa' },
      { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80', caption: 'Dubai Fountain', captionTR: 'Dubai Çeşmesi' },
      { url: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80', caption: 'City Skyline', captionTR: 'Şehir Silüeti' },
    ],
    'Palm Jumeirah': [
      { url: 'https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=800&q=80', caption: 'Atlantis Resort', captionTR: 'Atlantis Tatil Köyü' },
      { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80', caption: 'Palm Island View', captionTR: 'Palmiye Adası Manzarası' },
    ],
    'Dubai Marina': [
      { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80', caption: 'Marina Skyline', captionTR: 'Marina Silüeti' },
      { url: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=800&q=80', caption: 'Waterfront Dining', captionTR: 'Sahil Restoranları' },
    ],
  },
};

interface LocationPhotoGalleryProps {
  city: string;
  locationName: string;
  location: LocationInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const LocationPhotoGallery = ({
  city,
  locationName,
  location,
  isOpen,
  onClose
}: LocationPhotoGalleryProps) => {
  const { language } = useLanguage();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const cityPhotos = locationPhotos[city.toLowerCase()] || {};
  const photos = cityPhotos[locationName] || [
    // Default photos if none found
    { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80', caption: 'Location View', captionTR: 'Lokasyon Görünümü' }
  ];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const displayName = language === 'TR' && location.nameTR ? location.nameTR : location.name;
  const displayDescription = language === 'TR' && location.descriptionTR ? location.descriptionTR : location.description;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="relative">
          {/* Photo Gallery */}
          <div className="relative aspect-video bg-black">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentPhotoIndex}
                src={photos[currentPhotoIndex].url}
                alt={displayName}
                className="w-full h-full object-cover"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* Photo Counter & Caption */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm font-medium">
                {language === 'TR' ? photos[currentPhotoIndex].captionTR : photos[currentPhotoIndex].caption}
              </p>
              {photos.length > 1 && (
                <p className="text-white/70 text-xs mt-1">
                  {currentPhotoIndex + 1} / {photos.length}
                </p>
              )}
            </div>
            
            {/* Photo Dots */}
            {photos.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      idx === currentPhotoIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Location Info */}
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-primary" />
                {displayName}
              </DialogTitle>
            </DialogHeader>
            
            <p className="text-muted-foreground mt-3 leading-relaxed">
              {displayDescription}
            </p>
            
            {/* Transfer Info */}
            {(location.transferTime || location.distance) && (
              <div className="flex gap-4 mt-4 pt-4 border-t">
                {location.transferTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-medium">{location.transferTime}</span>
                    <span className="text-muted-foreground">
                      {language === 'TR' ? 'havalimanından' : 'from airport'}
                    </span>
                  </div>
                )}
                {location.distance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-primary" />
                    <span className="font-medium">{location.distance}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Thumbnail Gallery */}
            {photos.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={cn(
                      "flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all",
                      idx === currentPhotoIndex 
                        ? "border-primary ring-2 ring-primary/20" 
                        : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img
                      src={photo.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPhotoGallery;
