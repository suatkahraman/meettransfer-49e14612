import { motion } from 'framer-motion';
import { Calendar, ChevronRight, Car } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DayJobCardProps {
  dayNumber: number;
  monthName: string;
  dayName: string;
  totalJobs: number;
  activeJobs: number;
  onClick: () => void;
  firstJobTime?: string;
  firstJobRoute?: string;
}

// Weekday abbreviation styles
const getDayColor = (dayName: string) => {
  // Weekend colors
  const weekendDays = ['Pazar', 'Sunday', 'Sonntag', 'Dimanche', 'Воскресенье', 'الأحد', 
                       'Cumartesi', 'Saturday', 'Samstag', 'Samedi', 'Суббота', 'السبت'];
  if (weekendDays.some(d => dayName.includes(d))) {
    return {
      bg: 'bg-gradient-to-br from-rose-500/10 to-pink-500/20',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
      accent: 'text-rose-600 dark:text-rose-400'
    };
  }
  
  // Weekday colors
  return {
    bg: 'bg-gradient-to-br from-sky-500/10 to-blue-500/20',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
    accent: 'text-sky-600 dark:text-sky-400'
  };
};

const DayJobCard = ({
  dayNumber,
  monthName,
  dayName,
  totalJobs,
  activeJobs,
  onClick,
  firstJobTime,
  firstJobRoute
}: DayJobCardProps) => {
  const colors = getDayColor(dayName);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-3 rounded-xl border transition-all duration-200",
        "backdrop-blur-sm shadow-md hover:shadow-lg",
        "flex items-center gap-3 text-left",
        colors.bg,
        colors.border
      )}
    >
      {/* Date Circle */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
        "shadow-md",
        colors.iconBg
      )}>
        <span className="text-lg font-bold text-white leading-none">{dayNumber}</span>
        <span className="text-[10px] text-white/80 uppercase leading-none mt-0.5">{monthName.slice(0, 3)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground text-sm">
            {dayName}
          </h3>
          <Badge className={cn("text-xs font-bold px-2 py-0.5", colors.badge)}>
            {totalJobs} Transfer
          </Badge>
          {activeJobs > 0 && (
            <Badge className="text-xs font-bold px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400">
              <Car className="h-3 w-3 mr-1" />
              {activeJobs}
            </Badge>
          )}
        </div>
        
        {firstJobTime && firstJobRoute && (
          <p className="text-xs text-muted-foreground truncate">
            <span className={cn("font-medium", colors.accent)}>{firstJobTime}</span>
            <span className="mx-1">•</span>
            {firstJobRoute}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
        "bg-background/50"
      )}>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </motion.button>
  );
};

export default DayJobCard;
