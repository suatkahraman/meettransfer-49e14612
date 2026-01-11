import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface AdminMonthCardProps {
  monthKey: string; // "2026-01"
  totalJobs: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AdminMonthCard = ({
  monthKey,
  totalJobs,
  isExpanded,
  onToggle,
  children
}: AdminMonthCardProps) => {
  const [year, month] = monthKey.split('-');
  const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
  const monthName = format(dateObj, 'MMMM', { locale: tr });

  return (
    <div className="mb-6">
      {/* Month Header */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.005 }}
        whileTap={{ scale: 0.995 }}
        className={cn(
          "w-full p-4 rounded-xl border transition-all duration-200",
          "backdrop-blur-sm shadow-md hover:shadow-lg",
          "flex items-center gap-4 text-left",
          "bg-gradient-to-br from-primary/10 to-primary/20",
          "border-primary/30"
        )}
      >
        {/* Month Icon */}
        <div className={cn(
          "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0",
          "shadow-lg bg-gradient-to-br from-primary to-primary/80"
        )}>
          <CalendarDays className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg text-foreground capitalize">
              {monthName} {year}
            </h2>
            <Badge className="text-sm font-bold px-3 py-1 bg-primary/20 text-primary">
              {totalJobs} Rezervasyon
            </Badge>
          </div>
        </div>

        {/* Toggle Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
          "bg-background/60"
        )}>
          {isExpanded ? (
            <ChevronUp className="h-6 w-6 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-6 w-6 text-muted-foreground" />
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
          className="mt-3 pl-4"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

export default AdminMonthCard;
