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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  defaultOpen?: boolean;
  mobileFloating?: boolean;
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

export default function BookingChatAssistant({ onApplyBooking, defaultOpen = false, mobileFloating = false }: BookingChatAssistantProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(defaultOpen);
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

  // Allow other parts of the UI to open/prefill the chat (AI shortcut)
  useEffect(() => {
    const handler = (event: Event) => {
      const e = event as CustomEvent<{ message?: string }>;
      const nextMessage = e.detail?.message;

      setIsOpen(true);
      if (typeof nextMessage === "string") {
        setInput(nextMessage);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };

    window.addEventListener("booking-ai-open", handler as EventListener);
    return () => window.removeEventListener("booking-ai-open", handler as EventListener);
  }, []);

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

  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

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
    setIsTyping(true);
    setStreamingContent("");

    try {
      // Build conversation history for context (exclude welcome message)
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      // Use streaming API
      const streamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/booking-assistant`;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(publishableKey
            ? { Authorization: `Bearer ${publishableKey}`, apikey: publishableKey }
            : {}),
        },
        body: JSON.stringify({
          message: userMessage.content,
          language,
          conversationHistory,
          visitorId,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(cleanResponseForDisplay(fullContent));
            }
          } catch {
            // JSON chunk split across buffers: put it back and wait for more
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush for remaining buffered line (best-effort)
      if (textBuffer.trim().startsWith("data: ")) {
        const jsonStr = textBuffer.trim().slice(6).trim();
        if (jsonStr !== "[DONE]") {
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamingContent(cleanResponseForDisplay(fullContent));
            }
          } catch {
            // ignore leftovers
          }
        }
      }

      setIsTyping(false);
      setStreamingContent("");

      // Parse booking data from the complete response
      const bookingData = extractBookingDataFromResponse(fullContent);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanResponseForDisplay(fullContent),
        bookingData
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the assistant response
      if (isVoiceEnabled) {
        speak(assistantMessage.content);
      }

      // If booking is complete, create booking and navigate
      if (bookingData?.isComplete) {
        console.log("Complete booking detected, creating booking...");
        
        // Make a non-streaming call to actually create the booking
        const { data: bookingResult, error: bookingError } = await supabase.functions.invoke("booking-assistant", {
          body: { 
            message: userMessage.content, 
            language,
            conversationHistory,
            visitorId,
            stream: false
          }
        });

        if (!bookingError && bookingResult?.quickBookingId && bookingResult?.confirmationToken) {
          console.log("Booking created! Navigating to confirmation page...");
          setBookingCreated({ id: bookingResult.quickBookingId, token: bookingResult.confirmationToken });
          
          const priceInfo = bookingData?.estimatedPrice 
            ? `${bookingData.currency === "TRY" ? "₺" : bookingData.currency === "USD" ? "$" : "€"}${bookingData.estimatedPrice}` 
            : "";
          
          const successMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: language === "TR" 
              ? `✅ Rezervasyonunuz oluşturuldu! ${priceInfo ? `Fiyat: ${priceInfo}` : ""}\n\nBilgilerinizi tamamlamak için onay sayfasına yönlendiriliyorsunuz...`
              : `✅ Your reservation is ready! ${priceInfo ? `Price: ${priceInfo}` : ""}\n\nRedirecting you to the confirmation page...`
          };
          setMessages(prev => [...prev, successMessage]);
          
          setTimeout(() => {
            setIsOpen(false);
            navigate(`/quick-booking-confirm?token=${bookingResult.confirmationToken}&new=true`);
          }, 1200);
        }
      }

    } catch (error) {
      console.error("Chat error:", error);
      setIsTyping(false);
      setStreamingContent("");
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

  const extractBookingDataFromResponse = (response: string): BookingData | null => {
    try {
      const bookingMatch = response.match(/```booking\s*([\s\S]*?)```/);
      if (bookingMatch) {
        return JSON.parse(bookingMatch[1].trim());
      }
      
      const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.pickup !== undefined || parsed.dropoff !== undefined) {
          return parsed;
        }
      }
      
      return null;
    } catch (e) {
      console.error("Failed to parse booking data:", e);
      return null;
    }
  };

  const cleanResponseForDisplay = (response: string): string => {
    // Remove the booking JSON block from display
    return response.replace(/```booking[\s\S]*?```/g, '').replace(/```json[\s\S]*?```/g, '').trim();
  };

  const markdownComponents = {
    p: ({ children }: any) => <p className="m-0 whitespace-pre-wrap">{children}</p>,
    ul: ({ children }: any) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="m-0">{children}</li>,
    strong: ({ children }: any) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-primary underline underline-offset-4"
      >
        {children}
      </a>
    ),
    code: ({ children }: any) => (
      <code className="font-mono text-xs px-1 py-0.5 rounded bg-muted">{children}</code>
    ),
    pre: ({ children }: any) => (
      <pre className="font-mono text-xs p-3 rounded bg-muted overflow-x-auto">{children}</pre>
    ),
  } as const;

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

  // Mobile floating mode - only show floating button and panel
  if (mobileFloating) {
    return (
      <>
        {/* Mobile Floating Toggle Button */}
        <AnimatePresence>
          {!isOpen && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              data-chat-trigger
              className="fixed bottom-20 right-4 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full shadow-lg"
            >
              <Sparkles className="h-4 w-4" />
              <span className="font-semibold text-sm">AI</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile Floating Panel - Full screen overlay for better mobile UX */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              className="fixed inset-x-0 bottom-0 z-[9999] bg-card rounded-t-3xl shadow-2xl border-t border-border flex flex-col"
              style={{ 
                height: 'min(60vh, 500px)'
              }}
            >
              {/* Drag Handle - Swipe indicator */}
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'none' }}
              >
                <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
              </div>
              
              {/* Mobile Header - Compact */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">
                    {language === "TR" ? "AI Asistan" : "AI Assistant"}
                  </span>
                  <span className="px-1.5 py-0.5 bg-primary/80 text-primary-foreground text-[8px] font-bold rounded">
                    NEW
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearConversation}
                    className="h-7 w-7 rounded-full"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-full"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Messages - Flexible scroll area */}
              <ScrollArea className="flex-1 min-h-0 overflow-y-auto pb-20">
                <div className="p-3 space-y-2.5">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="h-2.5 w-2.5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {cleanResponseForDisplay(msg.content)}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                        
                        {/* Booking Card for Mobile - Compact */}
                        {msg.bookingData && msg.bookingData.estimatedPrice && (
                          <div className="mt-2 p-2 bg-background rounded-lg border border-border">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] text-muted-foreground">
                                {language === "TR" ? "Fiyat" : "Price"}
                              </span>
                              <span className="font-bold text-primary text-sm">
                                {msg.bookingData.currency === "TRY" ? "₺" : "€"}
                                {msg.bookingData.estimatedPrice}
                              </span>
                            </div>
                            {onApplyBooking && (
                              <Button
                                size="sm"
                                onClick={() => handleApplyBooking(msg.bookingData!)}
                                className="w-full mt-1.5 h-7 text-xs"
                              >
                                {language === "TR" ? "Forma Uygula" : "Apply"}
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-2.5 w-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl px-3 py-2">
                        <div className="flex gap-1">
                          <motion.span 
                            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          />
                          <motion.span 
                            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                          />
                          <motion.span 
                            className="w-1.5 h-1.5 bg-primary/60 rounded-full"
                            animate={{ y: [-2, 2, -2] }}
                            transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Mobile Input - Sticky at bottom */}
              <div 
                className="shrink-0 p-3 border-t border-border bg-card mt-auto"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
              >
                {/* Recording indicator */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-2 text-xs text-destructive font-medium mb-2">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                      className="w-2 h-2 bg-destructive rounded-full"
                    />
                    {language === "TR" ? "Dinleniyor..." : "Listening..."}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isProcessing}
                    size="icon"
                    variant="outline"
                    className={cn(
                      "h-11 w-11 rounded-xl shrink-0 touch-manipulation",
                      isRecording && "bg-destructive/10 border-destructive text-destructive"
                    )}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isRecording ? (
                      <Square className="h-4 w-4 fill-current" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      // Scroll input into view when keyboard opens
                      setTimeout(() => {
                        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 300);
                    }}
                    placeholder={language === "TR" ? "Mesaj yazın..." : "Type message..."}
                    disabled={isLoading || isRecording}
                    className="h-11 rounded-xl text-sm flex-1 touch-manipulation"
                    style={{ fontSize: '16px' }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className={cn(
                      "h-11 w-11 rounded-xl shrink-0 touch-manipulation",
                      input.trim() ? "bg-primary" : "bg-muted"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {/* Floating Toggle Button - Desktop - Always visible when chat closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsOpen(true)}
            data-chat-trigger
            className="hidden md:flex fixed bottom-6 right-6 z-[9999] items-center gap-2 px-4 py-3 bg-card text-foreground rounded-full shadow-lg border border-border/60"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm">AI</span>
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
          "bg-card",
          "shadow-xl border border-border/50",
          "backdrop-blur-sm",
          isOpen 
            ? "h-[500px] rounded-3xl" 
            : "h-auto rounded-3xl"
        )}
      >
        {/* Header */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          data-chat-trigger
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          className="relative w-full flex items-center justify-between p-4 md:p-5 transition-all z-10"
        >
          <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <motion.div 
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-muted border border-border/60 flex items-center justify-center shadow-sm"
                whileHover={{ rotate: 2 }}
              >
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
              </motion.div>
              {/* Online indicator */}
              <span className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-primary/40 rounded-full border-2 border-card shadow-sm" />
            </div>
            
            <div className="text-left min-w-0 flex-1">
              <h3 className="font-bold text-base md:text-lg text-foreground flex items-center gap-2">
                <span className="truncate">{t("aiAssistant") || "AI Booking Assistant"}</span>
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] md:text-[10px] px-2 py-0.5 md:px-2.5 md:py-1 bg-muted rounded-full text-muted-foreground font-bold uppercase tracking-wide shadow-sm flex-shrink-0"
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
                          className="w-8 h-8 rounded-xl bg-muted border border-border/60 flex items-center justify-center flex-shrink-0 shadow-sm"
                          whileHover={{ scale: 1.05, rotate: 2 }}
                        >
                          <Bot className="h-4 w-4 text-muted-foreground" />
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
                            {msg.role === "assistant" ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                                skipHtml
                              >
                                {msg.content}
                              </ReactMarkdown>
                            ) : (
                              <span className="whitespace-pre-wrap">{msg.content}</span>
                            )}
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
                  
                  {/* Streaming Response or Typing Indicator */}
                  {(isLoading || isTyping) && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-gradient-to-br from-muted to-muted/80 rounded-2xl rounded-bl-lg px-4 py-3 border border-border/30 max-w-[85%] md:max-w-[80%]">
                        {streamingContent ? (
                          // Show streaming content
                          <div className="text-sm leading-relaxed text-foreground">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={markdownComponents}
                              skipHtml
                            >
                              {streamingContent}
                            </ReactMarkdown>
                            <motion.span
                              animate={{ opacity: [1, 0, 1] }}
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="inline-block w-2 h-4 bg-primary/70 ml-1 align-middle"
                            />
                          </div>
                        ) : (
                          // Show typing indicator
                          <div className="flex items-center gap-2">
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
                            <span className="text-xs text-muted-foreground ml-2">
                              {language === "TR" ? "Yazıyor..." : "Typing..."}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {/* Auto-scroll anchor */}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 md:p-4 border-t border-border/30 bg-muted/20" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
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
                            ? "border-border text-muted-foreground/50 cursor-not-allowed"
                            : "border-border text-foreground hover:border-primary hover:bg-primary/5"
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
                          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90" 
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
