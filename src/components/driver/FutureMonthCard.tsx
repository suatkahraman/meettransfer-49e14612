import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface FutureMonthCardProps {
  monthName: string;
  year: number;
  count: number;
  onClick: () => void;
  firstJobDate?: string;
  firstJobRoute?: string;
}

const FutureMonthCard = ({
  monthName,
  year,
  count,
  onClick,
  firstJobDate,
  firstJobRoute
}: FutureMonthCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full p-3 rounded-xl border transition-all duration-200",
        "backdrop-blur-sm shadow-md hover:shadow-lg",
        "flex items-center gap-3 text-left",
        "bg-gradient-to-br from-purple-500/10 to-violet-500/20",
        "border-purple-500/30"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0",
        "shadow-md",
        "bg-gradient-to-br from-purple-500 to-violet-500"
      )}>
        <Calendar className="h-5 w-5 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-foreground text-sm">
            {monthName} {year}
          </h3>
          <Badge className="text-xs font-bold px-2 py-0.5 bg-purple-500/20 text-purple-700 dark:text-purple-400">
            {count}
          </Badge>
        </div>
        
        {firstJobDate && firstJobRoute && (
          <p className="text-xs text-muted-foreground truncate">
            {firstJobDate} • {firstJobRoute}
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

export default FutureMonthCard;
