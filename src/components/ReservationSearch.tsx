import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReservationSearchProps {
  userType: 'admin' | 'agency' | 'driver';
  agencyId?: string;
  driverId?: string;
  placeholder?: string;
}

const ReservationSearch = ({ userType, agencyId, driverId, placeholder }: ReservationSearchProps) => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const code = searchCode.trim().toUpperCase();
    if (!code) {
      toast.error('Rezervasyon kodu girin');
      return;
    }

    setSearching(true);

    try {
      let query = supabase
        .from('reservations')
        .select('id, reservation_code, status')
        .eq('reservation_code', code);

      // Apply role-specific filters
      if (userType === 'agency' && agencyId) {
        query = query.eq('agency_id', agencyId);
      } else if (userType === 'driver' && driverId) {
        query = query.eq('driver_id', driverId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Search error:', error);
        toast.error('Arama sırasında hata oluştu');
        return;
      }

      if (!data) {
        if (userType === 'admin') {
          toast.error('Rezervasyon bulunamadı');
        } else if (userType === 'agency') {
          toast.error('Bu rezervasyon size ait değil veya bulunamadı');
        } else {
          toast.error('Bu rezervasyon size atanmamış veya bulunamadı');
        }
        return;
      }

      // Navigate to detail page
      if (userType === 'admin') {
        navigate(`/admin/reservations/${data.id}`);
      } else if (userType === 'agency') {
        navigate(`/agency/reservation/${data.id}`);
      } else if (userType === 'driver') {
        navigate(`/driver/job/${data.id}`);
      }

      setSearchCode('');
    } catch (err) {
      console.error('Search exception:', err);
      toast.error('Arama sırasında hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'MT123456'}
          className="pl-9 uppercase"
          maxLength={10}
        />
      </div>
      <Button
        onClick={handleSearch}
        disabled={searching || !searchCode.trim()}
        size="icon"
        variant="secondary"
      >
        {searching ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ReservationSearch;
