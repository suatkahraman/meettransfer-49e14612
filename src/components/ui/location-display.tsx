import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationDisplayProps {
  placeName?: string | null;
  address: string;
  type?: 'pickup' | 'dropoff';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showAddress?: boolean;
  className?: string;
}

/**
 * Displays a location with place name only.
 * If no placeName is provided, shows the address as fallback.
 * Set showAddress=true to display address below place name.
 */
export const LocationDisplay = ({
  placeName,
  address,
  type = 'pickup',
  size = 'md',
  showIcon = true,
  showAddress = false,
  className,
}: LocationDisplayProps) => {
  const dotColor = type === 'pickup' ? 'bg-green-500/20' : 'bg-red-500/20';
  const dotIconColor = type === 'pickup' ? 'text-green-600' : 'text-red-500';

  const sizeClasses = {
    sm: {
      container: 'gap-2',
      dot: 'w-5 h-5',
      dotIcon: 'h-3 w-3',
      placeName: 'text-sm font-semibold',
      address: 'text-xs',
    },
    md: {
      container: 'gap-3',
      dot: 'w-6 h-6',
      dotIcon: 'h-3.5 w-3.5',
      placeName: 'text-base font-semibold',
      address: 'text-sm',
    },
    lg: {
      container: 'gap-3',
      dot: 'w-7 h-7',
      dotIcon: 'h-4 w-4',
      placeName: 'text-lg font-bold',
      address: 'text-sm',
    },
  };

  const sizes = sizeClasses[size];

  // Use placeName if available, otherwise fallback to address
  const displayName = placeName && placeName.trim() !== '' ? placeName : address;
  
  // Check if we should show address (only if different from placeName)
  const shouldShowAddress = showAddress && 
    placeName && 
    placeName.trim() !== '' && 
    !address.toLowerCase().startsWith(placeName.toLowerCase());

  return (
    <div className={cn('flex items-start', sizes.container, className)}>
      {showIcon && (
        <div className={cn('rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', dotColor, sizes.dot)}>
          <MapPin className={cn(dotIconColor, sizes.dotIcon)} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className={cn('leading-tight', sizes.placeName)}>{displayName}</div>
        {shouldShowAddress && (
          <div className={cn('text-muted-foreground leading-tight mt-0.5', sizes.address)}>{address}</div>
        )}
      </div>
    </div>
  );
};

export default LocationDisplay;
