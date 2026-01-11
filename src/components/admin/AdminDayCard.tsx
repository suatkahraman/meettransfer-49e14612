import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AdminDayCardProps {
  date: string;
  totalJobs: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// Get day color based on weekend/weekday
const getDayColor = (date: string) => {
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  if (isWeekend) {
    return {
      bg: 'bg-gradient-to-br from-rose-500/10 to-pink-500/15',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
    };
  }
  
  return {
    bg: 'bg-gradient-to-br from-sky-500/10 to-blue-500/15',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-500',
    border: 'border-sky-500/30',
    badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-400',
  };
};

const AdminDayCard = ({
  date,
  totalJobs,
  isExpanded,
  onToggle,
  children
}: AdminDayCardProps) => {
  const colors = getDayColor(date);
  const dateObj = new Date(date);
  const dayNumber = format(dateObj, 'd');
  const monthName = format(dateObj, 'MMM', { locale: tr });
  const dayName = format(dateObj, 'EEEE', { locale: tr });

  return (
    <div className="mb-4">
      {/* Day Header */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "w-full p-3 rounded-xl border transition-all duration-200",
          "backdrop-blur-sm shadow-sm hover:shadow-md",
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
          <span className="text-[10px] text-white/80 uppercase leading-none mt-0.5">{monthName}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">
              {dayName}
            </h3>
            <Badge className={cn("text-xs font-bold px-2 py-0.5", colors.badge)}>
              {totalJobs} Rezervasyon
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(dateObj, 'dd MMMM yyyy', { locale: tr })}
          </p>
        </div>

        {/* Toggle Icon */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          "bg-background/60"
        )}>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </motion.button>

      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 space-y-3"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDayCard;
