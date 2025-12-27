import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { History, Send, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currency";

interface PriceHistoryItem {
  id: string;
  price: number;
  price_currency: string;
  action: string;
  customer_note: string | null;
  created_at: string;
}

interface PriceHistoryCardProps {
  reservationId?: string;
  quickBookingId?: string;
}

const actionColors: Record<string, string> = {
  sent: "bg-blue-500/20 text-blue-700",
  accepted: "bg-green-500/20 text-green-700",
  rejected: "bg-red-500/20 text-red-700",
};

const actionLabels: Record<string, string> = {
  sent: "Fiyat Gönderildi",
  accepted: "Kabul Edildi",
  rejected: "Reddedildi",
};

const actionIcons: Record<string, React.ReactNode> = {
  sent: <Send className="h-3 w-3" />,
  accepted: <CheckCircle className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
};


export default function PriceHistoryCard({ reservationId, quickBookingId }: PriceHistoryCardProps) {
  const [history, setHistory] = useState<PriceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [reservationId, quickBookingId]);

  const fetchHistory = async () => {
    try {
      let query = supabase
        .from("price_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (reservationId) {
        query = query.eq("reservation_id", reservationId);
      } else if (quickBookingId) {
        query = query.eq("quick_booking_id", quickBookingId);
      } else {
        setHistory([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory((data as PriceHistoryItem[]) || []);
    } catch (err) {
      console.error("Error fetching price history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return null; // Don't show card if no history
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Fiyat Geçmişi
          <Badge variant="secondary" className="ml-auto">
            {history.length} kayıt
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 pb-3">
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {history.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  index === 0 ? "bg-muted/50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Badge className={actionColors[item.action] || "bg-muted"}>
                    <span className="flex items-center gap-1">
                      {actionIcons[item.action]}
                      {actionLabels[item.action] || item.action}
                    </span>
                  </Badge>
                  <span className="font-bold">
                    {getCurrencySymbol(item.price_currency)}{item.price}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(item.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                  </p>
                  {item.customer_note && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                      "{item.customer_note}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
