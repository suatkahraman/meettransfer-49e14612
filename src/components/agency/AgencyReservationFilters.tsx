import { useState } from 'react';
import { useAgencyTranslations } from '@/hooks/useAgencyTranslations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  User,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export interface ReservationFilters {
  searchQuery: string;
  status: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  customerName: string;
}

interface AgencyReservationFiltersProps {
  filters: ReservationFilters;
  onFiltersChange: (filters: ReservationFilters) => void;
  activeFilterCount: number;
}

const statusOptions = [
  { value: 'all', label: 'Tümü' },
  { value: 'pending_admin_review', label: 'Admin Onayı Bekliyor' },
  { value: 'waiting_for_agency_approval', label: 'Onayınız Bekleniyor' },
  { value: 'waiting_for_customer_approval', label: 'Müşteri Bekleniyor' },
  { value: 'customer_approved', label: 'Onaylandı' },
  { value: 'confirmed', label: 'Onaylandı' },
  { value: 'assigned', label: 'Şoför Atandı' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'cancelled', label: 'İptal' },
];

export const AgencyReservationFilters = ({ 
  filters, 
  onFiltersChange, 
  activeFilterCount 
}: AgencyReservationFiltersProps) => {
  const { t, locale } = useAgencyTranslations();
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof ReservationFilters>(
    key: K, 
    value: ReservationFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
      customerName: '',
    });
  };

  return (
    <Card className="touch-manipulation">
      <CardContent className="p-2.5 sm:p-3">
        {/* Search Bar */}
        <div className="flex gap-1.5 sm:gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => updateFilter('searchQuery', e.target.value)}
              placeholder={t('searchPlaceholder') || 'Kod, müşteri veya adres ara...'}
              className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
            />
          </div>
          <Button
            variant={isExpanded ? 'secondary' : 'outline'}
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t space-y-2.5 sm:space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
              {/* Status Filter */}
              <div>
                <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">
                  {t('status') || 'Durum'}
                </label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => updateFilter('status', value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t('selectStatus') || 'Durum seçin'} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Name */}
              <div>
                <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">
                  {t('customer') || 'Müşteri'}
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={filters.customerName}
                    onChange={(e) => updateFilter('customerName', e.target.value)}
                    placeholder={t('customerName') || 'Müşteri adı'}
                    className="pl-8 sm:pl-9 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">
                  {t('dateFrom') || 'Başlangıç'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-xs sm:text-sm px-2 sm:px-3",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      {filters.dateFrom ? (
                        <span className="truncate">{format(filters.dateFrom, 'dd MMM', { locale })}</span>
                      ) : (
                        <span className="truncate">{t('selectDate') || 'Tarih'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => updateFilter('dateFrom', date)}
                      initialFocus
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-[10px] sm:text-xs text-muted-foreground mb-1 block">
                  {t('dateTo') || 'Bitiş'}
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 text-xs sm:text-sm px-2 sm:px-3",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      {filters.dateTo ? (
                        <span className="truncate">{format(filters.dateTo, 'dd MMM', { locale })}</span>
                      ) : (
                        <span className="truncate">{t('selectDate') || 'Tarih'}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => updateFilter('dateTo', date)}
                      initialFocus
                      locale={locale}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Clear Button */}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="w-full text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                {t('clearFilters') || 'Filtreleri Temizle'}
              </Button>
            )}
          </div>
        )}

        {/* Active Filter Tags */}
        {!isExpanded && activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {filters.status && filters.status !== 'all' && (
              <Badge variant="secondary" className="text-xs gap-1">
                {statusOptions.find(s => s.value === filters.status)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('status', 'all')} 
                />
              </Badge>
            )}
            {filters.customerName && (
              <Badge variant="secondary" className="text-xs gap-1">
                {filters.customerName}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('customerName', '')} 
                />
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="text-xs gap-1">
                {format(filters.dateFrom, 'dd MMM', { locale })} -
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('dateFrom', undefined)} 
                />
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="text-xs gap-1">
                - {format(filters.dateTo, 'dd MMM', { locale })}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('dateTo', undefined)} 
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AgencyReservationFilters;
