import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Plane, Car, MapPin, Award, Shield } from "lucide-react";
import { useGoogleReviewStats } from "@/hooks/useGoogleReviewStats";

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  labelKey: string;
  labelFallback: string;
  icon: React.ElementType;
}

const stats: StatItem[] = [
  {
    value: 32,
    labelKey: "statsCities",
    labelFallback: "Cities",
    icon: MapPin,
  },
  {
    value: 12,
    labelKey: "statsAirports",
    labelFallback: "Airports",
    icon: Plane,
  },
  {
    value: 13454,
    labelKey: "statsTransfers",
    labelFallback: "Transfers",
    icon: Car,
  },
  {
    value: 5,
    labelKey: "statsCountries",
    labelFallback: "Countries",
    icon: Globe,
  },
];

const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!startCounting) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * end);

      if (currentCount !== countRef.current) {
        countRef.current = currentCount;
        setCount(currentCount);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      startTimeRef.current = null;
    };
  }, [end, duration, startCounting]);

  return count;
};

const StatCard = ({ stat, index, isVisible }: { stat: StatItem; index: number; isVisible: boolean }) => {
  const { t } = useLanguage();
  const count = useCountUp(stat.value, 2000 + index * 200, isVisible);
  const Icon = stat.icon;

  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return new Intl.NumberFormat("de-DE").format(num);
    }
    return num.toString();
  };

  return (
    <div 
      className="relative group animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:bg-white/10 transition-all duration-300 hover:border-white/20">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        {/* Number */}
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 tracking-tight">
          {stat.prefix}
          {formatNumber(count)}
          <span className="text-primary">{stat.suffix}</span>
        </div>
        
        {/* Label */}
        <div className="text-lg text-white/70 font-medium">
          {safeT(stat.labelKey, stat.labelFallback)}
        </div>
      </div>
    </div>
  );
};

const StatsCounter = () => {
  const { t, language } = useLanguage();
  const { rating } = useGoogleReviewStats();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const isTR = language.toLowerCase() === "tr";

  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className={`text-center mb-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-4 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`}
            style={{ animationDelay: '100ms' }}
          >
            <Globe className="h-4 w-4 text-primary" />
            {isTR ? "Dünya Genelinde" : "Worldwide Service"}
          </div>
          
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white tracking-tight">
            {safeT("globalCoverage", "Global Coverage")}
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            {safeT(
              "statsSubtitle",
              "Premium transfers across multiple countries with professional service",
            )}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatCard 
              key={index} 
              stat={stat} 
              index={index} 
              isVisible={isVisible} 
            />
          ))}
        </div>

        {/* Trust Badges */}
        <div
          className={`flex flex-wrap justify-center gap-6 mt-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-center gap-2 text-white/60">
            <Award className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isTR ? `${rating.toFixed(1)} Yıldız Puan` : `${rating.toFixed(1)} Star Rating`}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isTR ? "Sigortalı Transferler" : "Insured Transfers"}</span>
          </div>
          <div className="flex items-center gap-2 text-white/60">
            <Car className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{isTR ? "Premium Araçlar" : "Premium Vehicles"}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;