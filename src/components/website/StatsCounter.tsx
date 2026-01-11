import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Car, Globe, Award, ThumbsUp, Clock } from "lucide-react";

interface StatItem {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  labelKey: string;
  labelFallback: string;
}

const stats: StatItem[] = [
  {
    icon: <Car className="h-8 w-8" />,
    value: 25000,
    suffix: "+",
    labelKey: "statsTransfers",
    labelFallback: "Transfers Completed",
  },
  {
    icon: <Users className="h-8 w-8" />,
    value: 18500,
    suffix: "+",
    labelKey: "statsCustomers",
    labelFallback: "Happy Customers",
  },
  {
    icon: <ThumbsUp className="h-8 w-8" />,
    value: 99,
    suffix: "%",
    labelKey: "statsSatisfaction",
    labelFallback: "Satisfaction Rate",
  },
  {
    icon: <Globe className="h-8 w-8" />,
    value: 45,
    suffix: "+",
    labelKey: "statsCountries",
    labelFallback: "Countries Served",
  },
  {
    icon: <Clock className="h-8 w-8" />,
    value: 24,
    suffix: "/7",
    labelKey: "statsAvailability",
    labelFallback: "Availability",
  },
  {
    icon: <Award className="h-8 w-8" />,
    value: 5,
    suffix: "+",
    labelKey: "statsYears",
    labelFallback: "Years Experience",
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
      
      // Easing function for smooth animation
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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <div 
      className="text-center p-6 group"
      style={{ 
        animationDelay: `${index * 100}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms`
      }}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
        {stat.icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
        {formatNumber(count)}
        <span className="text-primary">{stat.suffix}</span>
      </div>
      <p className="text-muted-foreground font-medium">
        {t(stat.labelKey) || stat.labelFallback}
      </p>
    </div>
  );
};

const StatsCounter = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    <section ref={sectionRef} className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("statsTitle") || "Trusted by Thousands"}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("statsSubtitle") || "Our numbers speak for themselves. Join thousands of satisfied travelers who trust us for their transfers."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
          {stats.map((stat, index) => (
            <StatCard 
              key={index} 
              stat={stat} 
              index={index} 
              isVisible={isVisible} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsCounter;
