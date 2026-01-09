import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface JobCategoryCardProps {
  icon: LucideIcon;
  title: string;
  count: number;
  subtitle?: string;
  colorClass: 'orange' | 'blue' | 'green';
  onClick: () => void;
  nextJob?: {
    time: string;
    route: string;
  };
}

const colorMap = {
  orange: {
    bg: 'bg-gradient-to-br from-amber-500/10 to-orange-500/20',
    iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
    accent: 'text-amber-600 dark:text-amber-400'
  },
  blue: {
    bg: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/20',
    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    border: 'border-blue-500/30',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
    accent: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-gradient-to-br from-emerald-500/10 to-green-500/20',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-green-500',
    border: 'border-green-500/30',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
    accent: 'text-emerald-600 dark:text-emerald-400'
  }
};

const JobCategoryCard = ({
  icon: Icon,
  title,
  count,
  subtitle,
  colorClass,
  onClick,
  nextJob
}: JobCategoryCardProps) => {
  const colors = colorMap[colorClass];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-4 rounded-2xl border transition-all duration-200",
        "backdrop-blur-sm shadow-lg hover:shadow-xl",
        "flex items-center gap-4 text-left",
        colors.bg,
        colors.border
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
        "shadow-lg",
        colors.iconBg
      )}>
        <Icon className="h-7 w-7 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground">{title}</h3>
          <Badge className={cn("text-xs font-bold px-2 py-0.5", colors.badge)}>
            {count}
          </Badge>
        </div>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}

        {nextJob && count > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("text-sm font-medium", colors.accent)}>
              {nextJob.time}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {nextJob.route}
            </span>
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        "bg-background/50"
      )}>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </motion.button>
  );
};

export default JobCategoryCard;
