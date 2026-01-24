import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Calendar, LayoutGrid, Table2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  dateFilter: string;
  onDateChange: (value: string) => void;
  providerFilter: string;
  onProviderChange: (value: string) => void;
  currencyFilter: string;
  onCurrencyChange: (value: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  availableProviders: string[];
  availableCurrencies: string[];
  onExport: () => void;
  activeTab: string;
}

export const PaymentFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  dateFilter,
  onDateChange,
  providerFilter,
  onProviderChange,
  currencyFilter,
  onCurrencyChange,
  viewMode,
  onViewModeChange,
  availableProviders,
  availableCurrencies,
  onExport,
  activeTab
}: PaymentFiltersProps) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Status Filter - Only for customer tab */}
        {activeTab === 'customer' && (
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="pending">Bekliyor</SelectItem>
              <SelectItem value="partial">Kısmi</SelectItem>
              <SelectItem value="pay_on_transfer">Nakit</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Provider Filter - Only for customer tab */}
        {activeTab === 'customer' && availableProviders.length > 0 && (
          <Select value={providerFilter} onValueChange={onProviderChange}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="Yöntem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yöntemler</SelectItem>
              {availableProviders.map(provider => (
                <SelectItem key={provider} value={provider} className="capitalize">
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Currency Filter */}
        {availableCurrencies.length > 1 && (
          <Select value={currencyFilter} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue placeholder="Para Birimi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>
                  {currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={onDateChange}>
          <SelectTrigger className="w-[130px] h-9">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tarih" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Zamanlar</SelectItem>
            <SelectItem value="today">Bugün</SelectItem>
            <SelectItem value="week">Son 7 Gün</SelectItem>
            <SelectItem value="month">Bu Ay</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View mode toggle and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2",
              viewMode === 'cards' && "bg-background shadow-sm"
            )}
            onClick={() => onViewModeChange('cards')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2",
              viewMode === 'table' && "bg-background shadow-sm"
            )}
            onClick={() => onViewModeChange('table')}
          >
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2"
          onClick={onExport}
        >
          <Download className="h-4 w-4" />
          Excel
        </Button>
      </div>
    </div>
  );
};
