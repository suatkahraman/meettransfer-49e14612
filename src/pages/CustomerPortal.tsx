import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import meetTransferLogo from "@/assets/meet-transfer-logo.webp";
import {
  Car,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  Plus,
  CheckCircle,
  Loader2,
  Percent,
  MessageCircle,
  Send,
  X,
  Briefcase,
  Baby,
  Home,
  PhoneCall,
  Shield,
  Globe,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";

// Language options
const LANGUAGES = [
  { code: "EN" as Language, label: "English", flag: "🇬🇧" },
  { code: "TR" as Language, label: "Türkçe", flag: "🇹🇷" },
  { code: "DE" as Language, label: "Deutsch", flag: "🇩🇪" },
  { code: "FR" as Language, label: "Français", flag: "🇫🇷" },
  { code: "RU" as Language, label: "Русский", flag: "🇷🇺" },
  { code: "AR" as Language, label: "العربية", flag: "🇸🇦" },
] as const;

const WHATSAPP_NUMBER = '905321748390';
const EMERGENCY_PHONE = '+905321748390';

interface Reservation {
  id: string;
  pickup: string;
  dropoff: string;
  pickup_date: string;
  pickup_time: string;
  customer_name: string;
  customer_phone: string;
  vehicle_type: string;
  status: string;
  price: number | null;
  price_currency: string | null;
  driver_id: string | null;
  is_return_transfer: boolean;
  original_reservation_id: string | null;
  discount_percentage: number;
  discount_amount: number;
  reservation_code: string | null;
  luggage_count: number | null;
  baby_seat_count: number | null;
}

interface Message {
  id: string;
  direction: string;
  content: string;
  created_at: string;
}

interface PortalData {
  user_id: string;
  phone: string;
  reservations: Reservation[];
  conversation_id: string | null;
}

export default function CustomerPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      authenticateWithToken(token);
    } else {
      setError("No access token provided");
      setLoading(false);
    }
  }, [searchParams]);

  const authenticateWithToken = async (token: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal-auth", {
        body: { token },
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
      } else {
        setPortalData(data);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages and setup realtime subscriptions when chat opens
  useEffect(() => {
    if (!showChat || !portalData?.conversation_id) return;

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from("whatsapp_messages")
          .select("id, direction, content, created_at")
          .eq("conversation_id", portalData.conversation_id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`customer-messages-${portalData.conversation_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${portalData.conversation_id}`,
        },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
        }
      )
      .subscribe();

    // Subscribe to admin typing presence
    const typingChannel = supabase
      .channel(`typing:${portalData.conversation_id}`)
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        const adminPresence = Object.values(state).flat().find(
          (p: any) => p.user_type === "admin" && p.is_typing
        );
        setAdminTyping(!!adminPresence);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          typingChannelRef.current = typingChannel;
        }
      });

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      typingChannelRef.current = null;
    };
  }, [showChat, portalData?.conversation_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (showChat && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, showChat]);

  // Handle customer typing indicator
  const handleTypingChange = (value: string) => {
    setNewMessage(value);
    
    if (!typingChannelRef.current) return;
    
    // Start typing
    if (!isTyping && value.length > 0) {
      setIsTyping(true);
      typingChannelRef.current.track({
        user_type: "customer",
        is_typing: true,
        phone: portalData?.phone,
      });
    }
    
    // Reset timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (typingChannelRef.current) {
        typingChannelRef.current.untrack();
      }
    }, 3000);
  };

  // Send message to admin via WhatsApp
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !portalData?.conversation_id || sendingMessage) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    if (typingChannelRef.current) {
      typingChannelRef.current.untrack();
    }

    try {
      // Insert message directly to database (as incoming from customer perspective in admin view)
      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: portalData.conversation_id,
        direction: "incoming", // incoming = from customer to admin
        content: messageContent,
        message_type: "portal",
        status: "delivered",
      });

      if (error) throw error;

      // Update conversation last message time
      await supabase
        .from("whatsapp_conversations")
        .update({ 
          last_message_at: new Date().toISOString(),
          unread_count: supabase.rpc ? 1 : 1, // Increment would need RPC
        })
        .eq("id", portalData.conversation_id);

      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(t('errorSendingMessage') || "Mesaj gönderilemedi");
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      confirmed: "default",
      completed: "secondary",
      cancelled: "destructive",
      pending: "outline",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").replace(/-/g, " ")}
      </Badge>
    );
  };

  const handleCreateReturnTransfer = (originalReservation: Reservation) => {
    // Navigate to booking form with return transfer data
    const returnData = {
      pickup: originalReservation.dropoff,
      dropoff: originalReservation.pickup,
      original_reservation_id: originalReservation.id,
      is_return_transfer: true,
      discount_percentage: 30,
    };
    
    navigate(`/book?return=true&original=${originalReservation.id}`);
  };

  // Animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 mx-auto mb-4 text-primary" />
          </motion.div>
          <p className="text-muted-foreground font-medium">{t('loadingYourAccount')}</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-destructive/10 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full shadow-xl border-destructive/20">
            <CardContent className="pt-6 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4"
              >
                <span className="text-3xl">❌</span>
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">{t('accessDenied')}</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => navigate("/")} className="shadow-lg">{t('goToHomepage')}</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header with Logo and Language Selector */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-primary text-primary-foreground py-3 px-4 sticky top-0 z-10 shadow-lg backdrop-blur-sm"
      >
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img 
                src={meetTransferLogo} 
                alt="Meet Transfer" 
                className="h-10 w-10 rounded-lg shadow-md"
              />
              <span className="text-lg font-serif font-bold hidden sm:block">Meet Transfer</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="w-auto gap-1 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 h-9 px-2 shadow-sm">
                  <Globe className="h-4 w-4" />
                  <SelectValue>
                    {LANGUAGES.find((l) => l.code === language)?.flag}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Phone Badge */}
              <div className="flex items-center gap-1.5 text-sm bg-primary-foreground/10 px-2.5 py-1.5 rounded-lg">
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">{portalData?.phone}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      <main className="container mx-auto px-4 py-6">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto space-y-6"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="text-center py-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground font-medium">
                {language === 'TR' ? 'Hoş Geldiniz' : 'Welcome'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {portalData?.reservations?.[0]?.customer_name || (language === 'TR' ? 'Değerli Müşterimiz' : 'Valued Customer')}
            </h2>
          </motion.div>

          {/* Quick Support & Navigation Actions - 4 Shortcuts */}
          <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2">
            {/* Home */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-white/80 dark:bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate('/')}
              >
                <Home className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">
                  {language === 'TR' ? 'Anasayfa' : 'Home'}
                </span>
              </Button>
            </motion.div>
            
            {/* WhatsApp */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-green-50/80 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=` + encodeURIComponent(language === 'TR' ? 'Merhaba, destek almak istiyorum.' : 'Hello, I need support.'), '_blank')}
              >
                <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                  WhatsApp
                </span>
              </Button>
            </motion.div>
            
            {/* Emergency */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-red-50/80 dark:bg-red-950/30 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                onClick={() => window.open(`tel:${EMERGENCY_PHONE}`, '_self')}
              >
                <PhoneCall className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="text-xs font-medium text-red-700 dark:text-red-300">
                  {language === 'TR' ? 'Acil' : 'Call'}
                </span>
              </Button>
            </motion.div>
            
            {/* Security */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="outline" 
                className="h-auto py-3 w-full flex flex-col items-center gap-1 bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                onClick={() => navigate('/security-settings')}
              >
                <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {language === 'TR' ? 'Güvenlik' : 'Security'}
                </span>
              </Button>
            </motion.div>
          </motion.div>

          {/* Next Transfer Card - Show first upcoming reservation */}
          <AnimatePresence>
            {portalData?.reservations && portalData.reservations.length > 0 && (
              () => {
                const upcomingReservations = portalData.reservations.filter(
                  r => !['cancelled', 'completed'].includes(r.status)
                );
                if (upcomingReservations.length === 0) return null;
                
                const nextTransfer = upcomingReservations[0];
                return (
                  <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Card 
                      className="bg-gradient-to-r from-primary/15 to-primary/5 border-primary/20 cursor-pointer hover:shadow-lg transition-all backdrop-blur-sm"
                      onClick={() => {
                        const element = document.getElementById(`reservation-${nextTransfer.id}`);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              >
                                <Clock className="h-4 w-4 text-primary" />
                              </motion.div>
                              <span className="text-sm font-medium text-primary">
                                {language === 'TR' ? 'Yaklaşan Transferiniz' : 'Your Next Transfer'}
                              </span>
                              {nextTransfer.reservation_code && (
                                <Badge variant="outline" className="font-mono text-xs bg-primary/10 border-primary/30 shadow-sm">
                                  {nextTransfer.reservation_code}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-sm sm:text-base">
                                {new Date(nextTransfer.pickup_date).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US', { 
                                  weekday: 'long', 
                                  day: 'numeric', 
                                  month: 'long' 
                                })} • {nextTransfer.pickup_time}
                              </p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {nextTransfer.pickup.substring(0, 35)}{nextTransfer.pickup.length > 35 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <ChevronRight className="h-5 w-5 text-primary flex-shrink-0" />
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
            )()}
          </AnimatePresence>

          {/* New Reservation Card */}
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="cursor-pointer shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground border-0 overflow-hidden relative"
              onClick={() => navigate('/book')}
            >
              {/* Decorative Background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-foreground/10 to-transparent" />
              
              <CardContent className="p-5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="bg-primary-foreground/20 rounded-full p-3 shadow-inner"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Plus className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="font-bold text-lg">
                      {language === 'TR' ? 'Yeni Rezervasyon' : 'New Reservation'}
                    </p>
                    <p className="text-sm opacity-80">
                      {language === 'TR' ? 'Hemen transfer rezervasyonu yapın' : 'Book your transfer now'}
                    </p>
                  </div>
                </div>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Car className="h-10 w-10 opacity-70" />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('yourBookings')}</h2>
              <p className="text-muted-foreground">
                {t('viewAndManageBookings')}
              </p>
            </div>
          </motion.div>

          {/* Return Transfer Discount Banner */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-sm backdrop-blur-sm">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shadow-inner"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Percent className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <p className="font-semibold">{t('returnTransferDiscount')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('returnTransferDiscountDesc')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {portalData?.reservations.length === 0 ? (
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg border-border/50 backdrop-blur-sm">
                <CardContent className="py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <Car className="h-14 w-14 mx-auto mb-4 text-muted-foreground/50" />
                  </motion.div>
                  <h3 className="text-lg font-medium mb-2">{t('noBookingsYet')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t('createFirstBooking')}
                  </p>
                  <Button onClick={() => navigate("/book")} className="shadow-lg">{t('bookATransferPortal')}</Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="space-y-4">
              {portalData?.reservations.map((reservation, index) => (
                <motion.div
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                >
                  <Card id={`reservation-${reservation.id}`} className="scroll-mt-20 shadow-md hover:shadow-lg transition-all border-border/50 backdrop-blur-sm bg-white/80 dark:bg-card/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {reservation.reservation_code && (
                              <Badge variant="outline" className="font-mono shadow-sm">
                                {reservation.reservation_code}
                              </Badge>
                            )}
                            {getStatusBadge(reservation.status)}
                            {reservation.is_return_transfer && (
                              <Badge variant="secondary" className="gap-1 shadow-sm">
                                <Percent className="h-3 w-3" />
                                {t('returnLabel')}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">
                            {reservation.pickup} → {reservation.dropoff}
                          </CardTitle>
                        </div>
                        {reservation.price && (
                          <div className="text-right">
                            {reservation.discount_amount > 0 && (
                              <p className="text-sm text-muted-foreground line-through">
                                {reservation.price_currency === "EUR" ? "€" : reservation.price_currency === "USD" ? "$" : reservation.price_currency === "GBP" ? "£" : reservation.price_currency === "AED" ? "د.إ" : reservation.price_currency === "AUD" ? "A$" : "₺"}
                                {(reservation.price + reservation.discount_amount).toFixed(2)}
                              </p>
                            )}
                            <p className="text-xl font-bold text-primary">
                              {reservation.price_currency === "EUR" ? "€" : reservation.price_currency === "USD" ? "$" : reservation.price_currency === "GBP" ? "£" : reservation.price_currency === "AED" ? "د.إ" : reservation.price_currency === "AUD" ? "A$" : "₺"}
                              {reservation.price}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {format(new Date(reservation.pickup_date), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.pickup_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize">
                            {reservation.vehicle_type.replace(/-/g, " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{reservation.customer_name}</span>
                        </div>
                        {(reservation.luggage_count && reservation.luggage_count > 0) && (
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-orange-500" />
                            <span>{reservation.luggage_count} {t('luggage') || 'Valiz'}</span>
                          </div>
                        )}
                        {(reservation.baby_seat_count && reservation.baby_seat_count > 0) && (
                          <div className="flex items-center gap-2">
                            <Baby className="h-4 w-4 text-pink-500" />
                            <span>{reservation.baby_seat_count} {t('babySeat') || 'Bebek Koltuğu'}</span>
                          </div>
                        )}
                      </div>

                      {!reservation.is_return_transfer && 
                       reservation.status !== "cancelled" && 
                       reservation.status !== "completed" && (
                        <>
                          <Separator className="my-4" />
                          <div className="flex justify-end">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="shadow-sm"
                                onClick={() => handleCreateReturnTransfer(reservation)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('addReturnTransferDiscount')}
                              </Button>
                            </motion.div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Floating Chat Button */}
      {portalData?.conversation_id && (
        <AnimatePresence>
          {!showChat && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={() => setShowChat(true)}
              >
                <MessageCircle className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && portalData?.conversation_id && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-4 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-2rem)] bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Meet Transfer</h3>
                  <p className="text-xs opacity-80">{t('supportTeam') || 'Destek Ekibi'}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setShowChat(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">{t('noMessagesYet') || 'Henüz mesaj yok'}</p>
                  <p className="text-xs mt-1">{t('startConversation') || 'WhatsApp üzerinden sohbete başlayın'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.direction === "incoming" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm ${
                          msg.direction === "incoming"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="text-[10px] opacity-70 mt-1 text-right">
                          {format(new Date(msg.created_at), "HH:mm")}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Admin Typing Indicator */}
                  <AnimatePresence>
                    {adminTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="flex justify-start"
                      >
                        <div className="flex items-center gap-2 bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <span className="text-xs text-muted-foreground">{t('supportTyping') || 'Destek ekibi yazıyor'}</span>
                          <div className="flex gap-0.5">
                            <motion.span
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              className="w-1.5 h-1.5 bg-primary rounded-full"
                            />
                            <motion.span
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                              className="w-1.5 h-1.5 bg-primary rounded-full"
                            />
                            <motion.span
                              animate={{ y: [0, -3, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                              className="w-1.5 h-1.5 bg-primary rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t bg-background">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => handleTypingChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('typeMessage') || "Mesajınızı yazın..."}
                  className="min-h-[44px] max-h-[120px] resize-none rounded-xl text-sm"
                  rows={1}
                  disabled={sendingMessage}
                />
                <Button
                  size="icon"
                  className="h-11 w-11 rounded-full shrink-0"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                >
                  {sendingMessage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-2">
                {t('portalChatNote') || "Mesajlarınız destek ekibimize iletilecektir"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
