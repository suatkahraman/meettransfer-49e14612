import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Wallet, Banknote } from "lucide-react";
import type { PaymentStatus } from "@/config/payments";

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string | null | undefined;
  className?: string;
  size?: 'sm' | 'default';
}

export const PaymentStatusBadge = ({ status, className, size = 'default' }: PaymentStatusBadgeProps) => {
  const getStatusConfig = (s: PaymentStatus | string | null | undefined) => {
    switch (s) {
      case 'paid':
        return {
          label: 'Ödendi',
          icon: CheckCircle2,
          className: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'partial':
        return {
          label: 'Kısmi',
          icon: Wallet,
          className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        };
      case 'pay_on_transfer':
        return {
          label: 'Nakit',
          icon: Banknote,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'pending':
      default:
        return {
          label: 'Bekliyor',
          icon: Clock3,
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const isSmall = size === 'sm';

  return (
    <Badge 
      variant="outline" 
      className={cn(
        config.className, 
        isSmall ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5',
        className
      )}
    >
      <Icon className={cn("mr-0.5", isSmall ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {config.label}
    </Badge>
  );
};
