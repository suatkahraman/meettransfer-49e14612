import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { format } from "date-fns";
import {
  MessageCircle,
  Send,
  User,
  Phone,
  DollarSign,
  Link as LinkIcon,
  RefreshCw,
  CheckCircle,
  Clock,
  Plus,
  MapPin,
  Calendar,
  Car,
  Plane,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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

export default function AdminWhatsAppChat() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [checkingMessageId, setCheckingMessageId] = useState<string | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [reservationId, setReservationId] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to realtime updates
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
      fetchMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);

      // Subscribe to messages for this conversation (INSERT + UPDATE so delivery status changes appear)
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

      return () => {
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    // Remove all non-digit characters except leading +
    return phone.replace(/[^\d+]/g, "").replace(/^0+/, "").replace(/^\+90/, "").replace(/^90/, "");
  };

  const fetchReservationsForPhone = async (phone: string) => {
    try {
      // Get all reservations and filter by normalized phone
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

  const sendMessage = async (messageType: "text" | "price" | "magic_link" = "text") => {
    if (!selectedConversation || (!newMessage.trim() && messageType === "text")) return;

    if (!session?.access_token) {
      toast.error("Admin oturumu bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    setSending(true);
    try {
      const payload: any = {
        conversation_id: selectedConversation.id,
        message: newMessage,
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
      toast.success("Message sent");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message");
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
      toast.success("Account link sent");
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      toast.error(error.message || "Failed to send link");
    } finally {
      setSending(false);
    }
  };

  const checkMessageStatus = async (msg: Message) => {
    if (!msg.twilio_sid) {
      toast.error("This message has no delivery SID");
      return;
    }

    setCheckingMessageId(msg.id);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-message-status", {
        body: { message_id: msg.id },
      });
      if (error) throw error;

      const status = data?.status ? String(data.status) : "unknown";
      toast.success(`WhatsApp status: ${status}`);
    } catch (error: any) {
      console.error("Error checking message status:", error);
      toast.error(error.message || "Failed to check status");
    } finally {
      setCheckingMessageId(null);
    }
  };

  const createQuickReservation = async () => {
    if (!selectedConversation) return;
    
    const { pickup, dropoff, pickup_date, pickup_time, customer_name, vehicle_type, flight_number } = quickReservation;
    
    if (!pickup || !dropoff || !pickup_date || !pickup_time || !customer_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingReservation(true);
    try {
      let customerId = selectedConversation.customer_user_id;
      
      // If no customer account in conversation, check by phone number first
      if (!customerId) {
        console.log("Checking for existing customer by phone:", selectedConversation.customer_phone);
        
        // Search for existing customer by phone number in profiles table
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("phone", selectedConversation.customer_phone)
          .maybeSingle();
        
        if (existingProfile) {
          customerId = existingProfile.id;
          console.log("Found existing customer by phone:", customerId);
          
          // Update the conversation with the existing customer_user_id
          await supabase
            .from("whatsapp_conversations")
            .update({ customer_user_id: customerId, customer_name: customer_name.trim() })
            .eq("id", selectedConversation.id);
        } else {
          console.log("No existing customer found, creating new account...");
          
          // Generate a random password for the customer
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
            console.error("Error creating customer account:", createError);
            throw new Error("Failed to create customer account: " + createError.message);
          }

          if (!createResult?.user_id) {
            throw new Error("Failed to get customer user ID");
          }

          customerId = createResult.user_id;
          console.log("Created new customer account:", customerId);

          // Update the conversation with the new customer_user_id
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

      toast.success("Reservation created successfully");
      
      // Add to reservations list and select it
      const updatedReservations = [newReservation, ...reservations];
      setReservations(updatedReservations);
      setReservationId(newReservation.id);
      
      // Reset form but keep quick reservation closed
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
      
      console.log("Created reservation:", newReservation.id, "Total reservations:", updatedReservations.length);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      toast.error(error.message || "Failed to create reservation");
    } finally {
      setCreatingReservation(false);
    }
  };

  // Parse messages to extract customer info
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
      const content = msg.content.toLowerCase();
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
        // Parse vehicle type
        if (lowerLine.includes("vehicle") || lowerLine.includes("araç") || lowerLine.includes("vito") || lowerLine.includes("maybach") || lowerLine.includes("minibus") || lowerLine.includes("sprinter")) {
          if (!info.vehicle_type) {
            if (lowerLine.includes("maybach")) {
              info.vehicle_type = "mercedes-maybach";
            } else if (lowerLine.includes("vip") && lowerLine.includes("vito")) {
              info.vehicle_type = "vip-vito";
            } else if (lowerLine.includes("vito")) {
              info.vehicle_type = "mercedes-vito";
            } else if (lowerLine.includes("minibus") || lowerLine.includes("sprinter")) {
              info.vehicle_type = "mercedes-sprinter";
            }
          }
        }
      }
    }
    
    return info;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* Conversations List */}
      <Card className="w-80 flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="w-fit -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Geri
            </Button>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Inbox
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchConversations}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-300px)]">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedConversation?.id === conv.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedConversation(conv);
                    fetchReservationsForPhone(conv.customer_phone);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {conv.customer_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {conv.customer_phone}
                        </p>
                      </div>
                    </div>
                    {conv.unread_count > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(conv.last_message_at), "MMM d, HH:mm")}
                  </p>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConversation.customer_name || "Unknown Customer"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.customer_phone}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Dialog open={priceDialogOpen} onOpenChange={setPriceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Send Price
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Price Quote</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Price</Label>
                            <Input
                              type="number"
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder="65"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Currency</Label>
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
                                <SelectItem value="AUD">$ AUD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {reservations.length > 0 ? (
                          <div className="space-y-2">
                            <Label>Link to Reservation <span className="text-destructive">*</span></Label>
                            <Select value={reservationId} onValueChange={setReservationId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reservation (required)" />
                              </SelectTrigger>
                              <SelectContent>
                                {reservations.map((res) => (
                                  <SelectItem key={res.id} value={res.id}>
                                    {res.pickup} → {res.dropoff} ({format(new Date(res.pickup_date), "MMM d")})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ) : !showQuickReservation ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                              No reservations found for this phone number.
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
                              Create Quick Reservation
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <Label className="font-semibold">Quick Reservation</Label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQuickReservation(false)}
                              >
                                Cancel
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <User className="h-3 w-3" /> Customer Name *
                              </Label>
                              <Input
                                value={quickReservation.customer_name}
                                onChange={(e) => setQuickReservation({...quickReservation, customer_name: e.target.value})}
                                placeholder="Customer name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Pick-up *
                              </Label>
                              <Input
                                value={quickReservation.pickup}
                                onChange={(e) => setQuickReservation({...quickReservation, pickup: e.target.value})}
                                placeholder="e.g. Istanbul Airport (IST)"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Drop-off *
                              </Label>
                              <Input
                                value={quickReservation.dropoff}
                                onChange={(e) => setQuickReservation({...quickReservation, dropoff: e.target.value})}
                                placeholder="e.g. Taksim, Istanbul"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-2">
                                <Label className="text-xs flex items-center gap-1">
                                  <Calendar className="h-3 w-3" /> Date *
                                </Label>
                                <Input
                                  type="date"
                                  value={quickReservation.pickup_date}
                                  onChange={(e) => setQuickReservation({...quickReservation, pickup_date: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Time *
                                </Label>
                                <Input
                                  type="time"
                                  value={quickReservation.pickup_time}
                                  onChange={(e) => setQuickReservation({...quickReservation, pickup_time: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Plane className="h-3 w-3" /> Flight Number
                              </Label>
                              <Input
                                value={quickReservation.flight_number}
                                onChange={(e) => setQuickReservation({...quickReservation, flight_number: e.target.value})}
                                placeholder="e.g. TK123"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs flex items-center gap-1">
                                <Car className="h-3 w-3" /> Vehicle
                              </Label>
                              <Select 
                                value={quickReservation.vehicle_type} 
                                onValueChange={(v) => setQuickReservation({...quickReservation, vehicle_type: v})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mercedes-vito">Mercedes Vito</SelectItem>
                                  <SelectItem value="mercedes-vclass">Mercedes VIP Vito</SelectItem>
                                  <SelectItem value="maybach">Maybach</SelectItem>
                                  <SelectItem value="minibus">Minibus</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              type="button"
                              className="w-full"
                              onClick={createQuickReservation}
                              disabled={creatingReservation}
                            >
                              {creatingReservation ? "Creating..." : "Create Reservation"}
                            </Button>
                          </div>
                        )}
                        <Button
                          className="w-full"
                          onClick={() => sendMessage("price")}
                          disabled={!price || !reservationId || sending}
                        >
                          {sending ? "Sending..." : "Send Price with Confirm Button"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={sendMagicLink} disabled={sending}>
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Send Account Link
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === "outgoing" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === "outgoing"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs opacity-70">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </p>

                          {msg.direction === "outgoing" && (
                            <>
                              <span className="text-xs opacity-70">• {msg.status || "sent"}</span>
                              {msg.twilio_sid && (
                                <button
                                  type="button"
                                  className="ml-1 inline-flex items-center opacity-70 hover:opacity-100"
                                  onClick={() => checkMessageStatus(msg)}
                                  disabled={checkingMessageId === msg.id}
                                  title="Check WhatsApp delivery status"
                                >
                                  <RefreshCw
                                    className={`h-3 w-3 ${checkingMessageId === msg.id ? "animate-spin" : ""}`}
                                  />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator />

              <div className="p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="min-h-[80px] resize-none"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim() || sending}
                    className="h-auto"
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
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start chatting</p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
