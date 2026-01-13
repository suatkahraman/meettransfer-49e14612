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
import { motion, AnimatePresence, useDragControls } from "framer-motion";
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
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();
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

  // Detect iOS device
  const isIOSDevice = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);

  // Detect keyboard visibility using visualViewport API for mobile
  useEffect(() => {
    if (!mobileFloating || !isOpen) {
      setKeyboardHeight(0);
      return;
    }

    const viewport = window.visualViewport;
    if (!viewport) return;

    const isIOS = isIOSDevice();

    // On iOS, visualViewport can change even without the keyboard (address bar / scroll).
    // Track a "baseline" diff and only treat large deltas as the keyboard.
    let minDiff = Number.POSITIVE_INFINITY;
    let prevKeyboardH = 0;

    const calcDiff = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const offsetTop = isIOS ? viewport.offsetTop || 0 : 0;
      return Math.max(0, windowHeight - viewportHeight - offsetTop);
    };

    const handleViewportChange = () => {
      const diff = calcDiff();
      minDiff = Math.min(minDiff, diff);

      const rawKeyboardH = Math.max(0, diff - minDiff);
      // Ignore small deltas that are usually Safari chrome changes, not the keyboard
      const keyboardH = rawKeyboardH > 120 ? rawKeyboardH : 0;

      const inputEl = inputRef.current;
      const isInputFocused = !!inputEl && document.activeElement === inputEl;

      // Keyboard closing: blur only if our input is still focused (avoid false positives)
      if (prevKeyboardH > 0 && keyboardH === 0 && isInputFocused) {
        inputEl?.blur();
      }

      // iOS: when keyboard opens, keep the latest message + input visible
      if (isIOS && prevKeyboardH === 0 && keyboardH > 0) {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        });
      }

      prevKeyboardH = keyboardH;
      setKeyboardHeight(keyboardH);
    };

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);

    handleViewportChange();

    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, [mobileFloating, isOpen, isIOSDevice]);

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
    // Focus input when chat opens (desktop only).
    // On mobile/iOS this is unreliable (keyboard won't open unless focus is within a user gesture).
    if (!isOpen || mobileFloating) return;

    if (inputRef.current) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(id);
    }
  }, [isOpen, mobileFloating]);

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

        {/* Mobile Floating Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
            >
              {/* Backdrop (kept behind panel to avoid iOS hit-testing issues) */}
              <button
                type="button"
                aria-label={language === "TR" ? "Kapat" : "Close"}
                onClick={() => setIsOpen(false)}
                data-mobile-backdrop
                className="absolute inset-0 z-0 bg-background/80 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, y: "100%" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 500) {
                    setIsOpen(false);
                  }
                }}
                data-mobile-panel
                className="absolute inset-x-0 bottom-0 z-10 bg-card rounded-t-3xl shadow-2xl border-t border-border flex flex-col transition-all duration-200"
                style={{
                  bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 0,
                  height: keyboardHeight > 0 ? `min(50vh, 400px)` : "min(60vh, 500px)",
                  maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px - 20px)` : undefined,
                  // iOS Safari: keep taps/focus working reliably while still allowing scroll
                  touchAction: "pan-y",
                }}
              >
                {/* Drag Handle - Swipe indicator */}
                 <div 
                   className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                   style={{ touchAction: 'none' }}
                   onPointerDown={(e) => dragControls.start(e.nativeEvent)}
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
                        const isIOS = isIOSDevice();

                        if (isIOS) {
                          // iOS: let the keyboard + viewport settle, then keep the bottom visible
                          window.setTimeout(() => {
                            scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                            inputRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "end",
                              inline: "nearest",
                            });
                          }, 60);
                        } else {
                          window.setTimeout(() => {
                            inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 200);
                        }
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
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return null;
}
