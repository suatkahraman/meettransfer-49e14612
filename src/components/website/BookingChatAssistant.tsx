import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, X, Bot, User, Loader2, ArrowRight, Mic, Square, Volume2, VolumeX, AlertCircle, Settings2, ChevronDown, Trash2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface BookingData {
  pickup?: string | null;
  dropoff?: string | null;
  date?: string | null;
  time?: string | null;
  passengers?: number | null;
  vehicleType?: string | null;
  estimatedPrice?: number | null;
  currency?: string | null;
  isComplete?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  bookingData?: BookingData | null;
}

interface BookingChatAssistantProps {
  onApplyBooking?: (data: BookingData) => void;
}

// Check if Speech Recognition is supported
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Voice recording hook using Web Speech API with iOS Safari support
function useVoiceRecorder(onTranscription: (text: string) => void, language: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSupported = isSpeechRecognitionSupported();
  const transcriptRef = useRef<string>('');

  // Detect iOS Safari
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Map language codes to BCP-47 format for Web Speech API
  const getLanguageCode = useCallback((lang: string): string => {
    const languageMap: Record<string, string> = {
      'TR': 'tr-TR',
      'EN': 'en-US',
      'DE': 'de-DE',
      'FR': 'fr-FR',
      'RU': 'ru-RU',
      'AR': 'ar-SA',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'UK': 'uk-UA',
      'JA': 'ja-JP'
    };
    return languageMap[lang] || 'en-US';
  }, []);

  const dismissWarning = useCallback(() => {
    setShowBrowserWarning(false);
  }, []);

  // Request microphone permission explicitly for iOS
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      // Request audio permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setShowBrowserWarning(true);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      setShowBrowserWarning(true);
      return;
    }

    // For iOS, request microphone permission first
    if (isIOS() && !permissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        return;
      }
    }

    try {
      // Stop any existing recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore abort errors
        }
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = getLanguageCode(language);
      // For iOS, use interim results for better UX
      recognition.interimResults = isIOS();
      // Don't use continuous on iOS - it can cause issues
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      // Reset transcript
      transcriptRef.current = '';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
        setIsProcessing(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Use final transcript if available, otherwise interim
        const transcript = finalTranscript || interimTranscript;
        
        if (transcript) {
          transcriptRef.current = transcript;
          console.log('Transcript:', transcript, 'isFinal:', !!finalTranscript);
          
          // For non-iOS or final results, trigger transcription immediately
          if (finalTranscript) {
            setIsProcessing(true);
            onTranscription(finalTranscript);
            setIsProcessing(false);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        
        // Handle specific iOS errors
        if (event.error === 'not-allowed') {
          setShowBrowserWarning(true);
          setPermissionGranted(false);
        }
        
        // Don't set isRecording to false for "no-speech" on iOS
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        }
        setIsProcessing(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // On iOS, if we have an interim transcript but no final, use it
        if (isIOS() && transcriptRef.current && !isProcessing) {
          setIsProcessing(true);
          onTranscription(transcriptRef.current);
          setIsProcessing(false);
        }
        
        setIsRecording(false);
      };

      recognition.start();
      console.log('Speech recognition start() called');
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsRecording(false);
    }
  }, [language, getLanguageCode, onTranscription, isIOS, permissionGranted, requestMicrophonePermission, isProcessing]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording, isRecording:', isRecording);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    setIsRecording(false);
  }, [isRecording]);

  return { isRecording, isProcessing, startRecording, stopRecording, isSupported, showBrowserWarning, dismissWarning };
}

// Voice option type
interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
}

// Text-to-Speech hook using Web Speech API (no API key required)
function useTextToSpeech(language: string) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Map language codes to BCP-47 format for Web Speech API
  const getLanguageCode = useCallback((lang: string): string => {
    const languageMap: Record<string, string> = {
      'TR': 'tr-TR',
      'EN': 'en-US',
      'DE': 'de-DE',
      'FR': 'fr-FR',
      'RU': 'ru-RU',
      'AR': 'ar-SA',
      'ES': 'es-ES',
      'IT': 'it-IT',
      'UK': 'uk-UA',
      'JA': 'ja-JP'
    };
    return languageMap[lang] || 'en-US';
  }, []);

  // Detect gender from voice name
  const detectGender = useCallback((voice: SpeechSynthesisVoice): 'male' | 'female' | 'neutral' => {
    const nameLower = voice.name.toLowerCase();
    const femaleKeywords = ['female', 'woman', 'girl', 'kadın', 'kız', 'femme', 'mujer', 'donna', 'frau', 'женщина', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'fiona', 'tessa', 'veena', 'yelda', 'filiz'];
    const maleKeywords = ['male', 'man', 'boy', 'erkek', 'homme', 'hombre', 'uomo', 'mann', 'мужчина', 'david', 'mark', 'alex', 'daniel', 'james', 'thomas', 'tolga', 'ahmet'];
    
    if (femaleKeywords.some(kw => nameLower.includes(kw))) return 'female';
    if (maleKeywords.some(kw => nameLower.includes(kw))) return 'male';
    return 'neutral';
  }, []);

  // Load and filter voices for current language
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const voices = window.speechSynthesis.getVoices();
    const langCode = getLanguageCode(language);
    const langPrefix = langCode.split('-')[0];
    
    const filteredVoices: VoiceOption[] = voices
      .filter(voice => voice.lang.startsWith(langPrefix))
      .map(voice => ({
        id: voice.voiceURI,
        name: voice.name.replace(/Microsoft |Google |Apple /, '').split(' ')[0],
        lang: voice.lang,
        gender: detectGender(voice)
      }));
    
    // Add fallback voices if none found for the language
    if (filteredVoices.length === 0) {
      const defaultVoices = voices.slice(0, 3).map(voice => ({
        id: voice.voiceURI,
        name: voice.name.replace(/Microsoft |Google |Apple /, '').split(' ')[0],
        lang: voice.lang,
        gender: detectGender(voice)
      }));
      setAvailableVoices(defaultVoices);
    } else {
      setAvailableVoices(filteredVoices);
    }
    
    // Auto-select first voice if none selected
    if (!selectedVoiceId && filteredVoices.length > 0) {
      setSelectedVoiceId(filteredVoices[0].id);
    }
  }, [language, getLanguageCode, detectGender, selectedVoiceId]);

  const speak = useCallback((text: string) => {
    if (!isVoiceEnabled || !text || typeof window === 'undefined') return;

    // Check for browser support
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove emojis and special characters)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport & map symbols
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // dingbats
      .replace(/👋|🎤|📍|📅|👥|🚗|💰/g, '')  // specific emojis
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    utterance.lang = getLanguageCode(language);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Use selected voice if available
    const voices = window.speechSynthesis.getVoices();
    if (selectedVoiceId) {
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceId);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      // Fallback to any matching voice
      const langCode = getLanguageCode(language);
      const matchingVoice = voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [language, getLanguageCode, isVoiceEnabled, selectedVoiceId, speechRate]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => {
      if (prev) {
        // If turning off, stop any current speech
        stopSpeaking();
      }
      return !prev;
    });
  }, [stopSpeaking]);

  const selectVoice = useCallback((voiceId: string) => {
    setSelectedVoiceId(voiceId);
  }, []);

  const changeRate = useCallback((rate: number) => {
    setSpeechRate(rate);
  }, []);

  // Load voices on mount and language change
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [loadVoices]);

  return { 
    isSpeaking, 
    isVoiceEnabled, 
    speak, 
    stopSpeaking, 
    toggleVoice, 
    availableVoices, 
    selectedVoiceId, 
    selectVoice,
    speechRate,
    changeRate
  };
}

const placeholderMessages: Record<string, string> = {
  EN: "e.g., 'Tomorrow at 3pm from Istanbul Airport to Taksim for 4 people'",
  TR: "örn: 'Yarın 15:00'te İstanbul Havalimanı'ndan Taksim'e 4 kişi'",
  DE: "z.B. 'Morgen um 15 Uhr vom Flughafen Istanbul nach Taksim für 4 Personen'",
  FR: "ex: 'Demain à 15h de l'aéroport d'Istanbul à Taksim pour 4 personnes'",
  RU: "напр: 'Завтра в 15:00 из аэропорта Стамбула в Таксим на 4 человека'",
  AR: "مثال: 'غداً الساعة 3 عصراً من مطار إسطنبول إلى تقسيم لـ 4 أشخاص'",
  ES: "ej: 'Mañana a las 15h del aeropuerto de Estambul a Taksim para 4 personas'",
  IT: "es: 'Domani alle 15 dall'aeroporto di Istanbul a Taksim per 4 persone'",
  UK: "напр: 'Завтра о 15:00 з аеропорту Стамбула до Таксим на 4 особи'",
  JA: "例: '明日15時にイスタンブール空港からタクシムへ4人で'"
};

const welcomeMessages: Record<string, string> = {
  EN: "Hi! 👋 I'm your AI booking assistant. Tell me where and when you need a transfer, and I'll help you book it instantly! You can also use the 🎤 microphone to speak.",
  TR: "Merhaba! 👋 Ben AI rezervasyon asistanınızım. Nereye ve ne zaman transfer istediğinizi söyleyin, hemen sizin için ayarlayayım! 🎤 Mikrofon ile de konuşabilirsiniz.",
  DE: "Hallo! 👋 Ich bin Ihr KI-Buchungsassistent. Sagen Sie mir, wohin und wann Sie einen Transfer benötigen! Sie können auch 🎤 das Mikrofon verwenden.",
  FR: "Bonjour! 👋 Je suis votre assistant de réservation IA. Dites-moi où et quand vous avez besoin d'un transfert! Vous pouvez aussi utiliser le 🎤 microphone.",
  RU: "Привет! 👋 Я ваш AI-ассистент по бронированию. Скажите, куда и когда вам нужен трансфер! Вы также можете использовать 🎤 микрофон.",
  AR: "مرحباً! 👋 أنا مساعد الحجز الذكي. أخبرني أين ومتى تحتاج النقل! يمكنك أيضاً استخدام 🎤 الميكروفون.",
  ES: "¡Hola! 👋 Soy tu asistente de reservas IA. ¡Dime dónde y cuándo necesitas un transfer! También puedes usar el 🎤 micrófono.",
  IT: "Ciao! 👋 Sono il tuo assistente AI per le prenotazioni. Dimmi dove e quando hai bisogno di un transfer! Puoi anche usare il 🎤 microfono.",
  UK: "Привіт! 👋 Я ваш AI-асистент з бронювання. Скажіть, куди і коли вам потрібен трансфер! Ви також можете використовувати 🎤 мікрофон.",
  JA: "こんにちは！👋 AI予約アシスタントです。どこへ、いつ送迎が必要か教えてください！🎤 マイクも使えます。"
};

// Generate or get visitor ID for conversation persistence
function getVisitorId(): string {
  const STORAGE_KEY = 'meet_transfer_visitor_id';
  let visitorId = localStorage.getItem(STORAGE_KEY);
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(STORAGE_KEY, visitorId);
  }
  return visitorId;
}

// Get conversation storage key for a visitor
function getConversationKey(visitorId: string): string {
  return `meet_transfer_chat_${visitorId}`;
}

export default function BookingChatAssistant({ onApplyBooking }: BookingChatAssistantProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId] = useState(() => getVisitorId());
  const [bookingCreated, setBookingCreated] = useState<{ id: string; token: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasLoadedRef = useRef(false);
  const hasHandledAIParamRef = useRef(false);

  // Voice recording
  const handleTranscription = useCallback((text: string) => {
    setInput(text);
  }, []);
  
  const { isRecording, isProcessing, startRecording, stopRecording, isSupported: isSpeechSupported, showBrowserWarning, dismissWarning } = useVoiceRecorder(
    handleTranscription,
    language
  );

  // Text-to-Speech
  const { isSpeaking, isVoiceEnabled, speak, stopSpeaking, toggleVoice, availableVoices, selectedVoiceId, selectVoice, speechRate, changeRate } = useTextToSpeech(language);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  // Ref to store pending auto-send message
  const pendingAutoSendRef = useRef<string | null>(null);

  // Handle AI parameter from URL - auto-open chat and auto-send route message
  useEffect(() => {
    if (hasHandledAIParamRef.current) return;
    
    const aiParam = searchParams.get('ai');
    const routeParam = searchParams.get('route');
    
    if (aiParam === 'true') {
      hasHandledAIParamRef.current = true;
      
      // Open the chat
      setIsOpen(true);
      
      // Clear the URL parameters
      searchParams.delete('ai');
      searchParams.delete('route');
      setSearchParams(searchParams, { replace: true });
      
      // If there's a route parameter, store it for auto-send after chat opens
      if (routeParam) {
        const routeQuestion = language === 'TR' 
          ? `${routeParam} rotası için fiyat ve detay almak istiyorum.`
          : `I'd like to get price and details for the ${routeParam} route.`;
        
        pendingAutoSendRef.current = routeQuestion;
      }
    }
  }, [searchParams, setSearchParams, language]);

  // Load saved conversation on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    
    try {
      const savedConversation = localStorage.getItem(getConversationKey(visitorId));
      if (savedConversation) {
        const parsed = JSON.parse(savedConversation) as Message[];
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load conversation:', e);
    }
  }, [visitorId]);

  // Save conversation whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(getConversationKey(visitorId), JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save conversation:', e);
      }
    }
  }, [messages, visitorId]);

  // Add welcome message when opened and no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[language] || welcomeMessages.EN
      }]);
    }
  }, [isOpen, language, messages.length]);

  // Auto-send pending message after chat opens and welcome message is added
  useEffect(() => {
    if (isOpen && pendingAutoSendRef.current && messages.length > 0) {
      const messageToSend = pendingAutoSendRef.current;
      pendingAutoSendRef.current = null;
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setInput(messageToSend);
        // Trigger send after setting input
        setTimeout(() => {
          const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
          if (submitButton) {
            submitButton.click();
          }
        }, 100);
      }, 500);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    // Scroll to bottom when new messages added
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for context (exclude welcome message)
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke("booking-assistant", {
        body: { 
          message: userMessage.content, 
          language,
          conversationHistory,
          visitorId
        }
      });

      if (error) throw error;

      console.log("Booking assistant response:", data);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanResponseForDisplay(data.response),
        bookingData: data.bookingData
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the assistant response
      if (isVoiceEnabled) {
        speak(assistantMessage.content);
      }

      // If booking was created, show success and navigate to confirm page
      console.log("Checking booking:", { quickBookingId: data.quickBookingId, confirmationToken: data.confirmationToken });
      
      if (data.quickBookingId && data.confirmationToken) {
        console.log("Booking created! Navigating to confirmation page...");
        setBookingCreated({ id: data.quickBookingId, token: data.confirmationToken });
        
        // Show price summary message
        const priceInfo = data.bookingData?.estimatedPrice 
          ? `${data.bookingData.currency === "TRY" ? "₺" : data.bookingData.currency === "USD" ? "$" : "€"}${data.bookingData.estimatedPrice}` 
          : "";
        
        // Immediately add success message and then navigate
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: language === "TR" 
            ? `✅ Rezervasyonunuz oluşturuldu! ${priceInfo ? `Fiyat: ${priceInfo}` : ""}\n\nBilgilerinizi tamamlamak için onay sayfasına yönlendiriliyorsunuz...`
            : `✅ Your reservation is ready! ${priceInfo ? `Price: ${priceInfo}` : ""}\n\nRedirecting you to the confirmation page...`
        };
        setMessages(prev => [...prev, successMessage]);
        
        // Close chat and redirect after short delay
        setTimeout(() => {
          setIsOpen(false);
          navigate(`/quick-booking-confirm?token=${data.confirmationToken}&new=true`);
        }, 1200);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "TR" 
          ? "Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin."
          : "Sorry, an error occurred. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanResponseForDisplay = (response: string): string => {
    // Remove the booking JSON block from display
    return response.replace(/```booking[\s\S]*?```/g, '').replace(/```json[\s\S]*?```/g, '').trim();
  };

  const handleApplyBooking = (data: BookingData) => {
    if (onApplyBooking) {
      onApplyBooking(data);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    try {
      localStorage.removeItem(getConversationKey(visitorId));
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessages[language] || welcomeMessages.EN
      }]);
    } catch (e) {
      console.error('Failed to clear conversation:', e);
    }
  };

  return (
    <>
      {/* Floating Toggle Button - Mobile - Always visible when chat closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            data-chat-trigger
            className="fixed bottom-20 right-4 z-[9999] md:hidden flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground rounded-full shadow-2xl border border-white/20"
            style={{ 
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(var(--primary), 0.3)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <span className="font-semibold text-sm">AI</span>
            {/* Pulse effect for visibility */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ zIndex: -1 }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modern Chat Panel */}
      <motion.div 
        layout
        initial={false}
        animate={{
          height: isOpen ? "auto" : "auto",
          scale: isOpen ? 1 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-br from-card via-card to-muted/30",
          "shadow-2xl border border-border/50",
          "backdrop-blur-xl",
          // Mobile: max height when open, not full screen
          isOpen 
            ? "max-h-[70vh] md:max-h-none md:h-[500px] rounded-3xl" 
            : "h-auto rounded-3xl"
        )}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-accent/20 to-primary/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          data-chat-trigger
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          className="relative w-full flex items-center justify-between p-4 md:p-5 transition-all z-10"
        >
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Animated Avatar */}
            <div className="relative flex-shrink-0">
              <motion.div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg"
                whileHover={{ rotate: 5 }}
              >
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
              </motion.div>
              {/* Online indicator */}
              <span className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-card shadow-md" />
            </div>
            
            <div className="text-left min-w-0 flex-1">
              <h3 className="font-bold text-base md:text-lg text-foreground flex items-center gap-2">
                <span className="truncate">{t("aiAssistant") || "AI Booking Assistant"}</span>
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] md:text-[10px] px-2 py-0.5 md:px-2.5 md:py-1 bg-gradient-to-r from-accent to-accent/80 rounded-full text-accent-foreground font-bold uppercase tracking-wide shadow-sm flex-shrink-0"
                >
                  {t("new") || "NEW"}
                </motion.span>
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex-shrink-0"
                >
                  <Mic className="h-3 w-3 md:h-3.5 md:w-3.5 text-primary" />
                </motion.div>
                <span className="truncate">{t("aiAssistantHint") || "Voice & text in any language"}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
            {/* Voice Settings Popover */}
            {isOpen && isVoiceEnabled && (
              <Popover open={showVoiceSettings} onOpenChange={setShowVoiceSettings}>
                <PopoverTrigger asChild>
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-muted/50 flex items-center justify-center transition-all hover:bg-primary/10"
                    title={language === "TR" ? "Ses Ayarları" : "Voice Settings"}
                  >
                    <Settings2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-3" 
                  align="end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-4">
                    {/* Voice Selection */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {language === "TR" ? "Ses Tonu" : "Voice"}
                      </label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {availableVoices.length > 0 ? (
                          availableVoices.map((voice) => (
                            <button
                              key={voice.id}
                              onClick={() => selectVoice(voice.id)}
                              className={cn(
                                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all text-left",
                                selectedVoiceId === voice.id
                                  ? "bg-primary/20 text-primary"
                                  : "hover:bg-muted"
                              )}
                            >
                              <span className="text-lg">
                                {voice.gender === 'female' ? '👩' : voice.gender === 'male' ? '👨' : '🤖'}
                              </span>
                              <span className="flex-1 truncate">{voice.name}</span>
                              {selectedVoiceId === voice.id && (
                                <span className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground px-3 py-2">
                            {language === "TR" ? "Bu dil için ses bulunamadı" : "No voices found for this language"}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Speech Rate */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">
                        {language === "TR" ? "Konuşma Hızı" : "Speech Rate"}
                      </label>
                      <div className="flex items-center gap-2">
                        {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => changeRate(rate)}
                            className={cn(
                              "flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all",
                              speechRate === rate
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            )}
                          >
                            {rate === 0.75 ? '0.75x' : rate === 1.0 ? '1x' : rate === 1.25 ? '1.25x' : '1.5x'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Clear Conversation Button */}
            {isOpen && messages.length > 1 && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  clearConversation();
                }}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-muted/50 flex items-center justify-center transition-all hover:bg-destructive/20 hover:text-destructive"
                title={language === "TR" ? "Sohbeti Temizle" : "Clear Chat"}
              >
                <Trash2 className="h-4 w-4 md:h-5 md:w-5" />
              </motion.button>
            )}

            {/* Voice Toggle Button */}
            {isOpen && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleVoice();
                }}
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center transition-all",
                  isVoiceEnabled 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted/50 text-muted-foreground"
                )}
                title={isVoiceEnabled ? "Sesi Kapat" : "Sesi Aç"}
              >
                {isSpeaking ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                  >
                    <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
                  </motion.div>
                ) : isVoiceEnabled ? (
                  <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
                ) : (
                  <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
                )}
              </motion.button>
            )}
            
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-muted/50 flex items-center justify-center"
            >
              {isOpen ? (
                <X className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              ) : (
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              )}
            </motion.div>
          </div>
        </motion.button>

        {/* Chat Content */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                height: "auto", 
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                  mass: 0.8,
                  opacity: { duration: 0.2 },
                  height: { duration: 0.4 }
                }
              }}
              exit={{ 
                opacity: 0, 
                height: 0, 
                y: -10,
                transition: {
                  type: "spring",
                  stiffness: 500,
                  damping: 40,
                  opacity: { duration: 0.15 },
                  height: { duration: 0.3 }
                }
              }}
              className="relative flex flex-col z-10 overflow-hidden h-[calc(70vh-88px)] md:h-[calc(500px-88px)]"
            >
              {/* Messages Area */}
              <ScrollArea className="flex-1 px-4 py-4 md:px-5">
                <div className="space-y-5">
                  {messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex gap-3",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <motion.div 
                          className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md"
                          whileHover={{ scale: 1.1, rotate: 5 }}
                        >
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </motion.div>
                      )}
                      
                      <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[80%]">
                        <div className="flex items-start gap-2">
                          <motion.div
                            whileHover={{ scale: 1.01 }}
                            className={cn(
                              "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm flex-1",
                              msg.role === "user"
                                ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg"
                                : "bg-gradient-to-br from-muted to-muted/80 text-foreground rounded-bl-lg border border-border/30"
                            )}
                          >
                            {msg.content}
                          </motion.div>
                          
                          {/* Speak button for assistant messages */}
                          {msg.role === "assistant" && msg.id !== "welcome" && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                if (isSpeaking) {
                                  stopSpeaking();
                                } else {
                                  speak(msg.content);
                                }
                              }}
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                isSpeaking 
                                  ? "bg-primary/20 text-primary" 
                                  : "bg-muted/50 text-muted-foreground hover:text-primary"
                              )}
                              title={isSpeaking ? "Durdur" : "Sesli oku"}
                            >
                              {isSpeaking ? (
                                <Square className="h-3.5 w-3.5" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </motion.button>
                          )}
                        </div>
                        
                        {/* Booking Action Buttons */}
                        {msg.bookingData?.isComplete && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2"
                          >
                            {/* Price Display */}
                            {msg.bookingData.estimatedPrice && (
                              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">💰</span>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      {language === "TR" ? "Fiyat" : "Price"}
                                    </p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                      {msg.bookingData.currency === "TRY" ? "₺" : 
                                       msg.bookingData.currency === "USD" ? "$" : "€"}
                                      {msg.bookingData.estimatedPrice}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Confirm Booking Button */}
                            {bookingCreated?.token ? (
                              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">
                                  {language === "TR" ? "Yönlendiriliyor..." : "Redirecting..."}
                                </span>
                              </div>
                            ) : (
                              <Button
                                size="lg"
                                onClick={() => {
                                  if (bookingCreated?.token) {
                                    navigate(`/quick-booking-confirm?token=${bookingCreated.token}&new=true`);
                                  }
                                }}
                                disabled={!bookingCreated}
                                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 text-base py-6"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                                {language === "TR" ? "Rezervasyonu Onayla" : "Confirm Booking"}
                              </Button>
                            )}
                            
                            {/* Apply to Form Button (secondary) */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApplyBooking(msg.bookingData!)}
                              className="w-full gap-2 rounded-xl"
                            >
                              <ArrowRight className="h-4 w-4" />
                              {t("applyToForm") || "Apply to Form"}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                      
                      {msg.role === "user" && (
                        <motion.div 
                          className="w-8 h-8 rounded-xl bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center flex-shrink-0 border border-border/30"
                          whileHover={{ scale: 1.1, rotate: -5 }}
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Loading State */}
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-gradient-to-br from-muted to-muted/80 rounded-2xl rounded-bl-lg px-5 py-4 border border-border/30">
                        <div className="flex gap-1.5">
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                          />
                          <motion.span 
                            className="w-2.5 h-2.5 bg-primary/60 rounded-full"
                            animate={{ y: [-3, 3, -3] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 md:p-4 border-t border-border/30 bg-gradient-to-t from-muted/50 to-transparent" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
                {/* Browser Support Warning */}
                <AnimatePresence>
                  {showBrowserWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3"
                    >
                      <Alert variant="destructive" className="relative py-2 px-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs pr-6">
                          {language === "TR" 
                            ? "Tarayıcınız ses tanıma özelliğini desteklemiyor. Chrome, Edge veya Safari kullanın." 
                            : "Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari."}
                        </AlertDescription>
                        <button 
                          onClick={dismissWarning}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-destructive-foreground/70 hover:text-destructive-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Recording Indicator */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-3 flex items-center justify-center gap-2 text-sm text-destructive font-medium"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-3 h-3 bg-destructive rounded-full"
                      />
                      {language === "TR" ? "Dinleniyor... Durdurmak için tekrar tıklayın" : "Listening... Click again to stop"}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex gap-2">
                  {/* Voice Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isProcessing}
                      size="icon"
                      variant="outline"
                      className={cn(
                        "h-11 w-11 md:h-12 md:w-12 rounded-xl border-2 transition-all relative touch-manipulation",
                        isRecording 
                          ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" 
                          : !isSpeechSupported
                            ? "border-muted text-muted-foreground/50 cursor-not-allowed"
                            : "border-border hover:border-primary hover:bg-primary/5"
                      )}
                      title={
                        !isSpeechSupported 
                          ? (language === "TR" ? "Tarayıcı desteklemiyor" : "Browser not supported")
                          : isRecording 
                            ? "Stop Recording" 
                            : "Voice Input"
                      }
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-5 w-5 fill-current" />
                      ) : (
                        <>
                          <Mic className="h-5 w-5" />
                          {!isSpeechSupported && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                              <X className="h-2.5 w-2.5 text-destructive-foreground" />
                            </span>
                          )}
                        </>
                      )}
                    </Button>
                  </motion.div>
                  
                  {/* Text Input */}
                  <div className="relative flex-1">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isRecording 
                        ? (language === "TR" ? "🎤 Dinliyorum..." : "🎤 Listening...") 
                        : (placeholderMessages[language] || placeholderMessages.EN)
                      }
                      disabled={isLoading || isRecording}
                      className="h-11 md:h-12 pr-4 rounded-xl bg-background border-2 border-border focus:border-primary transition-all placeholder:text-muted-foreground/60 text-base touch-manipulation"
                      style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
                    />
                  </div>
                  
                  {/* Send Button */}
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      data-chat-submit
                      className={cn(
                        "h-11 w-11 md:h-12 md:w-12 rounded-xl transition-all touch-manipulation",
                        input.trim() 
                          ? "bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl" 
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
