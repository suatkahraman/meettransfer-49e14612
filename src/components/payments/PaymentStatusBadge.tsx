import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/config/payments";

interface PaymentStatusBadgeProps {
  status: PaymentStatus | null | undefined;
  className?: string;
}

export const PaymentStatusBadge = ({ status, className }: PaymentStatusBadgeProps) => {
  const getStatusConfig = (s: PaymentStatus | null | undefined) => {
    switch (s) {
      case 'paid':
        return {
          label: 'Paid',
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600',
        };
      case 'partial':
        return {
          label: 'Partial',
          variant: 'default' as const,
          className: 'bg-yellow-500 hover:bg-yellow-600',
        };
      case 'pay_on_transfer':
        return {
          label: 'Cash to Driver',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          variant: 'outline' as const,
          className: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
};
