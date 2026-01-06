import { AlertTriangle, Plane, Users, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Reservation {
  flight_number: string | null;
  passenger_names: string[] | null;
  vehicle_type: string;
}

interface MissingInfoAlertsProps {
  reservation: Reservation;
  onEdit: () => void;
}

// Get expected passenger count based on vehicle type
const getExpectedPassengers = (vehicleType: string): number => {
  switch (vehicleType) {
    case 'mercedes-vito':
      return 6;
    case 'vip-mercedes':
    case 'mercedes-vclass': // Legacy
      return 5;
    case 'maybach-minibus':
    case 'maybach': // Legacy
      return 4;
    case 'minibus':
      return 12;
    default:
      return 4;
  }
};

const MissingInfoAlerts = ({ reservation, onEdit }: MissingInfoAlertsProps) => {
  const { t } = useLanguage();
  
  const missingFields: { icon: React.ReactNode; message: string; color: string }[] = [];
  
  // Check for missing flight number
  if (!reservation.flight_number) {
    missingFields.push({
      icon: <Plane className="h-4 w-4" />,
      message: t('missingFlightNumber') || 'Please enter your flight number',
      color: 'from-blue-500 to-cyan-500'
    });
  }
  
  // Check for missing passenger names
  const expectedPassengers = getExpectedPassengers(reservation.vehicle_type);
  const currentPassengers = reservation.passenger_names?.length || 0;
  
  if (currentPassengers < 2) {
    missingFields.push({
      icon: <Users className="h-4 w-4" />,
      message: t('missingPassengerNames') || 'Please enter passenger names',
      color: 'from-purple-500 to-pink-500'
    });
  }
  
  if (missingFields.length === 0) return null;
  
  return (
    <div className="space-y-3 py-4 border-t">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <AlertTriangle className="h-4 w-4 animate-pulse text-amber-500" />
        <span>{t('missingInfoTitle') || 'Missing Information'}</span>
      </div>
      
      <div className="space-y-2">
        {missingFields.map((field, index) => (
          <div
            key={index}
            className={cn(
              "relative overflow-hidden rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.02]",
              "bg-gradient-to-r",
              field.color
            )}
            onClick={onEdit}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                  {field.icon}
                </div>
                <span className="font-medium text-sm">{field.message}</span>
              </div>
              <Edit className="h-4 w-4 text-white/80" />
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={onEdit}
        variant="outline"
        className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
      >
        <Edit className="h-4 w-4 mr-2" />
        {t('updateReservation') || 'Update Reservation'}
      </Button>
    </div>
  );
};

export default MissingInfoAlerts;
