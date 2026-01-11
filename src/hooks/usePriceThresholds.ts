import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PriceThreshold {
  id: string;
  vehicle_type: string;
  min_price_eur: number;
  created_at: string;
  updated_at: string;
}

// Default thresholds as fallback
const DEFAULT_THRESHOLDS: Record<string, number> = {
  'mercedes-vito': 50,
  'vip-mercedes': 60,
  'maybach-minibus': 70,
  'minibus': 100,
};

export function usePriceThresholds() {
  const queryClient = useQueryClient();

  const { data: thresholds, isLoading, error } = useQuery({
    queryKey: ['price-thresholds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_thresholds')
        .select('*')
        .order('vehicle_type');
      
      if (error) throw error;
      return data as PriceThreshold[];
    },
  });

  const updateThreshold = useMutation({
    mutationFn: async ({ id, min_price_eur }: { id: string; min_price_eur: number }) => {
      const { error } = await supabase
        .from('price_thresholds')
        .update({ min_price_eur })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-thresholds'] });
      toast.success('Fiyat eşiği güncellendi');
    },
    onError: (error) => {
      console.error('Error updating threshold:', error);
      toast.error('Fiyat eşiği güncellenemedi');
    },
  });

  const createThreshold = useMutation({
    mutationFn: async ({ vehicle_type, min_price_eur }: { vehicle_type: string; min_price_eur: number }) => {
      const { error } = await supabase
        .from('price_thresholds')
        .insert({ vehicle_type, min_price_eur });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-thresholds'] });
      toast.success('Fiyat eşiği eklendi');
    },
    onError: (error) => {
      console.error('Error creating threshold:', error);
      toast.error('Fiyat eşiği eklenemedi');
    },
  });

  // Convert to a map for easy lookup
  const thresholdsMap: Record<string, number> = {};
  if (thresholds) {
    thresholds.forEach(t => {
      thresholdsMap[t.vehicle_type] = Number(t.min_price_eur);
    });
  }

  // Merge with defaults for any missing vehicle types
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholdsMap };

  return {
    thresholds,
    thresholdsMap: mergedThresholds,
    isLoading,
    error,
    updateThreshold,
    createThreshold,
  };
}

// Utility function to get thresholds for validation (can be used outside React)
export async function fetchPriceThresholds(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('price_thresholds')
    .select('vehicle_type, min_price_eur');
  
  if (error) {
    console.error('Error fetching thresholds:', error);
    return DEFAULT_THRESHOLDS;
  }

  const thresholdsMap: Record<string, number> = { ...DEFAULT_THRESHOLDS };
  data?.forEach(t => {
    thresholdsMap[t.vehicle_type] = Number(t.min_price_eur);
  });

  return thresholdsMap;
}
