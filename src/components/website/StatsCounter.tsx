import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface StatItem {
  value: number;
  suffix?: string;
  prefix?: string;
  labelKey: string;
  labelFallback: string;
}

const stats: StatItem[] = [
  {
    value: 100,
    suffix: "+",
    labelKey: "statsCities",
    labelFallback: "Cities",
  },
  {
    value: 670,
    suffix: "+",
    labelKey: "statsAirports",
    labelFallback: "Airports",
  },
  {
    value: 25000,
    suffix: "+",
    labelKey: "statsTransfers",
    labelFallback: "Transfers",
  },
  {
    value: 45,
    suffix: "+",
    labelKey: "statsCountries",
    labelFallback: "Countries",
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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="text-center"
    >
      <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-2 tracking-tight">
        {stat.prefix}
        {formatNumber(count)}
        <span className="text-primary">{stat.suffix}</span>
      </div>
      <div className="text-lg text-muted-foreground font-medium">
        {t(stat.labelKey) || stat.labelFallback}
      </div>
    </motion.div>
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
    <section ref={sectionRef} className="py-20 md:py-28 bg-foreground text-background">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-background">
            {t("globalCoverage") || "Global Coverage"}
          </h2>
          <p className="text-lg text-background/70 max-w-2xl mx-auto">
            {t("statsSubtitle") || "Book your private chauffeur in seconds and enjoy a premium travel experience tailored to your schedule."}
          </p>
        </motion.div>

        {/* Stats Grid - Transfeero Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
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