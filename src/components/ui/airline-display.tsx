import { useState, useEffect } from 'react';
import { Plane } from 'lucide-react';
import { cn } from '@/lib/utils';

// Common airline IATA codes to names mapping
const AIRLINE_NAMES: Record<string, string> = {
  'TK': 'Turkish Airlines',
  'LH': 'Lufthansa',
  'BA': 'British Airways',
  'AF': 'Air France',
  'KL': 'KLM',
  'EK': 'Emirates',
  'QR': 'Qatar Airways',
  'EY': 'Etihad Airways',
  'SQ': 'Singapore Airlines',
  'CX': 'Cathay Pacific',
  'NH': 'ANA',
  'JL': 'Japan Airlines',
  'AA': 'American Airlines',
  'UA': 'United Airlines',
  'DL': 'Delta Air Lines',
  'SW': 'Southwest Airlines',
  'WN': 'Southwest Airlines',
  'B6': 'JetBlue',
  'AS': 'Alaska Airlines',
  'AC': 'Air Canada',
  'LX': 'Swiss',
  'OS': 'Austrian Airlines',
  'SK': 'SAS',
  'AY': 'Finnair',
  'IB': 'Iberia',
  'VY': 'Vueling',
  'FR': 'Ryanair',
  'U2': 'easyJet',
  'W6': 'Wizz Air',
  'PC': 'Pegasus Airlines',
  'XQ': 'SunExpress',
  'TM': 'MIAT Mongolian Airlines',
  'SU': 'Aeroflot',
  'S7': 'S7 Airlines',
  'EI': 'Aer Lingus',
  'AZ': 'ITA Airways',
  'TP': 'TAP Portugal',
  'RO': 'TAROM',
  'OK': 'Czech Airlines',
  'LO': 'LOT Polish Airlines',
  'BT': 'airBaltic',
  'PS': 'Ukraine International Airlines',
  'MS': 'EgyptAir',
  'ET': 'Ethiopian Airlines',
  'SA': 'South African Airways',
  'KE': 'Korean Air',
  'OZ': 'Asiana Airlines',
  'CI': 'China Airlines',
  'BR': 'EVA Air',
  'MH': 'Malaysia Airlines',
  'TG': 'Thai Airways',
  'VN': 'Vietnam Airlines',
  'GA': 'Garuda Indonesia',
  'AI': 'Air India',
  'QF': 'Qantas',
  'NZ': 'Air New Zealand',
  'LA': 'LATAM Airlines',
  'AV': 'Avianca',
  'CM': 'Copa Airlines',
  'AM': 'Aeroméxico',
  'JJ': 'LATAM Brasil',
  'G3': 'GOL',
  'AD': 'Azul',
  'CA': 'Air China',
  'MU': 'China Eastern',
  'CZ': 'China Southern',
  'HU': 'Hainan Airlines',
  '3U': 'Sichuan Airlines',
  'FM': 'Shanghai Airlines',
  'ZH': 'Shenzhen Airlines',
  'FZ': 'flydubai',
  'GF': 'Gulf Air',
  'WY': 'Oman Air',
  'SV': 'Saudia',
  'ME': 'Middle East Airlines',
  'RJ': 'Royal Jordanian',
  'J9': 'Jazeera Airways',
  'KU': 'Kuwait Airways',
  'XY': 'flynas',
  '6E': 'IndiGo',
  'SG': 'SpiceJet',
  'G8': 'Go First',
  'UK': 'Vistara',
  'I5': 'AirAsia India',
  'AK': 'AirAsia',
  'FD': 'Thai AirAsia',
  'QZ': 'Indonesia AirAsia',
  'D7': 'AirAsia X',
  'TR': 'Scoot',
  '5J': 'Cebu Pacific',
  'PR': 'Philippine Airlines',
  'Z2': 'AirAsia Philippines',
  'VJ': 'VietJet Air',
  'BL': 'Pacific Airlines',
  'DD': 'Nok Air',
  'WE': 'Thai Smile',
  'PG': 'Bangkok Airways',
  'UL': 'SriLankan Airlines',
  'UB': 'Myanmar National Airlines',
  'BI': 'Royal Brunei Airlines',
  'MJ': 'Myway Airlines',
  'KC': 'Air Astana',
  'HY': 'Uzbekistan Airways',
  'J2': 'Azerbaijan Airlines',
  'A9': 'Georgian Airways',
  'Y4': 'Volaris',
  'VB': 'VivaAerobus',
  'NK': 'Spirit Airlines',
  'F9': 'Frontier Airlines',
  'G4': 'Allegiant Air',
  'WS': 'WestJet',
  'TS': 'Air Transat',
  'PD': 'Porter Airlines',
  'VS': 'Virgin Atlantic',
  'DY': 'Norwegian',
  'DX': 'DAT',
  'EW': 'Eurowings',
  'DE': 'Condor',
  'X3': 'TUI fly Deutschland',
  'OR': 'TUI fly Netherlands',
  'BY': 'TUI Airways',
  'MT': 'Thomas Cook Airlines',
  'LS': 'Jet2',
  'ZB': 'Air Albania',
  '8Q': 'Onur Air',
  'AJ': 'AnadoluJet',
  'KK': 'AtlasGlobal',
};

// Extract IATA code from flight number
const extractIataCode = (flightNumber: string): string | null => {
  if (!flightNumber) return null;
  
  const cleaned = flightNumber.trim().toUpperCase();
  
  // Match patterns like "TK1234", "TK 1234", "LH1301"
  // IATA codes are 2-3 characters (letters or alphanumeric)
  const match = cleaned.match(/^([A-Z]{2}|[A-Z]\d|\d[A-Z])/);
  
  if (match) {
    return match[1];
  }
  
  return null;
};

// Get airline name from IATA code
const getAirlineName = (iataCode: string): string | null => {
  return AIRLINE_NAMES[iataCode] || null;
};

// CDN URL for airline logos
const getLogoUrl = (iataCode: string): string => {
  // Using pics.avs.io CDN which has most airline logos
  return `https://pics.avs.io/80/80/${iataCode}.png`;
};

interface AirlineDisplayProps {
  flightNumber: string | null | undefined;
  className?: string;
  showFlightNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AirlineDisplay = ({ 
  flightNumber, 
  className,
  showFlightNumber = true,
  size = 'md'
}: AirlineDisplayProps) => {
  const [logoError, setLogoError] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  const iataCode = flightNumber ? extractIataCode(flightNumber) : null;
  const airlineName = iataCode ? getAirlineName(iataCode) : null;
  const logoUrl = iataCode ? getLogoUrl(iataCode) : null;

  // Reset states when flight number changes
  useEffect(() => {
    setLogoError(false);
    setLogoLoaded(false);
  }, [flightNumber]);

  if (!flightNumber || !flightNumber.trim()) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo */}
      {logoUrl && !logoError ? (
        <div className={cn("relative flex-shrink-0 rounded-md overflow-hidden bg-muted", sizeClasses[size])}>
          {!logoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Plane className="h-4 w-4 text-muted-foreground animate-pulse" />
            </div>
          )}
          <img
            src={logoUrl}
            alt={airlineName || iataCode || 'Airline'}
            className={cn(
              "w-full h-full object-contain transition-opacity",
              logoLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setLogoLoaded(true)}
            onError={() => setLogoError(true)}
          />
        </div>
      ) : (
        <div className={cn(
          "flex-shrink-0 rounded-md bg-muted flex items-center justify-center",
          sizeClasses[size]
        )}>
          <Plane className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Airline info */}
      <div className="flex flex-col min-w-0">
        {airlineName && (
          <span className={cn("font-medium text-foreground truncate", textClasses[size])}>
            {airlineName}
          </span>
        )}
        {showFlightNumber && (
          <span className={cn(
            "text-muted-foreground uppercase",
            airlineName ? "text-xs" : textClasses[size]
          )}>
            {flightNumber.trim().toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
};

export { extractIataCode, getAirlineName, AIRLINE_NAMES };
