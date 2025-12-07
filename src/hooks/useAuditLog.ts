import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  table_name: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
}

export const useAuditLog = () => {
  const logAction = async (params: AuditLogParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('log-admin-action', {
        body: params,
      });

      if (error) {
        console.error('Failed to log admin action:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Audit log error:', error);
      return { success: false, error };
    }
  };

  return { logAction };
};
