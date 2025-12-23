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
} from "lucide-react";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [reservationId, setReservationId] = useState("");
  const [reservations, setReservations] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      // Subscribe to messages for this conversation
      const messagesChannel = supabase
        .channel(`whatsapp-messages-${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "whatsapp_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
            scrollToBottom();
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

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-send-admin", {
        body: {
          conversation_id: selectedConversation.id,
          message: "Access your Meet Transfer account and manage your bookings:",
          message_type: "magic_link",
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              WhatsApp Inbox
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={fetchConversations}>
              <RefreshCw className="h-4 w-4" />
            </Button>
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
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="TRY">TRY (₺)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
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
                        ) : (
                          <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                            No reservations found for this phone number. Create a reservation first before sending a price.
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
                            <CheckCircle className="h-3 w-3 opacity-70" />
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
