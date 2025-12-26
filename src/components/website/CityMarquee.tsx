import { useLanguage } from "@/contexts/LanguageContext";

const cities = [
  "Istanbul",
  "Antalya", 
  "Bodrum",
  "Dalaman",
  "Izmir",
  "Cappadocia",
  "Dubai",
  "Cyprus",
  "Fethiye",
  "Marmaris",
  "Alanya",
  "Burj Khalifa",
  "Palm Jumeirah",
  "Larnaca",
  "Paphos",
  "Kyrenia",
];

const CityMarquee = () => {
  const { t } = useLanguage();
  
  return (
    <div className="w-full overflow-hidden py-4">
      <div className="relative flex">
        {/* First scroll group */}
        <div className="animate-marquee flex shrink-0 items-center gap-8 md:gap-12">
          {cities.map((city, index) => (
            <span
              key={`first-${index}`}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white/90 whitespace-nowrap px-4"
            >
              {city}
            </span>
          ))}
        </div>
        
        {/* Duplicate for seamless loop */}
        <div className="animate-marquee flex shrink-0 items-center gap-8 md:gap-12" aria-hidden="true">
          {cities.map((city, index) => (
            <span
              key={`second-${index}`}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white/90 whitespace-nowrap px-4"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CityMarquee;
