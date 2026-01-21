import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock3, Wallet, Banknote } from "lucide-react";
import type { PaymentStatus } from "@/config/payments";

interface PaymentStatusBadgeProps {
  status: PaymentStatus | string | null | undefined;
  className?: string;
  size?: 'sm' | 'default';
  translations?: {
    paid?: string;
    partial?: string;
    payOnTransfer?: string;
    pending?: string;
  };
}

const DEFAULT_LABELS = {
  paid: 'Ödendi',
  partial: 'Kısmi',
  payOnTransfer: 'Nakit',
  pending: 'Bekliyor',
} as const;

const STATUS_STYLES = {
  paid: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  partial: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800',
  pay_on_transfer: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
} as const;

const STATUS_ICONS = {
  paid: CheckCircle2,
  partial: Wallet,
  pay_on_transfer: Banknote,
  pending: Clock3,
} as const;

export const PaymentStatusBadge = memo(({ 
  status, 
  className, 
  size = 'default',
  translations = {},
}: PaymentStatusBadgeProps) => {
  const labels = useMemo(() => ({
    ...DEFAULT_LABELS,
    ...translations,
  }), [translations]);

  const config = useMemo(() => {
    switch (status) {
      case 'paid':
        return {
          label: labels.paid,
          icon: STATUS_ICONS.paid,
          className: STATUS_STYLES.paid,
        };
      case 'partial':
        return {
          label: labels.partial,
          icon: STATUS_ICONS.partial,
          className: STATUS_STYLES.partial,
        };
      case 'pay_on_transfer':
        return {
          label: labels.payOnTransfer,
          icon: STATUS_ICONS.pay_on_transfer,
          className: STATUS_STYLES.pay_on_transfer,
        };
      case 'pending':
      default:
        return {
          label: labels.pending,
          icon: STATUS_ICONS.pending,
          className: STATUS_STYLES.pending,
        };
    }
  }, [status, labels]);

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
      <Icon className={cn("mr-0.5 shrink-0", isSmall ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {config.label}
    </Badge>
  );
});

PaymentStatusBadge.displayName = 'PaymentStatusBadge';
