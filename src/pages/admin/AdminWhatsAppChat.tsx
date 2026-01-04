import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";
import {
  MessageCircle,
  Send,
  User,
  Phone,
  DollarSign,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  Clock,
  Plus,
  MapPin,
  Calendar,
  Car,
  Plane,
  ArrowLeft,
  Search,
  X,
  ChevronLeft,
  Zap,
  Check,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  customer_user_id: string | null;
  last_message_at: string;
  unread_count: number;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: string;
  message_type: string;
  content: string;
  twilio_sid: string | null;
  sent_by_user_id: string | null;
  reservation_id: string | null;
  metadata: any;
  status: string;
  created_at: string;
}

// Quick reply templates
const quickReplies = [
  { label: "Merhaba", text: "Merhaba! Meet Transfer'a hoş geldiniz. Size nasıl yardımcı olabilirim?" },
  { label: "Fiyat Bilgisi", text: "Transfer fiyatınızı hesaplıyorum, lütfen biraz bekleyin." },
  { label: "Teşekkürler", text: "Teşekkür ederiz! İyi yolculuklar dileriz. 🚗" },
  { label: "Bilgi İste", text: "Lütfen aşağıdaki bilgileri paylaşır mısınız?\n\n• Alış noktası\n• Varış noktası\n• Tarih ve saat\n• Yolcu sayısı" },
  { label: "Onay", text: "Rezervasyonunuz onaylandı! Detayları kısa süre içinde paylaşacağız." },
];

export default function AdminWhatsAppChat() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [checkingMessageId, setCheckingMessageId] = useState<string | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [reservationId, setReservationId] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Quick reservation form state
  const [showQuickReservation, setShowQuickReservation] = useState(false);
  const [quickReservation, setQuickReservation] = useState({
    pickup: "",
    dropoff: "",
    pickup_date: "",
    pickup_time: "",
    customer_name: "",
    vehicle_type: "mercedes-vito",
    flight_number: "",
  });
  const [creatingReservation, setCreatingReservation] = useState(false);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchConversations();
    
    const conversationsChannel = supabase
      .channel("whatsapp-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
    };
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      setMessagesLoading(true);
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      const messagesChannel = supabase
        .channel(`whatsapp-messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "whatsapp_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload: any) => {
            setMessages((prev) => {
              if (payload.eventType === "INSERT") {
                return [...prev, payload.new as Message];
              }
              if (payload.eventType === "UPDATE") {
                return prev.map((m) => (m.id === payload.new.id ? (payload.new as Message) : m));
              }
              if (payload.eventType === "DELETE") {
                return prev.filter((m) => m.id !== payload.old.id);
              }
              return prev;
            });

            if (payload.eventType === "INSERT") {
              scrollToBottom();
            }
          }
        )
        .subscribe();

      // Create presence channel for typing indicator
      const typingChannel = supabase.channel(`typing:${selectedConversation.id}`);
      typingChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          typingChannelRef.current = typingChannel;
        }
      });

      return () => {
        supabase.removeChannel(messagesChannel);
        if (typingChannelRef.current) {
          typingChannelRef.current.untrack();
          supabase.removeChannel(typingChannelRef.current);
          typingChannelRef.current = null;
        }
      };
    }
  }, [selectedConversation]);

  // Broadcast typing status when message changes
  useEffect(() => {
    if (!typingChannelRef.current || !selectedConversation) return;

    const isTyping = newMessage.trim().length > 0;
    
    // Track typing status via presence
    typingChannelRef.current.track({
      user_type: 'admin',
      is_typing: isTyping,
      conversation_id: selectedConversation.id,
    });

    // Clear typing after 3 seconds of no input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (typingChannelRef.current) {
          typingChannelRef.current.track({
            user_type: 'admin',
            is_typing: false,
            conversation_id: selectedConversation?.id,
          });
        }
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (typeof document !== "undefined" && document.activeElement === messageInputRef.current) return;
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from("whatsapp_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const normalizePhone = (phone: string): string => {
    return phone.replace(/[^\d+]/g, "").replace(/^0+/, "").replace(/^\+90/, "").replace(/^90/, "");
  };

  const fetchReservationsForPhone = async (phone: string) => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("pickup_date", { ascending: false });

      if (error) throw error;
      
      const normalizedInputPhone = normalizePhone(phone);
      const filtered = (data || []).filter(res => {
        const normalizedResPhone = normalizePhone(res.customer_phone || "");
        return normalizedResPhone === normalizedInputPhone || 
               normalizedResPhone.endsWith(normalizedInputPhone) ||
               normalizedInputPhone.endsWith(normalizedResPhone);
      });
      
      setReservations(filtered);
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const sendMessage = async (messageType: "text" | "price" | "magic_link" = "text", customMessage?: string) => {
    const messageToSend = customMessage || newMessage;
    if (!selectedConversation || (!messageToSend.trim() && messageType === "text")) return;

    if (!session?.access_token) {
      toast.error("Admin oturumu bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        conversation_id: selectedConversation.id,
        message: messageToSend,
        message_type: messageType,
      };

      if (messageType === "price") {
        payload.price = parseFloat(price);
        payload.currency = currency;
        if (reservationId) {
          payload.reservation_id = reservationId;
        }
      }

      const { data, error } = await supabase.functions.invoke("whatsapp-send-admin", {
        body: payload,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      setNewMessage("");
      setPrice("");
      setReservationId("");
      setPriceDialogOpen(false);
      toast.success("Mesaj gönderildi");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const sendMagicLink = async () => {
    if (!selectedConversation) return;

    if (!session?.access_token) {
      toast.error("Admin oturumu bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send-admin", {
        body: {
          conversation_id: selectedConversation.id,
          message: "Access your Meet Transfer account and manage your bookings:",
          message_type: "magic_link",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      toast.success("Hesap linki gönderildi");
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      toast.error(error.message || "Link gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const checkMessageStatus = async (msg: Message) => {
    if (!msg.twilio_sid) {
      toast.error("Bu mesajın teslimat SID'i yok");
      return;
    }

    setCheckingMessageId(msg.id);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-message-status", {
        body: { message_id: msg.id },
      });
      if (error) throw error;

      const status = data?.status ? String(data.status) : "unknown";
      toast.success(`WhatsApp durumu: ${status}`);
    } catch (error: any) {
      console.error("Error checking message status:", error);
      toast.error(error.message || "Durum kontrol edilemedi");
    } finally {
      setCheckingMessageId(null);
    }
  };

  const createQuickReservation = async () => {
    if (!selectedConversation) return;
    
    const { pickup, dropoff, pickup_date, pickup_time, customer_name, vehicle_type, flight_number } = quickReservation;
    
    if (!pickup || !dropoff || !pickup_date || !pickup_time || !customer_name) {
      toast.error("Lütfen tüm zorunlu alanları doldurun");
      return;
    }

    setCreatingReservation(true);
    try {
      let customerId = selectedConversation.customer_user_id;
      
      if (!customerId) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", selectedConversation.customer_phone)
          .maybeSingle();
        
        if (existingProfile) {
          customerId = existingProfile.id;
          
          await supabase
            .from("whatsapp_conversations")
            .update({ customer_user_id: customerId, customer_name: customer_name.trim() })
            .eq("id", selectedConversation.id);
        } else {
          const randomPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
          const customerEmail = `customer_${selectedConversation.customer_phone.replace(/\+/g, '')}@meettransfer.customer`;
          
          const { data: createResult, error: createError } = await supabase.functions.invoke(
            "create-user-account",
            {
              body: {
                email: customerEmail,
                password: randomPassword,
                role: "customer",
                name: customer_name.trim(),
                phone: selectedConversation.customer_phone,
              },
            }
          );

          if (createError) {
            throw new Error("Müşteri hesabı oluşturulamadı: " + createError.message);
          }

          if (!createResult?.user_id) {
            throw new Error("Müşteri ID alınamadı");
          }

          customerId = createResult.user_id;

          await supabase
            .from("whatsapp_conversations")
            .update({ customer_user_id: customerId, customer_name: customer_name.trim() })
            .eq("id", selectedConversation.id);
        }
      }
      
      const { data: newReservation, error } = await supabase
        .from("reservations")
        .insert({
          customer_id: customerId,
          customer_name: customer_name.trim(),
          customer_phone: selectedConversation.customer_phone,
          pickup: pickup.trim(),
          dropoff: dropoff.trim(),
          pickup_date,
          pickup_time,
          flight_number: flight_number?.trim() || null,
          vehicle_type,
          payment_type: "cash",
          status: "awaiting-price",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Rezervasyon oluşturuldu");
      
      const updatedReservations = [newReservation, ...reservations];
      setReservations(updatedReservations);
      setReservationId(newReservation.id);
      
      setQuickReservation({
        pickup: "",
        dropoff: "",
        pickup_date: "",
        pickup_time: "",
        customer_name: selectedConversation.customer_name || "",
        vehicle_type: "mercedes-vito",
        flight_number: "",
      });
      setShowQuickReservation(false);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error(error.message || "Rezervasyon oluşturulamadı");
    } finally {
      setCreatingReservation(false);
    }
  };

  const parseCustomerInfoFromMessages = () => {
    const incomingMessages = messages.filter(m => m.direction === "incoming");
    let info = {
      pickup: "",
      dropoff: "",
      date: "",
      time: "",
      passengers: "",
      email: "",
      name: selectedConversation?.customer_name || "",
      vehicle_type: "",
    };

    for (const msg of incomingMessages) {
      const lines = msg.content.split("\n");
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes("airport") || lowerLine.includes("ist") || lowerLine.includes("ayt") || lowerLine.includes("saw")) {
          if (!info.pickup) info.pickup = line.replace(/[•\-:]/g, "").trim();
        }
        if (lowerLine.includes("destination") || lowerLine.includes("hotel") || lowerLine.includes("taksim")) {
          if (!info.dropoff) info.dropoff = line.replace(/[•\-:]/g, "").replace(/destination/i, "").trim();
        }
        if (lowerLine.includes("date") || lowerLine.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/)) {
          const dateMatch = line.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, "0");
            const month = dateMatch[2].padStart(2, "0");
            let year = dateMatch[3];
            if (year.length === 2) year = "20" + year;
            info.date = `${year}-${month}-${day}`;
          }
          const timeMatch = line.match(/(\d{1,2})[:.h](\d{2})/);
          if (timeMatch) {
            info.time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
          }
        }
        if (lowerLine.includes("passenger")) {
          const numMatch = line.match(/(\d+)/);
          if (numMatch) info.passengers = numMatch[1];
        }
        if (lowerLine.includes("@") && lowerLine.includes(".")) {
          const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) info.email = emailMatch[0];
        }
        if (lowerLine.includes("vehicle") || lowerLine.includes("araç") || lowerLine.includes("vito") || lowerLine.includes("maybach") || lowerLine.includes("minibus") || lowerLine.includes("sprinter")) {
          if (!info.vehicle_type) {
            if (lowerLine.includes("maybach")) {
              info.vehicle_type = "maybach";
            } else if (lowerLine.includes("vip") && lowerLine.includes("vito")) {
              info.vehicle_type = "mercedes-vclass";
            } else if (lowerLine.includes("vito")) {
              info.vehicle_type = "mercedes-vito";
            } else if (lowerLine.includes("minibus") || lowerLine.includes("sprinter")) {
              info.vehicle_type = "minibus";
            }
          }
        }
      }
    }
    
    return info;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent IME/composition from accidentally sending
    if ((e.nativeEvent as any).isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      // Use the live textarea value so the last character isn't lost
      sendMessage("text", e.currentTarget.value);
    }
  };

  const formatConversationDate = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, "HH:mm");
    if (isYesterday(d)) return "Dün";
    return format(d, "dd MMM", { locale: tr });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-3 w-3 text-blue-400" />;
      case "read":
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case "sent":
        return <Check className="h-3 w-3 opacity-70" />;
      case "failed":
        return <XCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 opacity-50" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (conv.customer_name?.toLowerCase() || "").includes(query) ||
      conv.customer_phone.includes(query)
    );
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchReservationsForPhone(conv.customer_phone);

    if (isMobile) {
      setShowMobileChat(true);
    }

    // Focus message box for faster manual typing
    setTimeout(() => messageInputRef.current?.focus(), 50);
  };

  // Conversation List Component
  const renderConversationsList = () => (
    <Card className={cn("flex flex-col", isMobile ? "h-full border-0 rounded-none" : "w-80 flex-shrink-0")}>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>
          <Button variant="ghost" size="icon" onClick={fetchConversations}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">WhatsApp</CardTitle>
          {totalUnread > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalUnread}
            </Badge>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="İsim veya telefon ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {searchQuery ? "Sonuç bulunamadı" : "Henüz sohbet yok"}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors",
                  selectedConversation?.id === conv.id && "bg-primary/5 border-l-2 border-l-primary"
                )}
                onClick={() => handleSelectConversation(conv)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                    conv.unread_count > 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("font-medium text-sm truncate", conv.unread_count > 0 && "font-semibold")}>
                        {conv.customer_name || "Bilinmeyen"}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatConversationDate(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {conv.customer_phone}
                      </p>
                      {conv.unread_count > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] px-1.5">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // Chat Area Component
  const renderChatArea = () => (
    <Card className={cn("flex flex-col", isMobile ? "h-full border-0 rounded-none" : "flex-1")}>
      {selectedConversation ? (
        <>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMobileChat(false)}
                    className="-ml-2"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                )}
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">
                    {selectedConversation.customer_name || "Bilinmeyen Müşteri"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.customer_phone}
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <DollarSign className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Fiyat</span>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Fiyat Teklifi Gönder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Fiyat</Label>
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="65"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Para Birimi</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EUR">€ EUR</SelectItem>
                              <SelectItem value="USD">$ USD</SelectItem>
                              <SelectItem value="GBP">£ GBP</SelectItem>
                              <SelectItem value="TRY">₺ TRY</SelectItem>
                              <SelectItem value="AED">د.إ AED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {reservations.length > 0 ? (
                        <div className="space-y-2">
                          <Label>Rezervasyon <span className="text-destructive">*</span></Label>
                          <Select value={reservationId} onValueChange={setReservationId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Rezervasyon seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              {reservations.map((res) => (
                                <SelectItem key={res.id} value={res.id}>
                                  <span className="truncate">
                                    {res.pickup.slice(0, 15)}... → {res.dropoff.slice(0, 15)}... ({format(new Date(res.pickup_date), "dd MMM")})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : !showQuickReservation ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            Bu numara için rezervasyon bulunamadı.
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              const info = parseCustomerInfoFromMessages();
                              setQuickReservation({
                                pickup: info.pickup || "",
                                dropoff: info.dropoff || "",
                                pickup_date: info.date || "",
                                pickup_time: info.time || "",
                                customer_name: info.name || selectedConversation?.customer_name || "",
                                vehicle_type: info.vehicle_type || "mercedes-vito",
                                flight_number: "",
                              });
                              setShowQuickReservation(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Hızlı Rezervasyon Oluştur
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label className="font-semibold">Hızlı Rezervasyon</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowQuickReservation(false)}
                            >
                              İptal
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1">
                              <User className="h-3 w-3" /> Müşteri Adı *
                            </Label>
                            <Input
                              value={quickReservation.customer_name}
                              onChange={(e) => setQuickReservation({...quickReservation, customer_name: e.target.value})}
                              placeholder="Müşteri adı"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Alış *
                              </Label>
                              <Input
                                value={quickReservation.pickup}
                                onChange={(e) => setQuickReservation({...quickReservation, pickup: e.target.value})}
                                placeholder="IST Havalimanı"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Varış *
                              </Label>
                              <Input
                                value={quickReservation.dropoff}
                                onChange={(e) => setQuickReservation({...quickReservation, dropoff: e.target.value})}
                                placeholder="Taksim"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Calendar className="h-3 w-3" /> Tarih *
                              </Label>
                              <Input
                                type="date"
                                value={quickReservation.pickup_date}
                                onChange={(e) => setQuickReservation({...quickReservation, pickup_date: e.target.value})}
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Saat *
                              </Label>
                              <Input
                                type="time"
                                value={quickReservation.pickup_time}
                                onChange={(e) => setQuickReservation({...quickReservation, pickup_time: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Plane className="h-3 w-3" /> Uçuş No
                              </Label>
                              <Input
                                value={quickReservation.flight_number}
                                onChange={(e) => setQuickReservation({...quickReservation, flight_number: e.target.value})}
                                placeholder="TK123"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Car className="h-3 w-3" /> Araç
                              </Label>
                              <Select 
                                value={quickReservation.vehicle_type} 
                                onValueChange={(v) => setQuickReservation({...quickReservation, vehicle_type: v})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mercedes-vito">Vito</SelectItem>
                                  <SelectItem value="mercedes-vclass">VIP Vito</SelectItem>
                                  <SelectItem value="maybach">Maybach</SelectItem>
                                  <SelectItem value="minibus">Minibus</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            type="button"
                            className="w-full"
                            onClick={createQuickReservation}
                            disabled={creatingReservation}
                          >
                            {creatingReservation ? "Oluşturuluyor..." : "Rezervasyon Oluştur"}
                          </Button>
                        </div>
                      )}
                      
                      <Button
                        className="w-full"
                        onClick={() => sendMessage("price")}
                        disabled={!price || !reservationId || sending}
                      >
                        {sending ? "Gönderiliyor..." : "Fiyat Gönder"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" onClick={sendMagicLink} disabled={sending} className="h-8">
                  <LinkIcon className="h-4 w-4" />
                  {!isMobile && <span className="ml-1">Hesap</span>}
                </Button>
              </div>
            </div>
            
            {/* Customer Reservations Summary */}
            {reservations.length > 0 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {reservations.slice(0, 3).map((res) => (
                  <Badge key={res.id} variant="secondary" className="text-xs whitespace-nowrap">
                    {format(new Date(res.pickup_date), "dd MMM")} • {res.status === 'completed' ? '✓' : res.status === 'cancelled' ? '✗' : '⏳'}
                  </Badge>
                ))}
                {reservations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{reservations.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col min-h-0">
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-lg`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                          msg.direction === "outgoing"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className="text-[10px] opacity-70">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          {msg.direction === "outgoing" && (
                            <>
                              {getMessageStatusIcon(msg.status)}
                              {msg.twilio_sid && (
                                <button
                                  type="button"
                                  className="opacity-50 hover:opacity-100 transition-opacity"
                                  onClick={() => checkMessageStatus(msg)}
                                  disabled={checkingMessageId === msg.id}
                                  title="Teslimat durumunu kontrol et"
                                >
                                  <RefreshCw
                                    className={cn("h-3 w-3", checkingMessageId === msg.id && "animate-spin")}
                                  />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
              
              {/* Typing Indicator */}
              <AnimatePresence>
                {newMessage.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-end px-4 pb-2"
                  >
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1.5">
                      <span className="text-xs font-medium">Yazıyorsunuz</span>
                      <div className="flex gap-0.5">
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                        <motion.span
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                          className="w-1 h-1 bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollArea>

            <Separator />

            {/* Quick Replies */}
            <div className="px-3 py-2 flex gap-2 overflow-x-auto border-b bg-muted/30">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs whitespace-nowrap flex-shrink-0"
                  onClick={() => {
                    setNewMessage(reply.text);
                  }}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {reply.label}
                </Button>
              ))}
            </div>

            <div className="p-3">
              <div className="flex gap-2">
                <Textarea
                  ref={messageInputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesaj yazın..."
                  className="min-h-[60px] max-h-[120px] resize-none"
                />
                <Button
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!newMessage.trim() || sending}
                  className="h-auto px-4"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium">Sohbet seçin</p>
            <p className="text-sm mt-1">Mesajlaşmaya başlamak için sol taraftan bir sohbet seçin</p>
          </div>
        </CardContent>
      )}
    </Card>
  );

  // Mobile view with slide animation
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-4rem)] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {!showMobileChat ? (
            <motion.div
              key="list"
              initial={{ x: 0 }}
              exit={{ x: -100, opacity: 0 }}
              className="absolute inset-0"
            >
              {renderConversationsList()}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="absolute inset-0"
            >
              {renderChatArea()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {renderConversationsList()}
      {renderChatArea()}
    </div>
  );
}
