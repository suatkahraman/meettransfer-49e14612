import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, X, Bot, User, Loader2, ArrowRight, Mic, Square, Volume2, VolumeX, AlertCircle, ChevronDown, Trash2, CheckCircle2, Clock, Check, Maximize2, Minimize2, MapPin, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIChat } from "@/contexts/AIChatContext";
import { useAITestOptional } from "@/contexts/AITestContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";
import { MicrophonePermissionAlert } from "./MicrophonePermissionAlert";
import { ChatVehicleCards } from "./ChatVehicleCards";
import { ChatRedirectButton } from "./ChatRedirectButton";
import { ChatReturnDiscountCard } from "./ChatReturnDiscountCard";
import { ChatPriceSummaryCard } from "./ChatPriceSummaryCard";
import { ChatRouteMap } from "./ChatRouteMap";
import { ChatVehicleFeaturesCard } from "./ChatVehicleFeaturesCard";
import { ChatSpeakingWaveform } from "./ChatSpeakingWaveform";
import { ChatQuickReplyButtons, QuickReplyType } from "./ChatQuickReplyButtons";
import { ChatLanguageDetectedBanner } from "./ChatLanguageDetectedBanner";
import { ChatDateTimePicker } from "./ChatDateTimePicker";
import { SoundWaveInline } from "@/components/ui/SoundWaveAnimation";
import { RecordingWaveform, CircularWaveform, InlineRecordingWave } from "@/components/ui/RecordingWaveform";
import { SpeakingBubbleOverlay, SpeakingWaveBar } from "@/components/ui/SpeakingBubbleOverlay";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";

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
  serviceType?: "transfer" | "hourly";
  city?: string | null;
  durationHours?: number | null;
  paymentMethod?: "card" | "cash" | null;
  discountApplied?: boolean;
  discountPercentage?: number | null;
  // Return trip info
  returnDate?: string | null;
  returnTime?: string | null;
  hasReturnTrip?: boolean | null;
  // Extras
  babySeatCount?: number | null;
  luggageCount?: number | null;
}

interface VehicleFeatures {
  wifi?: boolean;
  tv?: boolean;
  minibar?: boolean;
  waterService?: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  bookingData?: BookingData | null;
  showVehicleCards?: boolean;
  showRedirectButton?: boolean;
  showRouteMap?: boolean;
  showReturnDiscount?: boolean;
  showPriceSummary?: boolean;
  showVehicleFeatures?: boolean;
  showReturnQuestion?: boolean;
  showVehicleSelection?: boolean;
  showPaymentMethod?: boolean;
  showPassengerCount?: boolean;
  showExtras?: boolean;
  showAirportSelection?: boolean;
  showDateTimePicker?: boolean;
  vehiclePrices?: Record<string, number>;
  passengerCount?: number;
  vehicleFeatures?: VehicleFeatures;
  babySeatCount?: number;
  luggageCount?: number;
  returnDiscountData?: {
    originalPrice: number;
    discountedPrice: number;
    discountPercentage: number;
  };
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

// Voice recording hook using Web Speech API with Whisper fallback for unsupported browsers
function useVoiceRecorder(onTranscription: (text: string) => void, language: string, onInterimTranscript?: (text: string) => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [useWhisperFallback, setUseWhisperFallback] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(0));
  const [audioQuality, setAudioQuality] = useState<'good' | 'low' | 'noisy' | 'silent'>('good');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const qualityHistoryRef = useRef<number[]>([]);
  const isNativeSupported = isSpeechRecognitionSupported();
  const transcriptRef = useRef<string>('');

  // Check if MediaRecorder is supported for Whisper fallback
  const isMediaRecorderSupported = typeof MediaRecorder !== 'undefined';
  
  // Effective support: native or fallback
  const isSupported = isNativeSupported || isMediaRecorderSupported;

  // Detect iOS Safari
  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }, []);
  
  // Detect Android
  const isAndroid = useCallback(() => {
    return /Android/i.test(navigator.userAgent);
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

  // Setup audio analyser for visualizing audio levels
  const setupAudioAnalyser = useCallback((stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // Higher for better quality detection
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const timeDomainArray = new Uint8Array(analyser.fftSize);
      qualityHistoryRef.current = [];
      
      const updateLevels = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        analyserRef.current.getByteTimeDomainData(timeDomainArray);
        
        // Sample 16 frequency bands for visualization
        const levels: number[] = [];
        const bandSize = Math.floor(dataArray.length / 16);
        
        for (let i = 0; i < 16; i++) {
          let sum = 0;
          for (let j = 0; j < bandSize; j++) {
            sum += dataArray[i * bandSize + j];
          }
          // Normalize to 0-1 range with some amplification
          levels.push(Math.min(1, (sum / bandSize / 255) * 2));
        }
        
        setAudioLevels(levels);
        
        // Audio quality detection
        const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
        
        // Check for clipping (too loud / distortion)
        let clippingCount = 0;
        for (let i = 0; i < timeDomainArray.length; i++) {
          if (timeDomainArray[i] <= 5 || timeDomainArray[i] >= 250) {
            clippingCount++;
          }
        }
        const clippingRatio = clippingCount / timeDomainArray.length;
        
        // Track quality history (last 30 frames ~0.5 seconds)
        qualityHistoryRef.current.push(avgLevel);
        if (qualityHistoryRef.current.length > 30) {
          qualityHistoryRef.current.shift();
        }
        
        // Calculate average over history for more stable detection
        const historyAvg = qualityHistoryRef.current.reduce((a, b) => a + b, 0) / qualityHistoryRef.current.length;
        
        // Determine audio quality - use less strict thresholds
        // Only show silent warning after more data is collected (at least 60 frames = ~1 second)
        if (historyAvg < 0.01 && qualityHistoryRef.current.length >= 60) {
          setAudioQuality('silent');
        } else if (clippingRatio > 0.15 || historyAvg > 0.9) {
          setAudioQuality('noisy');
        } else if (historyAvg < 0.05 && qualityHistoryRef.current.length >= 60) {
          setAudioQuality('low');
        } else {
          setAudioQuality('good');
        }
        
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };
      
      updateLevels();
    } catch (error) {
      console.error('🎤 Error setting up audio analyser:', error);
    }
  }, []);

  // Cleanup audio analyser
  const cleanupAudioAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    qualityHistoryRef.current = [];
    setAudioLevels(new Array(16).fill(0));
    setAudioQuality('good');
  }, []);

  // Request microphone permission explicitly for iOS
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setShowBrowserWarning(true);
      return false;
    }
  }, []);

  // Send audio to ElevenLabs Scribe API for transcription (with Whisper fallback)
  const transcribeWithElevenLabs = useCallback(async (audioBlob: Blob) => {
    console.log('🎤 ElevenLabs STT: Transcribing audio blob, size:', audioBlob.size);
    setIsProcessing(true);
    
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000;
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);
      console.log('🎤 ElevenLabs STT: Base64 audio length:', base64Audio.length);

      // Detect MIME type from blob
      const detectedMimeType = audioBlob.type || 'audio/webm';
      console.log('🎤 ElevenLabs STT: Sending audio with type:', detectedMimeType);
      
      // Try ElevenLabs first
      let response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ 
            audio: base64Audio, 
            language,
            mimeType: detectedMimeType 
          }),
        }
      );

      // If ElevenLabs fails, fallback to Whisper
      if (!response.ok) {
        console.log('🎤 ElevenLabs STT failed, falling back to Whisper...');
        response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ 
              audio: base64Audio, 
              language,
              mimeType: detectedMimeType 
            }),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 STT API error:', response.status, errorText);
        throw new Error(`STT API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎤 Transcription result:', result.text);
      
      if (result.text && result.text.trim()) {
        onTranscription(result.text.trim());
      }
    } catch (error) {
      console.error('🎤 Transcription error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [language, onTranscription]);

  // Start recording with Whisper fallback
  const startWhisperRecording = useCallback(async () => {
    console.log('🎤 Whisper: Starting recording...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      // Setup audio analyser for visualization
      setupAudioAnalyser(stream);
      
      // Determine supported MIME type - iOS Safari only supports audio/mp4
      let mimeType = 'audio/webm';
      
      if (isIOS()) {
        // iOS Safari: test mp4, m4a, or fallback
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
          mimeType = 'audio/mpeg';
        } else {
          // Try default, iOS 14.3+ should support some format
          console.log('🎤 Whisper: No explicit MIME type supported on iOS, using default');
          mimeType = '';
        }
      } else if (isAndroid()) {
        // Android: prefer webm with opus codec
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      } else {
        // Desktop browsers
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }
      
      console.log('🎤 Whisper: Platform:', isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'Desktop');
      console.log('🎤 Whisper: Using MIME type:', mimeType || 'default');
      
      // Create MediaRecorder with or without mimeType option
      let mediaRecorder: MediaRecorder;
      try {
        if (mimeType) {
          mediaRecorder = new MediaRecorder(stream, { mimeType });
        } else {
          // Use default options on iOS if no mimeType is supported
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (recorderError) {
        console.error('🎤 Whisper: MediaRecorder creation failed:', recorderError);
        // Fallback: try without options
        mediaRecorder = new MediaRecorder(stream);
      }
      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
      console.log('🎤 Whisper: Actual MIME type from recorder:', actualMimeType);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('🎤 Whisper: Audio chunk received, size:', event.data.size);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('🎤 Whisper: Recording stopped, chunks:', audioChunksRef.current.length);
        
        // Cleanup audio analyser
        cleanupAudioAnalyser();
        
        if (audioChunksRef.current.length > 0) {
          // Use actual mimeType from recorder, not the variable
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
          console.log('🎤 ElevenLabs: Total audio blob size:', audioBlob.size, 'type:', actualMimeType);
          
          if (audioBlob.size > 1000) { // Only transcribe if there's meaningful audio
            await transcribeWithElevenLabs(audioBlob);
          } else {
            console.log('🎤 ElevenLabs: Audio too short, skipping transcription');
          }
        }
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('🎤 ElevenLabs: Recording started');
      
    } catch (error) {
      console.error('🎤 ElevenLabs: Error starting recording:', error);
      setShowBrowserWarning(true);
    }
  }, [transcribeWithElevenLabs, setupAudioAnalyser, cleanupAudioAnalyser]);

  // Stop Whisper recording
  const stopWhisperRecording = useCallback(() => {
    console.log('🎤 Whisper: Stopping recording...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    console.log('🎤 startRecording called');
    console.log('🎤 Browser info:', navigator.userAgent);
    console.log('🎤 Is iOS:', isIOS());
    console.log('🎤 Is Android:', isAndroid());
    console.log('🎤 Permission granted:', permissionGranted);
    console.log('🎤 Native Speech API supported:', isNativeSupported);
    console.log('🎤 MediaRecorder supported:', isMediaRecorderSupported);
    
    // iOS Safari does NOT support Web Speech API at all - always use Whisper
    // Even though webkitSpeechRecognition might exist, it doesn't work on iOS
    if (isIOS()) {
      console.log('🎤 iOS detected - using Whisper fallback (Web Speech API not reliable on iOS)');
      setUseWhisperFallback(true);
      await startWhisperRecording();
      return;
    }
    
    // If Web Speech API is not supported, use Whisper fallback
    if (!isNativeSupported) {
      console.log('🎤 Using Whisper fallback (Web Speech API not supported)');
      setUseWhisperFallback(true);
      await startWhisperRecording();
      return;
    }
    
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    console.log('🎤 SpeechRecognition available:', !!SpeechRecognition);
    
    if (!SpeechRecognition) {
      console.log('🎤 Falling back to Whisper');
      setUseWhisperFallback(true);
      await startWhisperRecording();
      return;
    }

    // Check if mediaDevices is available
    console.log('🎤 navigator.mediaDevices available:', !!navigator.mediaDevices);
    console.log('🎤 getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);

    // For iOS Safari, ALWAYS request microphone permission first within user gesture
    if (isIOS()) {
      try {
        console.log('🎤 iOS detected - requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        console.log('🎤 iOS microphone stream obtained:', stream);
        console.log('🎤 Audio tracks:', stream.getAudioTracks().length);
        
        // Keep stream for audio analyser visualization
        streamRef.current = stream;
        setupAudioAnalyser(stream);
        
        setPermissionGranted(true);
        console.log('🎤 iOS permission granted');
      } catch (error) {
        console.error('🎤 iOS microphone permission denied:', error);
        console.error('🎤 Error name:', (error as Error).name);
        console.error('🎤 Error message:', (error as Error).message);
        setShowBrowserWarning(true);
        return;
      }
    } else if (!permissionGranted) {
      console.log('🎤 Non-iOS: requesting permission...');
      const granted = await requestMicrophonePermission();
      console.log('🎤 Permission result:', granted);
      if (!granted) {
        return;
      }
      
      // Get stream for audio visualization on non-iOS
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setupAudioAnalyser(stream);
      } catch (error) {
        console.log('🎤 Could not get stream for visualization:', error);
      }
    } else {
      // Already has permission, get stream for visualization
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setupAudioAnalyser(stream);
      } catch (error) {
        console.log('🎤 Could not get stream for visualization:', error);
      }
    }

    try {
      if (recognitionRef.current) {
        console.log('🎤 Stopping existing recognition...');
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log('🎤 Abort error (ignored):', e);
        }
      }

      console.log('🎤 Creating new SpeechRecognition instance...');
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      const langCode = getLanguageCode(language);
      console.log('🎤 Setting language:', langCode);
      recognition.lang = langCode;
      
      recognition.interimResults = true;
      recognition.continuous = !isIOS();
      recognition.maxAlternatives = 1;

      console.log('🎤 Recognition config:', {
        lang: recognition.lang,
        interimResults: recognition.interimResults,
        continuous: recognition.continuous,
        maxAlternatives: recognition.maxAlternatives
      });

      transcriptRef.current = '';

      recognition.onstart = () => {
        console.log('🎤 ✅ Speech recognition STARTED successfully');
        setIsRecording(true);
        setIsProcessing(false);
        setUseWhisperFallback(false);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        console.log('🎤 onresult event received, results:', event.results.length);
        let finalTranscript = '';
        let currentInterimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          console.log(`🎤 Result[${i}]: "${transcript}" (confidence: ${confidence}, isFinal: ${result.isFinal})`);
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterimTranscript += transcript;
          }
        }

        const transcript = finalTranscript || currentInterimTranscript;
        
        if (transcript) {
          transcriptRef.current = transcript;
          console.log('🎤 Current transcript:', transcript, 'isFinal:', !!finalTranscript);
          
          // Always update interim transcript for real-time display
          if (currentInterimTranscript) {
            setInterimTranscript(currentInterimTranscript);
            onInterimTranscript?.(currentInterimTranscript);
          }
          
          if (finalTranscript) {
            console.log('🎤 Sending final transcript to onTranscription...');
            setInterimTranscript(''); // Clear interim when final is received
            setIsProcessing(true);
            onTranscription(finalTranscript);
            setIsProcessing(false);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('🎤 ❌ Speech recognition ERROR:', event.error);
        console.error('🎤 Error message:', event.message);
        
        // If speech recognition fails, try Whisper fallback
        if (event.error === 'not-allowed') {
          console.error('🎤 Permission not allowed - showing warning');
          setShowBrowserWarning(true);
          setPermissionGranted(false);
        } else if (event.error === 'network' || event.error === 'service-not-allowed') {
          console.log('🎤 Network/service error - trying Whisper fallback');
          setUseWhisperFallback(true);
          startWhisperRecording();
          return;
        }
        
        if (event.error !== 'no-speech') {
          setIsRecording(false);
        } else {
          console.log('🎤 no-speech error - keeping recording state on iOS');
        }
        setIsProcessing(false);
      };

      recognition.onend = () => {
        console.log('🎤 Speech recognition ENDED');
        console.log('🎤 Current transcript ref:', transcriptRef.current);
        
        // Cleanup audio analyser and stream
        cleanupAudioAnalyser();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (isIOS() && transcriptRef.current) {
          console.log('🎤 iOS: Using interim transcript as final');
          setIsProcessing(true);
          onTranscription(transcriptRef.current);
          setIsProcessing(false);
        }
        
        setInterimTranscript(''); // Clear interim transcript on end
        setIsRecording(false);
      };

      (recognition as any).onaudiostart = () => {
        console.log('🎤 Audio capture started');
      };

      (recognition as any).onaudioend = () => {
        console.log('🎤 Audio capture ended');
      };

      (recognition as any).onsoundstart = () => {
        console.log('🎤 Sound detected');
      };

      (recognition as any).onsoundend = () => {
        console.log('🎤 Sound ended');
      };

      (recognition as any).onspeechstart = () => {
        console.log('🎤 Speech detected');
      };

      (recognition as any).onspeechend = () => {
        console.log('🎤 Speech ended');
      };

      console.log('🎤 Calling recognition.start()...');
      recognition.start();
      console.log('🎤 recognition.start() called successfully');
    } catch (error) {
      console.error('🎤 ❌ Error starting speech recognition:', error);
      console.error('🎤 Error name:', (error as Error).name);
      console.error('🎤 Error message:', (error as Error).message);
      console.error('🎤 Error stack:', (error as Error).stack);
      
      // Try Whisper fallback on any error
      console.log('🎤 Trying Whisper fallback after error...');
      setUseWhisperFallback(true);
      await startWhisperRecording();
    }
  }, [language, getLanguageCode, onTranscription, isIOS, isAndroid, permissionGranted, requestMicrophonePermission, isNativeSupported, isMediaRecorderSupported, startWhisperRecording, setupAudioAnalyser, cleanupAudioAnalyser]);

  const stopRecording = useCallback(() => {
    console.log('Stopping recording, isRecording:', isRecording, 'useWhisperFallback:', useWhisperFallback);
    
    // Cleanup audio analyser
    cleanupAudioAnalyser();
    
    // Cleanup stream for native speech recognition
    if (streamRef.current && !useWhisperFallback) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (useWhisperFallback) {
      stopWhisperRecording();
    } else if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }
    
    setIsRecording(false);
  }, [isRecording, useWhisperFallback, stopWhisperRecording, cleanupAudioAnalyser]);

  return { isRecording, isProcessing, startRecording, stopRecording, isSupported, showBrowserWarning, dismissWarning, useWhisperFallback, audioLevels, audioQuality, interimTranscript };
}

// Voice option type
interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
}

// Voice settings interface
interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
}

// Text-to-Speech hook using ElevenLabs API for high-quality voice
function useTextToSpeech(language: string, onSpeakEnd?: () => void, mobileFloating?: boolean) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Voice disabled by default - user can enable manually
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.15); // Faster, more natural speech
  // Optimized voice settings for slow, clear, natural speech
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.75,       // High stability for clear, consistent pronunciation
    similarityBoost: 0.85, // Strong voice character
    style: 0.35,           // Moderate style, not too expressive for clarity
  });
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const onSpeakEndRef = useRef(onSpeakEnd);
  
  // Keep callback ref updated
  useEffect(() => {
    onSpeakEndRef.current = onSpeakEnd;
  }, [onSpeakEnd]);

  // ElevenLabs voices with Turkish support
  // Sarah is the default - warm, professional, soft, and persuasive female voice
  const elevenLabsVoices: VoiceOption[] = [
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah ⭐', lang: 'multilingual', gender: 'female' }, // Default - warm, persuasive
    { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', lang: 'multilingual', gender: 'female' }, // Soft, gentle
    { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica', lang: 'multilingual', gender: 'female' }, // Natural, conversational
    { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', lang: 'multilingual', gender: 'female' },
    { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', lang: 'multilingual', gender: 'female' },
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', lang: 'multilingual', gender: 'male' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', lang: 'multilingual', gender: 'male' },
    { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam', lang: 'multilingual', gender: 'male' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', lang: 'multilingual', gender: 'male' },
  ];

  // Load voices on mount
  useEffect(() => {
    setAvailableVoices(elevenLabsVoices);
    if (!selectedVoiceId) {
      // Default to Sarah - soft, warm, persuasive female voice that sounds human
      setSelectedVoiceId('EXAVITQu4vr4xnSDxMaL');
    }
  }, []);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  // Clean text for TTS - make it readable and natural for speech synthesis
  const cleanTextForSpeech = useCallback((text: string, lang: string): string => {
    let cleaned = text
      // Remove all emojis
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2300}-\u{23FF}]/gu, '')
      .replace(/[\u{2B50}]/gu, '')
      .replace(/👋|🎤|📍|📅|👥|🚗|💰|✅|❌|⭐|🌟|💳|📱|✈️|🏨|🚌|🚐|🚕|📞|💬|🔒|🎉|👍|👎|❤️|🙏|😊|😃|😄|🚀|💡|📌|🔔|⚠️|ℹ️|🔗|📧|📝|🎯|💼|🏷️|🛡️|⏰|🕐|🕑|🕒|🕓|🕔|🕕|🕖|🕗|🕘|🕙|🕚|🕛/g, '')
      
      // Remove markdown formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
      .replace(/\*([^*]+)\*/g, '$1') // Italic
      .replace(/__([^_]+)__/g, '$1') // Bold underscore
      .replace(/_([^_]+)_/g, '$1') // Italic underscore
      .replace(/~~([^~]+)~~/g, '$1') // Strikethrough
      .replace(/`([^`]+)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '') // Code blocks
      .replace(/^#+\s*/gm, '') // Headers
      .replace(/^\s*[-*+]\s+/gm, '') // List items
      .replace(/^\s*\d+\.\s+/gm, '') // Numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links - keep text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images - remove
      
      // Clean up price formats for natural reading
      .replace(/(\d+)\s*€/g, (_, num) => lang === 'TR' ? `${num} Euro` : `${num} Euros`)
      .replace(/€\s*(\d+)/g, (_, num) => lang === 'TR' ? `${num} Euro` : `${num} Euros`)
      .replace(/(\d+)\s*\$/g, (_, num) => lang === 'TR' ? `${num} Dolar` : `${num} Dollars`)
      .replace(/\$\s*(\d+)/g, (_, num) => lang === 'TR' ? `${num} Dolar` : `${num} Dollars`)
      .replace(/(\d+)\s*TL/gi, (_, num) => lang === 'TR' ? `${num} Türk Lirası` : `${num} Turkish Lira`)
      .replace(/(\d+)\s*USD/gi, (_, num) => lang === 'TR' ? `${num} Amerikan Doları` : `${num} US Dollars`)
      .replace(/(\d+)\s*EUR/gi, (_, num) => lang === 'TR' ? `${num} Euro` : `${num} Euros`)
      .replace(/(\d+)\s*GBP/gi, (_, num) => lang === 'TR' ? `${num} İngiliz Sterlini` : `${num} British Pounds`)
      
      // Convert numbers with separators for natural reading
      .replace(/(\d{1,3})\.(\d{3})/g, '$1$2') // Remove thousand separators (1.500 -> 1500)
      .replace(/(\d+),(\d{2})(?!\d)/g, (_, int, dec) => `${int} ${lang === 'TR' ? 'virgül' : 'point'} ${dec}`) // Decimal: 15,50 -> "15 virgül 50"
      
      // Clean up special characters and symbols
      .replace(/[<>{}[\]\\|^~]/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, ' ve ')
      .replace(/&lt;/g, '')
      .replace(/&gt;/g, '')
      .replace(/&quot;/g, '')
      .replace(/&#39;/g, "'")
      
      // Clean up punctuation for better speech
      .replace(/\.{2,}/g, '.') // Multiple dots to single
      .replace(/,{2,}/g, ',') // Multiple commas to single
      .replace(/!{2,}/g, '!') // Multiple exclamations to single
      .replace(/\?{2,}/g, '?') // Multiple questions to single
      .replace(/\s*[-–—]\s*/g, ', ') // Dashes to commas for pauses
      .replace(/\s*[/]\s*/g, ' veya ') // Slash to "or"
      .replace(/\s*\(\s*/g, ', ') // Opening paren to comma
      .replace(/\s*\)\s*/g, ', ') // Closing paren to comma
      .replace(/\s*:\s*/g, ': ') // Clean colons
      
      // Clean up whitespace
      .replace(/\n{2,}/g, '. ') // Multiple newlines to sentence break
      .replace(/\n/g, ' ') // Single newline to space
      .replace(/\s{2,}/g, ' ') // Multiple spaces to single
      .replace(/^\s+|\s+$/g, '') // Trim
      
      // Ensure proper sentence endings
      .replace(/([^.!?])$/g, '$1.'); // Add period if missing at end
    
    return cleaned;
  }, []);

  // Split text into sentences for more natural reading
  const splitIntoSentences = useCallback((text: string): string[] => {
    // Split on sentence-ending punctuation, keeping the punctuation
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // If no sentences found (no proper punctuation), try to split on commas or other breaks
    if (sentences.length === 1 && text.length > 150) {
      // Split long text on commas or semicolons for natural pauses
      const parts = text
        .split(/(?<=[,;:])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      // Group small parts together (aim for ~50-150 chars per chunk)
      const groupedParts: string[] = [];
      let currentGroup = '';
      
      for (const part of parts) {
        if (currentGroup.length + part.length < 150) {
          currentGroup = currentGroup ? `${currentGroup} ${part}` : part;
        } else {
          if (currentGroup) groupedParts.push(currentGroup);
          currentGroup = part;
        }
      }
      if (currentGroup) groupedParts.push(currentGroup);
      
      return groupedParts.length > 1 ? groupedParts : sentences;
    }
    
    return sentences;
  }, []);

  // Reference to track if we should stop speaking
  const shouldStopRef = useRef(false);
  const sentenceQueueRef = useRef<string[]>([]);

  const speakWithElevenLabs = useCallback(async (text: string) => {
    console.log('🔊 [ElevenLabs] Speaking text:', text.substring(0, 50) + '...');
    
    // Clean text for speech
    const cleanText = cleanTextForSpeech(text, language);

    if (!cleanText) {
      console.log('🔊 [ElevenLabs] No clean text to speak');
      return;
    }
    
    console.log('🔊 [ElevenLabs] Cleaned text:', cleanText.substring(0, 100) + '...');

    // Split into sentences for more natural reading
    const sentences = splitIntoSentences(cleanText);
    console.log('🔊 [ElevenLabs] Split into', sentences.length, 'sentences');
    
    sentenceQueueRef.current = sentences;
    shouldStopRef.current = false;

    try {
      setIsSpeaking(true);

      // Process sentences sequentially with request stitching for natural flow
      for (let i = 0; i < sentences.length; i++) {
        if (shouldStopRef.current) {
          console.log('🔊 [ElevenLabs] Stopped by user');
          break;
        }

        const currentSentence = sentences[i];
        const previousSentence = i > 0 ? sentences[i - 1] : undefined;
        const nextSentence = i < sentences.length - 1 ? sentences[i + 1] : undefined;

        console.log(`🔊 [ElevenLabs] Speaking sentence ${i + 1}/${sentences.length}:`, currentSentence.substring(0, 50) + '...');

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              text: currentSentence,
              voiceId: selectedVoiceId || 'EXAVITQu4vr4xnSDxMaL',
              stability: voiceSettings.stability,
              similarityBoost: voiceSettings.similarityBoost,
              style: voiceSettings.style,
              speed: speechRate,
              // Request stitching for natural flow between sentences
              previousText: previousSentence,
              nextText: nextSentence,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('🔊 [ElevenLabs] API error:', response.status, errorData);
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        if (shouldStopRef.current) break;

        const audioBlob = await response.blob();
        
        // Cleanup previous audio URL
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }

        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        // Create and play audio
        const audio = new Audio(audioUrl);
        audio.playbackRate = speechRate;
        audioRef.current = audio;

        // Wait for audio to finish before playing next sentence
        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            console.log(`🔊 [ElevenLabs] Sentence ${i + 1} ended`);
            resolve();
          };

          audio.onerror = (e) => {
            console.error('🔊 [ElevenLabs] Audio playback error:', e);
            reject(e);
          };

          audio.play().catch(reject);
        });

        // No pause between sentences for continuous flow
      }

      console.log('🔊 [ElevenLabs] All sentences completed');
      setIsSpeaking(false);
      
      if (onSpeakEndRef.current && !shouldStopRef.current) {
        setTimeout(() => {
          onSpeakEndRef.current?.();
        }, 100);
      }

    } catch (error) {
      console.error('🔊 [ElevenLabs] Error:', error);
      setIsSpeaking(false);
      // Fallback to Web Speech API
      console.log('🔊 [ElevenLabs] Falling back to Web Speech API');
      speakWithWebSpeech(text);
    }
  }, [language, selectedVoiceId, speechRate, voiceSettings, cleanTextForSpeech, splitIntoSentences]);

  // Fallback Web Speech API
  const speakWithWebSpeech = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.error('🔊 [WebSpeech] Not supported');
      return;
    }

    window.speechSynthesis.cancel();

    // Use the same cleaning function
    const cleanText = cleanTextForSpeech(text, language);

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    const languageMap: Record<string, string> = {
      'TR': 'tr-TR', 'EN': 'en-US', 'DE': 'de-DE', 'FR': 'fr-FR',
      'RU': 'ru-RU', 'AR': 'ar-SA', 'ES': 'es-ES', 'IT': 'it-IT',
      'UK': 'uk-UA', 'JA': 'ja-JP'
    };
    
    utterance.lang = languageMap[language] || 'en-US';
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onSpeakEndRef.current) {
        setTimeout(() => onSpeakEndRef.current?.(), 100);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onSpeakEndRef.current) {
        setTimeout(() => onSpeakEndRef.current?.(), 100);
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [language, speechRate]);

  // Main speak function - used for auto-speak after AI response
  const speak = useCallback((text: string) => {
    console.log('🔊 [TTS] speak() called, useElevenLabs:', useElevenLabs, 'isVoiceEnabled:', isVoiceEnabled);
    
    if (!isVoiceEnabled || !text) {
      console.log('🔊 [TTS] Voice disabled or no text');
      return;
    }

    if (useElevenLabs) {
      speakWithElevenLabs(text);
    } else {
      speakWithWebSpeech(text);
    }
  }, [isVoiceEnabled, useElevenLabs, speakWithElevenLabs, speakWithWebSpeech]);

  // Force speak function - used for manual "Read Aloud" button, bypasses isVoiceEnabled check
  const forceSpeak = useCallback((text: string) => {
    console.log('🔊 [TTS] forceSpeak() called, useElevenLabs:', useElevenLabs);
    
    if (!text) {
      console.log('🔊 [TTS] No text to speak');
      return;
    }

    if (useElevenLabs) {
      speakWithElevenLabs(text);
    } else {
      speakWithWebSpeech(text);
    }
  }, [useElevenLabs, speakWithElevenLabs, speakWithWebSpeech]);

  const stopSpeaking = useCallback(() => {
    // Signal to stop sentence queue
    shouldStopRef.current = true;
    sentenceQueueRef.current = [];
    
    // Stop ElevenLabs audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    // Stop Web Speech
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    setIsVoiceEnabled(prev => {
      if (prev) {
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

  const changeVoiceSettings = useCallback((settings: VoiceSettings) => {
    setVoiceSettings(settings);
  }, []);

  return { 
    isSpeaking, 
    isVoiceEnabled, 
    speak, 
    forceSpeak,
    stopSpeaking, 
    toggleVoice, 
    availableVoices, 
    selectedVoiceId, 
    selectVoice,
    speechRate,
    changeRate,
    voiceSettings,
    changeVoiceSettings
  };
}

const placeholderMessages: Record<string, string> = {
  EN: "e.g., 'Tomorrow at 3pm from Antalya Airport to Belek for 4 people'",
  TR: "örn: 'Yarın 15:00'te Antalya Havalimanı'ndan Belek'e 4 kişi'",
  DE: "z.B. 'Morgen um 15 Uhr vom Flughafen Antalya nach Belek für 4 Personen'",
  FR: "ex: 'Demain à 15h de l'aéroport d'Antalya à Belek pour 4 personnes'",
  RU: "напр: 'Завтра в 15:00 из аэропорта Анталии в Белек на 4 человека'",
  AR: "مثال: 'غداً الساعة 3 عصراً من مطار أنطاليا إلى بيليك لـ 4 أشخاص'",
  ES: "ej: 'Mañana a las 15h del aeropuerto de Antalya a Belek para 4 personas'",
  IT: "es: 'Domani alle 15 dall'aeroporto di Antalya a Belek per 4 persone'",
  UK: "напр: 'Завтра о 15:00 з аеропорту Анталії до Белека на 4 особи'",
  JA: "例: '明日15時にアンタルヤ空港からベレクへ4人で'"
};

// Welcome messages in each language - AI starts in the user's selected language
const welcomeMessages: Record<string, string> = {
  TR: "Merhaba! Ben MT, Meet Transfer VIP transfer asistanınız. 🚗✨ Size en iyi hizmeti sunabilmem için önce adınızı öğrenebilir miyim?",
  EN: "Hello! I'm MT, your Meet Transfer VIP transfer assistant. 🚗✨ To provide you with the best service, may I first know your name?",
  DE: "Hallo! Ich bin MT, Ihr Meet Transfer VIP-Transferassistent. 🚗✨ Um Ihnen den besten Service zu bieten, darf ich zunächst Ihren Namen erfahren?",
  FR: "Bonjour! Je suis MT, votre assistant de transfert VIP Meet Transfer. 🚗✨ Pour vous offrir le meilleur service, puis-je d'abord connaître votre nom?",
  RU: "Здравствуйте! Я МТ, ваш VIP-трансфер ассистент Meet Transfer. 🚗✨ Чтобы предоставить вам лучший сервис, могу ли я сначала узнать ваше имя?",
  AR: "مرحباً! أنا MT، مساعد النقل VIP الخاص بك من Meet Transfer. 🚗✨ لتقديم أفضل خدمة لك، هل يمكنني معرفة اسمك أولاً؟",
  ES: "¡Hola! Soy MT, tu asistente de transferencia VIP de Meet Transfer. 🚗✨ Para brindarte el mejor servicio, ¿puedo saber primero tu nombre?",
  IT: "Ciao! Sono MT, il tuo assistente VIP transfer di Meet Transfer. 🚗✨ Per offrirti il miglior servizio, posso prima conoscere il tuo nome?",
  UK: "Привіт! Я МТ, ваш VIP-трансфер асистент Meet Transfer. 🚗✨ Щоб надати вам найкращий сервіс, чи можу я спочатку дізнатися ваше ім'я?",
  JA: "こんにちは！私はMT、Meet TransferのVIPトランスファーアシスタントです。🚗✨ 最高のサービスを提供するために、まずお名前を教えていただけますか？"
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

// Check if user has seen onboarding before
function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem('meet_transfer_ai_onboarding') === 'true';
  } catch {
    return false;
  }
}

function markOnboardingSeen(): void {
  try {
    localStorage.setItem('meet_transfer_ai_onboarding', 'true');
  } catch {
    // Ignore storage errors
  }
}

export default function BookingChatAssistant({ onApplyBooking, defaultOpen = false, mobileFloating = false }: BookingChatAssistantProps) {
  const { t, language } = useLanguage();
  const { setAIChatOpen } = useAIChat();
  const testContext = useAITestOptional();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);
  const [currentTooltipMessage, setCurrentTooltipMessage] = useState<string>('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(!hasSeenOnboarding());
  const helpTooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId] = useState(() => getVisitorId());
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [bookingCreated, setBookingCreated] = useState<{ id: string; token: string } | null>(null);
  const [showRedirectPrompt, setShowRedirectPrompt] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [waitingForPrice, setWaitingForPrice] = useState(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [showLanguageBanner, setShowLanguageBanner] = useState(true);
  const [panelHeight, setPanelHeight] = useState(() => {
    // Load saved height from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai-assistant-panel-height');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 30 && parsed <= 95) {
          return parsed;
        }
      }
    }
    return 75; // Default 75% height
  });
  const [isDraggingResize, setIsDraggingResize] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const previousHeightRef = useRef<number>(75);
  const resizeStartYRef = useRef<number>(0);
  const resizeStartHeightRef = useRef<number>(panelHeight);
  const baselineViewportHeightRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragControls = useDragControls();
  const hasLoadedRef = useRef(false);
  const hasHandledAIParamRef = useRef(false);
  // Sync isOpen state with global AIChatContext (for hiding BottomNav/WhatsApp)
  useEffect(() => {
    if (mobileFloating) {
      setAIChatOpen(isOpen);
    }
    return () => {
      if (mobileFloating) {
        setAIChatOpen(false);
      }
    };
  }, [isOpen, mobileFloating, setAIChatOpen]);

  // Handle back button for fullscreen mode and Android hardware back button
  const historyPushedRef = useRef(false);
  
  useEffect(() => {
    if (!mobileFloating) return;

    const handlePopState = (e: PopStateEvent) => {
      // Check if this is our managed state
      const state = e.state as { aiOpen?: boolean; aiFullscreen?: boolean } | null;
      
      if (isFullscreen) {
        // Exit fullscreen instead of navigating back
        setPanelHeight(previousHeightRef.current);
        setIsFullscreen(false);
        historyPushedRef.current = false;
      } else if (isOpen) {
        // Close the chat panel
        setIsOpen(false);
        historyPushedRef.current = false;
      }
    };

    // Push state when opening chat or entering fullscreen (only once)
    if (isOpen && !historyPushedRef.current) {
      window.history.pushState({ aiOpen: true, aiFullscreen: isFullscreen }, '');
      historyPushedRef.current = true;
    }
    
    // Push additional state when entering fullscreen while already open
    if (isOpen && isFullscreen && historyPushedRef.current) {
      window.history.pushState({ aiOpen: true, aiFullscreen: true }, '');
    }

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, isFullscreen, mobileFloating]);

  // Reset history ref when chat closes
  useEffect(() => {
    if (!isOpen) {
      historyPushedRef.current = false;
    }
  }, [isOpen]);
  // Ref to track if we should auto-send voice transcription
  const pendingVoiceMessageRef = useRef<string | null>(null);
  const shouldAutoSendRef = useRef<boolean>(false);

  // Voice recording - auto-send transcribed text
  const handleTranscription = useCallback((text: string) => {
    if (!text.trim()) return;
    
    // Store the transcribed text for auto-send
    const trimmedText = text.trim();
    pendingVoiceMessageRef.current = trimmedText;
    shouldAutoSendRef.current = true;
    setInput(trimmedText);
    
    // Close keyboard on mobile
    if (mobileFloating && inputRef.current) {
      inputRef.current.blur();
    }
    
    // Scroll to bottom
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [mobileFloating]);
  
  // Handle interim transcript for real-time display
  const handleInterimTranscript = useCallback((text: string) => {
    // Only update input if we're still recording (not after final result)
    if (!shouldAutoSendRef.current) {
      setInput(text);
    }
  }, []);
  
  const { isRecording, isProcessing, startRecording, stopRecording, isSupported: isSpeechSupported, showBrowserWarning, dismissWarning, useWhisperFallback, audioLevels, audioQuality, interimTranscript } = useVoiceRecorder(
    handleTranscription,
    language,
    handleInterimTranscript
  );
  
  // Haptic feedback for push-to-talk
  const { trigger: triggerHaptic } = useHapticFeedback();
  
  // Auto-send voice message when transcription is complete and not recording/processing
  const autoSendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear any existing timeout
    if (autoSendTimeoutRef.current) {
      clearTimeout(autoSendTimeoutRef.current);
      autoSendTimeoutRef.current = null;
    }
    
    // Check if we should auto-send
    if (shouldAutoSendRef.current && pendingVoiceMessageRef.current && !isRecording && !isProcessing) {
      const messageToSend = pendingVoiceMessageRef.current;
      
      // Reset refs immediately
      pendingVoiceMessageRef.current = null;
      shouldAutoSendRef.current = false;
      
      // Auto-send after a short delay to ensure UI has updated
      autoSendTimeoutRef.current = setTimeout(() => {
        // Directly trigger form submission
        const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          console.log('🎤 Auto-sending voice message:', messageToSend);
          submitButton.click();
        }
      }, 200);
    }
    
    return () => {
      if (autoSendTimeoutRef.current) {
        clearTimeout(autoSendTimeoutRef.current);
      }
    };
  }, [input, isRecording, isProcessing]);

  // Continuous conversation mode - auto-start recording after AI speaks
  // Default to false: user (guest) must opt-in
  const [continuousMode, setContinuousMode] = useState(false);
  const continuousModeRef = useRef(false);
  const hasAutoStartedRef = useRef(false);
  const startRecordingRef = useRef<(() => void) | null>(null);
  
  // Keep refs in sync
  useEffect(() => {
    continuousModeRef.current = continuousMode;
  }, [continuousMode]);
  
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);
  
  // Callback when TTS finishes speaking
  const handleSpeakEnd = useCallback(() => {
    console.log('🔊 TTS finished speaking, continuousMode:', continuousModeRef.current, 'isRecording:', isRecording, 'isProcessing:', isProcessing, 'isOpen:', isOpen);
    
    // Use a longer delay and check conditions more robustly
    if (continuousModeRef.current && isOpen) {
      // Small delay before starting recording to avoid feedback and ensure state is settled
      const checkAndStartRecording = () => {
        console.log('🎤 Checking if should auto-start recording...');
        if (continuousModeRef.current && startRecordingRef.current && isOpen) {
          console.log('🎤 ✅ Auto-starting recording in continuous mode');
          try {
            startRecordingRef.current();
          } catch (err) {
            console.error('🎤 ❌ Failed to auto-start recording:', err);
          }
        }
      };
      
      setTimeout(checkAndStartRecording, 800);
    }
  }, [isRecording, isProcessing, isOpen]);

  // Text-to-Speech with callback when speech ends
  const { isSpeaking, isVoiceEnabled, speak, forceSpeak, stopSpeaking, toggleVoice, availableVoices, selectedVoiceId, selectVoice, speechRate, changeRate, voiceSettings, changeVoiceSettings } = useTextToSpeech(language, handleSpeakEnd, mobileFloating);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  // Function to speak a specific message - uses forceSpeak to bypass isVoiceEnabled check
  const speakMessage = useCallback((messageId: string, content: string) => {
    stopSpeaking(); // Stop any ongoing speech
    setSpeakingMessageId(messageId);
    setTimeout(() => forceSpeak(content), 100);
  }, [forceSpeak, stopSpeaking]);
  
  // Clear speaking message ID when speech ends
  useEffect(() => {
    if (!isSpeaking) {
      setSpeakingMessageId(null);
    }
  }, [isSpeaking]);
  
  // Toggle continuous conversation mode
  const toggleContinuousMode = useCallback(() => {
    setContinuousMode(prev => !prev);
  }, []);

  // State for waiting time display
  const [waitingStartTime, setWaitingStartTime] = useState<number | null>(null);
  const [waitingTimeDisplay, setWaitingTimeDisplay] = useState<string>('');

  // Update waiting time display every second
  useEffect(() => {
    if (!waitingForPrice || !waitingStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - waitingStartTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      
      if (minutes > 0) {
        setWaitingTimeDisplay(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setWaitingTimeDisplay(`${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [waitingForPrice, waitingStartTime]);

  // Play notification sound when price arrives
  const playNotificationSound = useCallback(() => {
    try {
      // Create a pleasant notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // First tone
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 587; // D5
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      
      // Second tone (higher)
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 880; // A5
      oscillator2.type = 'sine';
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.5);
      
      console.log('🔔 Notification sound played');
    } catch (error) {
      console.log('🔔 Could not play notification sound:', error);
    }
  }, []);

  // Realtime subscription for price updates from admin
  useEffect(() => {
    if (!waitingForPrice || !visitorId) return;

    console.log('🔔 Setting up realtime subscription for price updates, visitorId:', visitorId);
    
    // Set waiting start time
    setWaitingStartTime(Date.now());

    const channel = supabase
      .channel(`price-updates-${visitorId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quick_booking_requests',
          filter: `customer_session_id=eq.${visitorId}`
        },
        (payload) => {
          console.log('🔔 Price update received:', payload);
          
          const newRecord = payload.new as any;
          
          // Check if price was added
          if (newRecord.price && newRecord.price > 0) {
            // Play notification sound
            playNotificationSound();
            
            const priceMessage = language === 'TR'
              ? `Harika haber! 🎉 Operasyon yetkilimiz fiyatı belirledi. ${newRecord.vehicle_type === 'mercedes-vito' ? 'Mercedes Vito' : newRecord.vehicle_type} için fiyatınız: **${newRecord.price_currency === 'TRY' ? '₺' : '€'}${newRecord.price}**. Devam etmek ister misiniz?`
              : `Great news! 🎉 Our operations officer has set the price. Your price for ${newRecord.vehicle_type === 'mercedes-vito' ? 'Mercedes Vito' : newRecord.vehicle_type}: **${newRecord.price_currency === 'TRY' ? '₺' : '€'}${newRecord.price}**. Would you like to proceed?`;
            
            // Add message from AI
            setMessages(prev => [...prev, {
              id: `price-update-${Date.now()}`,
              role: 'assistant',
              content: priceMessage
            }]);
            
            setWaitingForPrice(false);
            setWaitingStartTime(null);
            setWaitingTimeDisplay('');
            
            // Speak the message if voice is enabled
            if (isVoiceEnabled) {
              speak(priceMessage);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 Cleaning up price update subscription');
      supabase.removeChannel(channel);
      setWaitingStartTime(null);
    };
  }, [waitingForPrice, visitorId, language, isVoiceEnabled, speak, playNotificationSound]);

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

  // Detect Android device
  const isAndroidDevice = useCallback(() => {
    return /Android/i.test(navigator.userAgent);
  }, []);

  // Robust keyboard detection using visualViewport API
  useEffect(() => {
    if (!mobileFloating || !isOpen) {
      setKeyboardHeight(0);
      baselineViewportHeightRef.current = 0;
      return;
    }

    const viewport = window.visualViewport;
    const isIOS = isIOSDevice();
    const isAndroid = isAndroidDevice();
    
    // Capture baseline viewport "bottom" when keyboard is definitely closed.
    // We store (height + offsetTop) so iOS/Android viewport shifting is handled.
    const captureBaseline = () => {
      if (viewport) {
        baselineViewportHeightRef.current = viewport.height + (viewport.offsetTop || 0);
      } else {
        baselineViewportHeightRef.current = window.innerHeight;
      }
    };

    // Initial baseline capture
    setTimeout(captureBaseline, 100);

    const handleViewportChange = () => {
      if (!viewport) return;

      const currentBottom = viewport.height + (viewport.offsetTop || 0);
      const baselineBottom = baselineViewportHeightRef.current || window.innerHeight;

      const rawInset = Math.max(0, baselineBottom - currentBottom);
      const threshold = isIOS ? 60 : 90;
      const keyboardInset = rawInset > threshold ? rawInset : 0;

      // If keyboard is closed and viewport grew (rotation/address bar), refresh baseline.
      if (keyboardInset === 0 && currentBottom > baselineBottom) {
        baselineViewportHeightRef.current = currentBottom;
      }

      setKeyboardHeight(Math.round(keyboardInset));

      // When keyboard opens, scroll input into view
      if (keyboardInset > 0 && inputRef.current) {
        requestAnimationFrame(() => {
          if (isIOS) {
            inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
          if (isAndroid) {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        });
      }
    };

    // Focus handler - explicitly handle keyboard appearance
    const handleFocusIn = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        return;
      }
      
      // iOS needs longer delay for keyboard animation
      const delay = isIOS ? 400 : 300;
      
      setTimeout(() => {
        handleViewportChange();
        
        // Extra scroll for iOS to ensure input is visible
        if (isIOS && inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, delay);
    };

    // Blur handler - reset keyboard height
    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement;
        if (activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
          setKeyboardHeight(0);
        }
      }, 150);
    };

    // Listen to visualViewport resize
    if (viewport) {
      viewport.addEventListener('resize', handleViewportChange);
      viewport.addEventListener('scroll', handleViewportChange);
    }
    
    // Also listen to window resize as fallback
    window.addEventListener('resize', handleViewportChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Initial check
    handleViewportChange();

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', handleViewportChange);
        viewport.removeEventListener('scroll', handleViewportChange);
      }
      window.removeEventListener('resize', handleViewportChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [mobileFloating, isOpen, isIOSDevice, isAndroidDevice]);

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

  // Track if we've spoken the welcome message
  const hasSpokenWelcomeRef = useRef(false);
  const welcomeMessageRef = useRef<string | null>(null);
  const userInteractedRef = useRef(false);

  // Track user interaction for autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      userInteractedRef.current = true;
      console.log('🎙️ [Welcome] User interaction detected');
    };
    
    // Listen for any user interaction
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  // Track previous language to detect changes
  const prevLanguageRef = useRef(language);

  // Add welcome message when opened and no messages, or update when language changes
  useEffect(() => {
    const languageChanged = prevLanguageRef.current !== language;
    prevLanguageRef.current = language;
    
    if (isOpen) {
      const welcomeMessage = welcomeMessages[language] || welcomeMessages.EN;
      
      // If no messages or only the welcome message exists, set/update it
      if (messages.length === 0 || (messages.length === 1 && messages[0].id === "welcome")) {
        setMessages([{
          id: "welcome",
          role: "assistant",
          content: welcomeMessage
        }]);
        
        // Store the welcome message for speaking after voices are loaded
        if (!hasSpokenWelcomeRef.current) {
          welcomeMessageRef.current = welcomeMessage;
        }
        
        // If language changed, speak the new welcome message
        if (languageChanged && isVoiceEnabled) {
          hasSpokenWelcomeRef.current = false;
          welcomeMessageRef.current = welcomeMessage;
          setTimeout(() => {
            if (!hasSpokenWelcomeRef.current && isVoiceEnabled) {
              hasSpokenWelcomeRef.current = true;
              speak(welcomeMessage);
            }
          }, 300);
        }
      }
    }
  }, [isOpen, language, messages.length, isVoiceEnabled, speak]);

  // Load detected country code from localStorage and hide banner after delay
  useEffect(() => {
    if (isOpen) {
      try {
        // Try to get country code from geo detection storage
        const geoData = localStorage.getItem('meet_transfer_geo_country');
        if (geoData) {
          setDetectedCountryCode(geoData);
        }
      } catch {
        // Ignore storage errors
      }
      
      // Show banner for 5 seconds then hide
      setShowLanguageBanner(true);
      const timer = setTimeout(() => {
        setShowLanguageBanner(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  const speakWelcome = useCallback(() => {
    if (!welcomeMessageRef.current || hasSpokenWelcomeRef.current || !isVoiceEnabled) {
      console.log('🎙️ [Welcome] speakWelcome skipped:', {
        hasMessage: !!welcomeMessageRef.current,
        alreadySpoken: hasSpokenWelcomeRef.current,
        voiceEnabled: isVoiceEnabled
      });
      return;
    }
    
    console.log('🎙️ [Welcome] speakWelcome called with ElevenLabs');
    
    hasSpokenWelcomeRef.current = true;
    const messageToSpeak = welcomeMessageRef.current;
    welcomeMessageRef.current = null;
    
    console.log('🎙️ [Welcome] ✅ Speaking welcome message:', messageToSpeak.substring(0, 30) + '...');
    
    // Small delay for UI stability, then speak
    setTimeout(() => {
      console.log('🎙️ [Welcome] Calling speak() now with ElevenLabs...');
      speak(messageToSpeak);
    }, 300);
  }, [isVoiceEnabled, speak]);

  // Auto-speak welcome message when chat is opened
  useEffect(() => {
    console.log('🎙️ [Welcome] Effect check:', {
      welcomeMessage: welcomeMessageRef.current?.substring(0, 30),
      hasSpokenWelcome: hasSpokenWelcomeRef.current,
      isVoiceEnabled,
      isOpen
    });
    
    // Opening the chat IS a user interaction, so we can speak
    if (isOpen && welcomeMessageRef.current && !hasSpokenWelcomeRef.current && isVoiceEnabled) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        speakWelcome();
      }, 600);
    } else if (welcomeMessageRef.current && !isVoiceEnabled) {
      console.log('🎙️ [Welcome] ⚠️ Voice disabled, not speaking welcome');
      // IMPORTANT: Do NOT auto-start microphone recording.
      // Guest/user must explicitly start recording (tap mic).
    }
  }, [isVoiceEnabled, speakWelcome, isOpen, isRecording, isProcessing]);

  // Reset the spoken flag when chat is closed
  useEffect(() => {
    if (!isOpen) {
      hasSpokenWelcomeRef.current = false;
      welcomeMessageRef.current = null;
      hasAutoStartedRef.current = false;
    }
  }, [isOpen]);

  // Show help tooltip animation after page load
  useEffect(() => {
    // Only show tooltip when chat is closed
    if (isOpen) {
      setShowHelpTooltip(false);
      if (helpTooltipTimerRef.current) {
        clearTimeout(helpTooltipTimerRef.current);
      }
      return;
    }

    // Show tooltip after 3 seconds delay
    helpTooltipTimerRef.current = setTimeout(() => {
      setShowHelpTooltip(true);
      
      // Hide tooltip after 5 seconds
      helpTooltipTimerRef.current = setTimeout(() => {
        setShowHelpTooltip(false);
      }, 5000);
    }, 3000);

    return () => {
      if (helpTooltipTimerRef.current) {
        clearTimeout(helpTooltipTimerRef.current);
      }
    };
  }, [isOpen]);
  
  // Auto-start recording after welcome message when voice is disabled or not available
  // Disabled: never auto-start microphone recording. User must opt-in.
  useEffect(() => {
    // no-op
  }, []);

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

    // Close keyboard on mobile by blurring input
    if (mobileFloating && inputRef.current) {
      inputRef.current.blur();
    }

    // Scroll to bottom to show user message immediately
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });

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
          customerName,
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

      // Check for FORM_REDIRECT command and clean it from display
      const hasFormRedirect = fullContent.includes('[FORM_REDIRECT]');
      const cleanedContent = fullContent.replace(/\[FORM_REDIRECT\]/g, '').trim();

      // Parse booking data from the complete response
      const bookingData = extractBookingDataFromResponse(cleanedContent);

      // Detect return transfer question patterns
      const returnQuestionPatterns = [
        /dönüş.*transfer.*ister.*mi/i,
        /dönüş.*ister.*mi/i,
        /return.*transfer.*want/i,
        /want.*return.*transfer/i,
        /round.*trip/i,
        /iki.*yön/i,
        /gidiş.*dönüş/i,
      ];
      const showReturnQuestion = returnQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect vehicle selection question patterns
      const vehicleQuestionPatterns = [
        /hangi.*araç/i,
        /araç.*tipi/i,
        /araç.*seç/i,
        /which.*vehicle/i,
        /vehicle.*type/i,
        /choose.*vehicle/i,
        /select.*vehicle/i,
        /sedan.*minivan/i,
        /welches.*fahrzeug/i,
        /quel.*véhicule/i,
        /какой.*автомобиль/i,
      ];
      const showVehicleSelection = vehicleQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect payment method question patterns
      const paymentQuestionPatterns = [
        /ödeme.*yöntemi/i,
        /nasıl.*ödeme/i,
        /ödeme.*şekli/i,
        /payment.*method/i,
        /how.*pay/i,
        /pay.*card.*cash/i,
        /zahlungsmethode/i,
        /comment.*payer/i,
        /способ.*оплаты/i,
      ];
      const showPaymentMethod = paymentQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect passenger count question patterns
      const passengerQuestionPatterns = [
        /kaç.*kişi/i,
        /kaç.*yolcu/i,
        /how.*many.*passenger/i,
        /number.*passenger/i,
        /wie.*viele.*passagiere/i,
        /combien.*passager/i,
        /сколько.*пассажир/i,
      ];
      const showPassengerCount = passengerQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect extras question patterns
      const extrasQuestionPatterns = [
        /bebek.*koltuk/i,
        /ekstra.*hizmet/i,
        /child.*seat/i,
        /baby.*seat/i,
        /extra.*luggage/i,
        /additional.*service/i,
        /kindersitz/i,
        /siège.*enfant/i,
        /детское.*кресло/i,
      ];
      const showExtras = extrasQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect airport selection patterns (when user just says "istanbul" without specifying airport)
      const airportSelectionPatterns = [
        /hangi.*havalimanı/i,
        /hangi.*havaalanı/i,
        /which.*airport/i,
        /ist.*veya.*saw/i,
        /ist.*mi.*saw.*mı/i,
        /ist.*or.*saw/i,
        /istanbul.*havalimanı.*mı.*sabiha/i,
        /istanbul.*airport.*or.*sabiha/i,
        /welcher.*flughafen/i,
        /quel.*aéroport/i,
        /какой.*аэропорт/i,
      ];
      const showAirportSelection = airportSelectionPatterns.some(pattern => pattern.test(cleanedContent));

      // Detect date/time question patterns
      const dateTimeQuestionPatterns = [
        /ne.*zaman/i,
        /hangi.*tarih/i,
        /hangi.*gün/i,
        /tarih.*nedir/i,
        /tarih.*seç/i,
        /saat.*kaç/i,
        /ne.*saat/i,
        /hangi.*saat/i,
        /when/i,
        /what.*date/i,
        /which.*date/i,
        /pickup.*date/i,
        /transfer.*date/i,
        /what.*time/i,
        /which.*time/i,
        /pickup.*time/i,
        /wann/i,
        /welches.*datum/i,
        /um.*wieviel.*uhr/i,
        /quelle.*date/i,
        /à.*quelle.*heure/i,
        /когда/i,
        /какая.*дата/i,
        /во.*сколько/i,
        /cuándo/i,
        /qué.*fecha/i,
        /a.*qué.*hora/i,
        /quando/i,
        /quale.*data/i,
        /che.*ora/i,
      ];
      const showDateTimePicker = dateTimeQuestionPatterns.some(pattern => pattern.test(cleanedContent));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: cleanResponseForDisplay(cleanedContent),
        bookingData,
        showRedirectButton: hasFormRedirect,
        showReturnQuestion,
        showVehicleSelection,
        showPaymentMethod,
        showPassengerCount,
        showExtras,
        showAirportSelection,
        showDateTimePicker,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak the assistant response (stop any ongoing speech first to prevent overlap)
      if (isVoiceEnabled) {
        stopSpeaking(); // Prevent audio overlap
        // Small delay to ensure previous audio is fully stopped
        setTimeout(() => speak(assistantMessage.content), 100);
      }
      
      // Auto-sync booking data to form whenever we have new data
      // This ensures date, time, and other fields stay synchronized
      if (bookingData && onApplyBooking) {
        const hasUsefulData = bookingData.pickup || bookingData.dropoff || 
                              bookingData.date || bookingData.time || 
                              bookingData.passengers || bookingData.vehicleType;
        
        if (hasUsefulData) {
          console.log("[AI Assistant] Auto-syncing booking data to form:", bookingData);
          
          // Test mode logging for each step
          if (testContext?.smokeTestConfig.enabled) {
            if (bookingData.pickup) {
              testContext.updateStep('pickup', bookingData.pickup);
              testContext.setCurrentStep('dropoff');
            }
            if (bookingData.dropoff) {
              testContext.updateStep('dropoff', bookingData.dropoff);
              testContext.setCurrentStep('date');
            }
            if (bookingData.date) {
              testContext.updateStep('date', bookingData.date);
              testContext.setCurrentStep('time');
            }
            if (bookingData.time) {
              testContext.updateStep('time', bookingData.time);
              testContext.setCurrentStep('passengers');
            }
            if (bookingData.passengers) {
              testContext.updateStep('passengers', bookingData.passengers);
              testContext.setCurrentStep('vehicle');
            }
            if (bookingData.vehicleType) {
              testContext.updateStep('vehicle', bookingData.vehicleType);
              testContext.setCurrentStep('confirmation');
            }
            if (bookingData.paymentMethod) {
              testContext.updateStep('payment', bookingData.paymentMethod);
            }
            if (bookingData.hasReturnTrip !== null && bookingData.hasReturnTrip !== undefined) {
              testContext.updateStep('returnTrip', bookingData.hasReturnTrip ? 'Yes' : 'No');
            }
            testContext.log('Booking data updated', bookingData);
          }
          
          // Small delay so user can see the message first
          setTimeout(() => {
            onApplyBooking(bookingData);
          }, hasFormRedirect ? 1500 : 500);
        }
      }

      // If booking has some data, make a non-streaming call to get additional info
      if (bookingData?.pickup && bookingData?.dropoff && bookingData?.passengers) {
        console.log("Making non-streaming call for additional data...");
        
        // Make a non-streaming call to get vehicle prices and other data
        const { data: bookingResult, error: bookingError } = await supabase.functions.invoke("booking-assistant", {
          body: { 
            message: userMessage.content, 
            language,
            conversationHistory,
            visitorId,
            customerName,
            stream: false
          }
        });
        
        // Update customer name if returned
        if (bookingResult?.customerName && !customerName) {
          setCustomerName(bookingResult.customerName);
        }

        // Update the assistant message with vehicle cards, features and redirect button
        if (bookingResult?.showVehicleCards || bookingResult?.showRedirectButton || bookingResult?.vehiclePrices || bookingResult?.showVehicleFeatures) {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIdx = newMessages.findIndex(m => m.id === assistantMessage.id);
            if (lastIdx !== -1) {
              newMessages[lastIdx] = {
                ...newMessages[lastIdx],
                showVehicleCards: bookingResult?.showVehicleCards || false,
                showRedirectButton: bookingResult?.showRedirectButton || false,
                showVehicleFeatures: bookingResult?.showVehicleFeatures || false,
                vehiclePrices: bookingResult?.vehiclePrices || undefined,
                vehicleFeatures: bookingResult?.vehicleFeatures || undefined,
                passengerCount: bookingResult?.passengerCount || bookingData?.passengers || 2,
                babySeatCount: bookingResult?.babySeatCount || 0,
                luggageCount: bookingResult?.luggageCount || null
              };
            }
            return newMessages;
          });
        }

        // If price request was sent to admin, set waiting state
        if (bookingResult?.priceRequestSent) {
          console.log("Price request sent to admin, setting up realtime subscription...");
          setWaitingForPrice(true);
        }

        if (!bookingError && bookingResult?.quickBookingId && bookingResult?.confirmationToken) {
          console.log("Booking created! Setting up redirect button...");
          setBookingCreated({ id: bookingResult.quickBookingId, token: bookingResult.confirmationToken });
          
          // Update the message to show redirect button instead of auto-navigating
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIdx = newMessages.findIndex(m => m.id === assistantMessage.id);
            if (lastIdx !== -1) {
              newMessages[lastIdx] = {
                ...newMessages[lastIdx],
                showRedirectButton: true,
                vehiclePrices: bookingResult?.vehiclePrices || undefined,
                passengerCount: bookingResult?.passengerCount || bookingData?.passengers || 2
              };
            }
            return newMessages;
          });
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
    // Remove all JSON blocks from display (booking, customerName, discount, readyToBook, priceRequest)
    return response
      .replace(/```booking[\s\S]*?```/g, '')
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```customerName[\s\S]*?```/g, '')
      .replace(/```discount[\s\S]*?```/g, '')
      .replace(/```readyToBook[\s\S]*?```/g, '')
      .replace(/```priceRequest[\s\S]*?```/g, '')
      .replace(/\{"needed":\s*true[^}]*\}/g, '') // Fallback for unformatted priceRequest JSON
      .trim();
  };

  const markdownComponents = {
    // Use div instead of p to avoid validateDOMNesting warning (div inside p)
    p: ({ children }: any) => <div className="m-0 whitespace-pre-wrap">{children}</div>,
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
    // Apply booking data to the form first
    if (onApplyBooking) {
      onApplyBooking(data);
    }
    setIsOpen(false);
    
    // Navigate to /book page with booking data
    const params = new URLSearchParams();
    if (data.pickup) params.set("pickup", data.pickup);
    if (data.dropoff) params.set("dropoff", data.dropoff);
    if (data.date) params.set("date", data.date);
    if (data.time) params.set("time", data.time);
    if (data.passengers) params.set("passengers", data.passengers.toString());
    if (data.vehicleType) params.set("vehicleType", data.vehicleType);
    if (data.estimatedPrice) params.set("estimatedPrice", data.estimatedPrice.toString());
    if (data.currency) params.set("currency", data.currency);
    
    navigate(`/book?${params.toString()}`);
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

  // Help tooltip messages
  const helpTooltipMessages: Record<string, string[]> = {
    TR: ["Size yardımcı olabilirim! 🙋‍♀️", "Benimle daha kolay! ✨", "Rezervasyon yapayım mı? 🚗", "Sadece söyleyin, hallederim! 💪", "Transfer mi? Hemen ayarlayalım! 🚙"],
    EN: ["I can help you! 🙋‍♀️", "It's easier with me! ✨", "Shall I book for you? 🚗", "Just tell me, I'll handle it! 💪", "Need a transfer? Let's arrange it! 🚙"],
    DE: ["Ich kann Ihnen helfen! 🙋‍♀️", "Es ist einfacher mit mir! ✨", "Soll ich für Sie buchen? 🚗", "Sagen Sie mir einfach Bescheid! 💪", "Transfer gesucht? Ich arrangiere es! 🚙"],
    FR: ["Je peux vous aider! 🙋‍♀️", "C'est plus facile avec moi! ✨", "Je réserve pour vous? 🚗", "Dites-moi, je m'en occupe! 💪", "Besoin d'un transfert? Organisons-le! 🚙"],
    RU: ["Я могу вам помочь! 🙋‍♀️", "Со мной проще! ✨", "Забронировать для вас? 🚗", "Скажите мне, я всё сделаю! 💪", "Нужен трансфер? Организуем! 🚙"],
    AR: ["يمكنني مساعدتك! 🙋‍♀️", "معي أسهل! ✨", "هل أحجز لك؟ 🚗", "فقط أخبرني! 💪", "تحتاج نقل؟ سأرتبه! 🚙"],
    ES: ["¡Puedo ayudarte! 🙋‍♀️", "¡Es más fácil conmigo! ✨", "¿Reservo para ti? 🚗", "¡Dímelo, yo me encargo! 💪", "¿Necesitas transfer? ¡Lo arreglo! 🚙"],
    IT: ["Posso aiutarti! 🙋‍♀️", "È più facile con me! ✨", "Prenoto per te? 🚗", "Dimmi, ci penso io! 💪", "Serve un transfer? Lo organizzo! 🚙"],
  };

  const getRandomHelpMessage = useCallback(() => {
    const messages = helpTooltipMessages[language] || helpTooltipMessages.EN;
    return messages[Math.floor(Math.random() * messages.length)];
  }, [language]);

  // Show tooltip every 30 seconds with different messages
  useEffect(() => {
    if (!mobileFloating || isOpen) {
      // Clear timers when chat is open
      if (helpTooltipTimerRef.current) {
        clearTimeout(helpTooltipTimerRef.current);
        helpTooltipTimerRef.current = null;
      }
      if (tooltipIntervalRef.current) {
        clearInterval(tooltipIntervalRef.current);
        tooltipIntervalRef.current = null;
      }
      setShowHelpTooltip(false);
      return;
    }

    // Show first tooltip after 3 seconds
    helpTooltipTimerRef.current = setTimeout(() => {
      setCurrentTooltipMessage(getRandomHelpMessage());
      setShowHelpTooltip(true);
      
      // Hide after 5 seconds
      setTimeout(() => setShowHelpTooltip(false), 5000);
    }, 3000);

    // Then show tooltip every 30 seconds with a new random message
    tooltipIntervalRef.current = setInterval(() => {
      if (!isOpen) {
        setCurrentTooltipMessage(getRandomHelpMessage());
        setShowHelpTooltip(true);
        
        // Hide after 5 seconds
        setTimeout(() => setShowHelpTooltip(false), 5000);
      }
    }, 30000);

    return () => {
      if (helpTooltipTimerRef.current) {
        clearTimeout(helpTooltipTimerRef.current);
      }
      if (tooltipIntervalRef.current) {
        clearInterval(tooltipIntervalRef.current);
      }
    };
  }, [mobileFloating, isOpen, getRandomHelpMessage]);

  // Handle first-time user click with onboarding animation
  const handleAIButtonClick = useCallback(() => {
    if (isFirstTimeUser) {
      setShowOnboarding(true);
      markOnboardingSeen();
      setIsFirstTimeUser(false);
      
      // Show onboarding for 2 seconds before opening chat
      setTimeout(() => {
        setShowOnboarding(false);
        setIsOpen(true);
      }, 2000);
    } else {
      setIsOpen(true);
    }
  }, [isFirstTimeUser]);

  // Onboarding messages
  const onboardingMessages: Record<string, { title: string; subtitle: string }> = {
    TR: { title: "Merhaba! Ben MT 🤖", subtitle: "Size transfer rezervasyonunda yardımcı olacağım!" },
    EN: { title: "Hello! I'm MT 🤖", subtitle: "I'll help you with your transfer booking!" },
    DE: { title: "Hallo! Ich bin MT 🤖", subtitle: "Ich helfe Ihnen bei Ihrer Transfer-Buchung!" },
    FR: { title: "Bonjour! Je suis MT 🤖", subtitle: "Je vous aide pour votre réservation de transfert!" },
    RU: { title: "Привет! Я MT 🤖", subtitle: "Помогу вам с бронированием трансфера!" },
    AR: { title: "مرحباً! أنا MT 🤖", subtitle: "سأساعدك في حجز النقل!" },
    ES: { title: "¡Hola! Soy MT 🤖", subtitle: "¡Te ayudaré con tu reserva de transfer!" },
    IT: { title: "Ciao! Sono MT 🤖", subtitle: "Ti aiuterò con la prenotazione del transfer!" },
  };

  // Mobile floating mode - only show floating button and panel
  if (mobileFloating) {
    return (
      <>
        {/* Onboarding Animation Overlay */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/90 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center gap-4 text-center px-8"
              >
                {/* Animated Robot Icon */}
                <motion.div
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/40"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Bot className="h-12 w-12 text-primary-foreground" />
                </motion.div>
                
                {/* Welcome Text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {(onboardingMessages[language] || onboardingMessages.EN).title}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {(onboardingMessages[language] || onboardingMessages.EN).subtitle}
                  </p>
                </motion.div>
                
                {/* Animated Features */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex gap-3 mt-2"
                >
                  {['🚗', '✈️', '💬'].map((emoji, i) => (
                    <motion.div
                      key={i}
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl"
                      animate={{ 
                        y: [0, -8, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Loading indicator */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex gap-1 mt-4"
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        duration: 0.6, 
                        repeat: Infinity, 
                        delay: i * 0.15 
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Floating Toggle Button - More prominent with animation */}
        <AnimatePresence>
          {!isOpen && !showOnboarding && (
            <>
              {/* Animated Help Tooltip */}
              <AnimatePresence>
                {showHelpTooltip && (
                  <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed bottom-[calc(9.5rem+env(safe-area-inset-bottom))] right-[5rem] z-[9999] pointer-events-none"
                  >
                    <div className="relative bg-card border-2 border-primary/30 rounded-2xl shadow-xl px-4 py-2.5">
                      {/* Hand wave animation */}
                      <motion.span
                        className="absolute -left-3 -top-3 text-2xl"
                        animate={{ 
                          rotate: [0, 20, -10, 20, 0],
                          scale: [1, 1.1, 1, 1.1, 1]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          ease: "easeInOut"
                        }}
                      >
                        👋
                      </motion.span>
                      
                      <p className="text-sm font-medium text-foreground whitespace-nowrap pr-2">
                        {currentTooltipMessage || getRandomHelpMessage()}
                      </p>
                      
                      {/* Arrow pointing to button */}
                      <div className="absolute right-[-8px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-card" />
                      <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent border-l-primary/30" style={{ zIndex: -1 }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <MobileTooltip
                content={
                  <span className="font-medium">
                    {language === "TR" ? "AI Rezervasyon Asistanı" : "AI Booking Assistant"}
                  </span>
                }
                side="right"
                contentClassName="bg-primary text-primary-foreground border border-primary"
                longPressThreshold={400}
                autoHideDelay={2500}
              >
                <motion.button
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAIButtonClick}
                  data-chat-trigger
                  className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-3 z-[60] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-xl touch-manipulation border-2 border-primary-foreground/20"
                  style={{
                    WebkitTapHighlightColor: "transparent",
                    boxShadow:
                      "0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 3px hsl(var(--primary) / 0.2)",
                  }}
                >
                  {/* First-time user attention effect */}
                  {isFirstTimeUser && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary"
                        animate={{ scale: [1, 1.8, 1.8], opacity: [0.6, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary"
                        animate={{ scale: [1, 1.5, 1.5], opacity: [0.4, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                    </>
                  )}
                  
                  {/* Attention-grabbing pulse when tooltip is shown */}
                  {showHelpTooltip && !isFirstTimeUser && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-primary"
                      animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                  
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </motion.div>
                  <span className="font-bold text-sm">AI</span>
                  <motion.span
                    className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.button>
              </MobileTooltip>
            </>
          )}
        </AnimatePresence>

        {/* Mobile Backdrop - Separate layer for iOS tap reliability */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              data-mobile-backdrop
              className="fixed inset-0 z-[70]"
              style={{ 
                touchAction: 'manipulation',
                WebkitBackdropFilter: 'blur(12px)',
                backdropFilter: 'blur(12px)',
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)'
              }}
            />
          )}
        </AnimatePresence>

        {/* Mobile Floating Panel - Optimized for small screens */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.1, bottom: 0.3 }}
              dragSnapToOrigin
              dragMomentum={false}
              onDragEnd={(_, info) => {
                // Swipe down to close - always close on swipe down (regardless of fullscreen)
                // More sensitive + never leave panel in a "stuck" offset state.
                const offsetThreshold = 60;
                const velocityThreshold = 250;

                if (info.offset.y > offsetThreshold || info.velocity.y > velocityThreshold) {
                  if (isFullscreen) {
                    setPanelHeight(previousHeightRef.current);
                    setIsFullscreen(false);
                  }
                  setIsOpen(false);
                }
              }}
              data-mobile-panel
              className={cn(
                "fixed inset-x-0 z-[80] bg-card shadow-2xl border-t border-border flex flex-col transition-all duration-300",
                isFullscreen ? "rounded-none" : "rounded-t-2xl"
              )}
              style={{
                // Position panel above keyboard - user adjustable size or fullscreen
                top: keyboardHeight > 0 ? '0.5rem' : isFullscreen ? 0 : `${100 - panelHeight}%`,
                bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 0,
                maxHeight: keyboardHeight > 0 
                  ? `calc(100% - ${keyboardHeight}px - 0.5rem)` 
                  : isFullscreen ? '100%' : `${panelHeight}%`,
                minHeight: '200px',
                touchAction: 'auto',
                pointerEvents: 'auto',
                paddingBottom: '0',
              }}
            >
                {/* Swipe Handle - Drag down to close OR hold to resize */}
                 <div 
                   className={cn(
                     "flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing shrink-0 transition-colors select-none",
                     isDraggingResize && "bg-primary/10"
                   )}
                   style={{ touchAction: 'none' }}
                   onPointerDown={(e) => {
                     // Start the framer-motion drag (swipe to close)
                     dragControls.start(e);
                   }}
                 >
                   <div className={cn(
                     "w-12 h-1.5 rounded-full transition-all",
                     "bg-muted-foreground/40 hover:bg-muted-foreground/60"
                   )} />
                 </div>
                
                {/* Mobile Header - More Compact with safe area in fullscreen */}
                <div 
                  className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 shrink-0"
                  style={{
                    paddingTop: isFullscreen ? 'max(0.375rem, env(safe-area-inset-top))' : '0.375rem'
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                    <span className="font-medium text-xs">
                      {language === "TR" ? "AI Asistan" : "AI Assistant"}
                    </span>
                    <span className="px-1 py-0.5 bg-primary/80 text-primary-foreground text-[7px] font-bold rounded">
                      NEW
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (isFullscreen) {
                          // Exit fullscreen - restore previous height
                          setPanelHeight(previousHeightRef.current);
                          setIsFullscreen(false);
                        } else {
                          // Enter fullscreen - save current height
                          previousHeightRef.current = panelHeight;
                          setPanelHeight(100);
                          setIsFullscreen(true);
                        }
                      }}
                      className="h-6 w-6 rounded-full"
                      title={isFullscreen ? (language === "TR" ? "Küçült" : "Exit Fullscreen") : (language === "TR" ? "Tam Ekran" : "Fullscreen")}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <Maximize2 className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearConversation}
                      className="h-6 w-6 rounded-full"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsOpen(false)}
                      className="h-6 w-6 rounded-full"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Messages - Flexible scroll area */}
                <ScrollArea className="flex-1 min-h-0 overflow-y-auto pb-16">
                  <div className="p-2.5 space-y-2">
                    {messages.map((msg, msgIndex) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start"
                        )}
                      >
                        {msg.role === "assistant" && (
                          <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Bot className="h-2 w-2 text-primary" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[82%] rounded-xl px-2.5 py-1.5 text-[12px] leading-relaxed relative",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                            speakingMessageId === msg.id && isSpeaking && msg.role === "assistant" && "ring-2 ring-primary/30"
                          )}
                        >
                          {/* Speaking overlay for active message */}
                          {msg.role === "assistant" && (
                            <SpeakingBubbleOverlay 
                              isActive={speakingMessageId === msg.id && isSpeaking} 
                              variant="mobile" 
                            />
                          )}
                          {/* Language Detection Banner - Show on welcome message */}
                          {msg.id === "welcome" && showLanguageBanner && (
                            <ChatLanguageDetectedBanner
                              language={language}
                              countryCode={detectedCountryCode || undefined}
                              className="mb-2"
                            />
                          )}
                          {msg.role === "assistant" ? (
                            <div className="relative group">
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {cleanResponseForDisplay(msg.content)}
                              </ReactMarkdown>
                              {/* Read Aloud Button - Mobile */}
                              <button
                                onClick={() => {
                                  if (speakingMessageId === msg.id && isSpeaking) {
                                    stopSpeaking();
                                  } else {
                                    speakMessage(msg.id, msg.content);
                                  }
                                }}
                                className={cn(
                                  "mt-1.5 flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all",
                                  speakingMessageId === msg.id && isSpeaking
                                    ? "bg-primary/20 text-primary"
                                    : "bg-muted-foreground/10 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                )}
                              >
                                {speakingMessageId === msg.id && isSpeaking ? (
                                  <>
                                    <SoundWaveInline isPlaying={true} className="text-primary" />
                                    <span>{language === "TR" ? "Durdur" : "Stop"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-2.5 w-2.5" />
                                    <span>{language === "TR" ? "Sesli Oku" : "Read Aloud"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            msg.content
                          )}
                          
                          {/* Vehicle Cards for Mobile */}
                          {/* Vehicle Cards for Mobile - show 2x2 quick select when vehicle selection is needed */}
                          {/* Only show on LAST message, hide if isComplete is explicitly true (user made selection) */}
                          {msgIndex === messages.length - 1 && !isLoading && (((msg.showVehicleCards && msg.vehiclePrices) || msg.showVehicleSelection)) && !msg.bookingData?.isComplete && (
                            <ChatVehicleCards
                              passengers={msg.passengerCount || msg.bookingData?.passengers || 2}
                              prices={msg.vehiclePrices}
                              currency={msg.bookingData?.currency || "EUR"}
                              selectedVehicle={msg.bookingData?.vehicleType || undefined}
                              language={language}
                              discountPercentage={msg.bookingData?.discountPercentage || undefined}
                              hasReturnTrip={msg.bookingData?.hasReturnTrip || false}
                              returnDiscountPercentage={25}
                              onSelectVehicle={(vehicleType) => {
                                // Sync all booking data to form when vehicle is selected
                                if (onApplyBooking) {
                                  const syncData: Partial<BookingData> = { vehicleType };
                                  
                                  // Add passenger count
                                  const passengerCount = msg.passengerCount || msg.bookingData?.passengers;
                                  if (passengerCount) syncData.passengers = passengerCount;
                                  
                                  // Add date if available
                                  if (msg.bookingData?.date) syncData.date = msg.bookingData.date;
                                  
                                  // Add time if available
                                  if (msg.bookingData?.time) syncData.time = msg.bookingData.time;
                                  
                                  // Add locations if available
                                  if (msg.bookingData?.pickup) syncData.pickup = msg.bookingData.pickup;
                                  if (msg.bookingData?.dropoff) syncData.dropoff = msg.bookingData.dropoff;
                                  
                                  console.log("[ChatVehicleCards Mobile] Syncing all data to form:", syncData);
                                  onApplyBooking(syncData as BookingData);
                                }
                                // Update message's bookingData to reflect selection and trigger booking creation
                                setMessages(prev => prev.map((m, i) => 
                                  i === msgIndex 
                                    ? { 
                                        ...m,
                                        showVehicleCards: false,
                                        showVehicleSelection: false,
                                        bookingData: { ...(m.bookingData || ({} as BookingData)), vehicleType, isComplete: true }
                                      }
                                    : m
                                ));
                                
                                // Send a message to confirm vehicle selection and trigger booking creation
                                const vehicleLabels: Record<string, string> = {
                                  'sedan': 'Sedan',
                                  'mercedes-vito': 'Mercedes Vito',
                                  'vip-mercedes': 'Mercedes Vito VIP',
                                  'maybach-minibus': 'Maybach',
                                  'minibus': 'Mercedes Sprinter'
                                };
                                const label = vehicleLabels[vehicleType] || vehicleType;
                                setInput(label);
                                setTimeout(() => {
                                  const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                                  if (submitButton) submitButton.click();
                                }, 100);
                              }}
                            />
                          )}

                          {/* Vehicle Features Card for Mobile */}
                          {msg.showVehicleFeatures && msg.vehicleFeatures && (
                            <ChatVehicleFeaturesCard
                              language={language}
                              features={msg.vehicleFeatures}
                              vehicleType={msg.bookingData?.vehicleType || undefined}
                            />
                          )}

                          {/* Redirect Button removed - only show inside booking summary card */}
                          
                          {/* Booking Summary Card for Mobile - Show after vehicle selection */}
                          {msg.bookingData && msg.bookingData.vehicleType && msg.vehiclePrices && (
                            <div className="mt-3 p-3 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border shadow-lg">
                              {/* Header with Vehicle & Price */}
                              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/50">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-sm text-foreground">
                                      {msg.bookingData.vehicleType === 'sedan' ? 'Sedan' :
                                       msg.bookingData.vehicleType === 'mercedes-vito' ? 'Mercedes Vito' :
                                       msg.bookingData.vehicleType === 'vip-mercedes' ? 'Mercedes Vito VIP' :
                                       msg.bookingData.vehicleType === 'maybach-minibus' ? 'Maybach' :
                                       msg.bookingData.vehicleType === 'minibus' ? 'Mercedes Sprinter' :
                                       msg.bookingData.vehicleType}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      {msg.bookingData.passengers || 2} {language === "TR" ? "Yolcu" : "Passengers"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
                                    {language === "TR" ? "Toplam Tutar" : "Total"}
                                  </p>
                                  <p className="font-bold text-primary text-xl">
                                    {msg.bookingData.currency === "TRY" ? "₺" : "€"}
                                    {(() => {
                                      const basePrice = msg.vehiclePrices?.[msg.bookingData.vehicleType!] || msg.bookingData.estimatedPrice || 0;
                                      if (msg.bookingData.hasReturnTrip) {
                                        const returnPrice = Math.round(basePrice * 0.75);
                                        return basePrice + returnPrice;
                                      }
                                      return basePrice;
                                    })()}
                                  </p>
                                  {msg.bookingData.hasReturnTrip && (
                                    <p className="text-[9px] text-green-600 font-medium">
                                      {language === "TR" ? "Gidiş + Dönüş" : "Round Trip"} (-25%)
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Trip Details - Professional Layout */}
                              <div className="space-y-2 mb-3">
                                {/* Pickup */}
                                {msg.bookingData.pickup && (
                                  <div className="flex items-start gap-2 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                                      <MapPin className="h-2.5 w-2.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] text-green-600 font-medium uppercase tracking-wide">
                                        {language === "TR" ? "Alış Noktası" : "Pickup"}
                                      </p>
                                      <p className="text-xs font-medium text-foreground truncate">
                                        {msg.bookingData.pickup}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Dropoff */}
                                {msg.bookingData.dropoff && (
                                  <div className="flex items-start gap-2 p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                                      <MapPin className="h-2.5 w-2.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] text-red-600 font-medium uppercase tracking-wide">
                                        {language === "TR" ? "Bırakış Noktası" : "Dropoff"}
                                      </p>
                                      <p className="text-xs font-medium text-foreground truncate">
                                        {msg.bookingData.dropoff}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Date & Time Row */}
                                {(msg.bookingData.date || msg.bookingData.time) && (
                                  <div className="flex gap-2">
                                    {msg.bookingData.date && (
                                      <div className="flex-1 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="h-3 w-3 text-primary" />
                                          <p className="text-[9px] text-primary font-medium uppercase tracking-wide">
                                            {language === "TR" ? "Tarih" : "Date"}
                                          </p>
                                        </div>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">
                                          {new Date(msg.bookingData.date).toLocaleDateString(language === "TR" ? "tr-TR" : "en-US", {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                          })}
                                        </p>
                                      </div>
                                    )}
                                    {msg.bookingData.time && (
                                      <div className="flex-1 p-2 bg-primary/5 rounded-lg border border-primary/10">
                                        <div className="flex items-center gap-1.5">
                                          <Clock className="h-3 w-3 text-primary" />
                                          <p className="text-[9px] text-primary font-medium uppercase tracking-wide">
                                            {language === "TR" ? "Saat" : "Time"}
                                          </p>
                                        </div>
                                        <p className="text-xs font-semibold text-foreground mt-0.5">
                                          {msg.bookingData.time}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Return Trip Info */}
                                {msg.bookingData.hasReturnTrip && msg.bookingData.returnDate && (
                                  <div className="p-2 bg-amber-500/5 rounded-lg border border-amber-500/20">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <ArrowRight className="h-3 w-3 text-amber-600" />
                                      <p className="text-[9px] text-amber-600 font-medium uppercase tracking-wide">
                                        {language === "TR" ? "Dönüş" : "Return"}
                                      </p>
                                    </div>
                                    <p className="text-xs font-semibold text-foreground">
                                      {new Date(msg.bookingData.returnDate).toLocaleDateString(language === "TR" ? "tr-TR" : "en-US", {
                                        day: 'numeric',
                                        month: 'short'
                                      })}
                                      {msg.bookingData.returnTime && ` • ${msg.bookingData.returnTime}`}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2">
                                <Button
                                  onClick={() => handleApplyBooking(msg.bookingData!)}
                                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25"
                                >
                                  <ArrowRight className="h-4 w-4 mr-2" />
                                  {language === "TR" ? "Rezervasyonu Tamamla" : "Complete Booking"}
                                </Button>
                                <ChatRedirectButton
                                  language={language}
                                  bookingToken={bookingCreated?.token}
                                  bookingData={msg.bookingData}
                                  onRedirect={() => handleApplyBooking(msg.bookingData!)}
                                />
                              </div>
                            </div>
                          )}

                          {/* Quick Reply Buttons - Mobile */}
                          {/* Only show on LAST message and hide if already answered (via bookingData flags) */}
                          {msgIndex === messages.length - 1 && !isLoading && !msg.bookingData?.isComplete && (msg.showReturnQuestion || msg.showPaymentMethod || msg.showPassengerCount || msg.showExtras || msg.showAirportSelection) && (
                            <ChatQuickReplyButtons
                              language={language}
                              type={
                                msg.showAirportSelection ? "airport_selection" :
                                msg.showReturnQuestion ? "return_transfer" :
                                msg.showPaymentMethod ? "payment_method" :
                                msg.showPassengerCount ? "passenger_count" :
                                "extras"
                              }
                              onReply={(answer, metadata) => {
                                // Apply metadata to form if available
                                if (metadata && onApplyBooking) {
                                  const partialBookingData: Partial<BookingData> = {};
                                  if (metadata.vehicleType) partialBookingData.vehicleType = metadata.vehicleType;
                                  if (metadata.paymentMethod) partialBookingData.paymentMethod = metadata.paymentMethod;
                                  if (metadata.passengers) partialBookingData.passengers = metadata.passengers;
                                  
                                  if (Object.keys(partialBookingData).length > 0) {
                                    console.log("[QuickReply] Syncing to form:", partialBookingData);
                                    onApplyBooking(partialBookingData as BookingData);
                                  }
                                }
                                
                                // Hide quick reply buttons after selection - update ALL messages' flags
                                setMessages(prev => prev.map((m) => ({ 
                                  ...m,
                                  showReturnQuestion: false,
                                  showPaymentMethod: false,
                                  showPassengerCount: false,
                                  showExtras: false,
                                  showAirportSelection: false,
                                })));
                                
                                setInput(answer);
                                setTimeout(() => {
                                  const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                                  if (submitButton) submitButton.click();
                                }, 100);
                              }}
                              disabled={isLoading}
                            />
                          )}

                          {/* Date Time Picker - Mobile */}
                          {/* Hide picker if date AND time are already selected */}
                          {msgIndex === messages.length - 1 && !isLoading && msg.showDateTimePicker && !(msg.bookingData?.date && msg.bookingData?.time) && (
                            <ChatDateTimePicker
                              language={language}
                              onSelectDateTime={(date, formattedDate, time, formattedTime, returnDate, formattedReturnDate, returnTime, formattedReturnTime) => {
                                // Sync to form
                                if (onApplyBooking) {
                                  const dateStr = date.toISOString().split('T')[0];
                                  console.log("[DateTimePicker] Syncing to form:", dateStr, time, returnDate ? returnDate.toISOString().split('T')[0] : 'no return');
                                  onApplyBooking({ date: dateStr, time } as BookingData);
                                }
                                
                                // Hide date time picker after selection
                                setMessages(prev => prev.map((m, i) => 
                                  i === msgIndex 
                                    ? { ...m, showDateTimePicker: false }
                                    : m
                                ));
                                
                                // Build message
                                let message = `${formattedDate} ${time}`;
                                if (returnDate && formattedReturnDate && returnTime) {
                                  message += ` → ${formattedReturnDate} ${returnTime}`;
                                }
                                setInput(message);
                                setTimeout(() => {
                                  const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                                  if (submitButton) submitButton.click();
                                }, 100);
                              }}
                              disabled={isLoading}
                            />
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                            <User className="h-2 w-2 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="h-2 w-2 text-primary" />
                        </div>
                        <div className="bg-muted rounded-xl px-2.5 py-1.5">
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
                    
                    {/* Waiting for Admin Price Animation - Mobile */}
                    {waitingForPrice && !isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <motion.div 
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30"
                          animate={{ 
                            scale: [1, 1.15, 1],
                            rotate: [0, 5, -5, 0]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                          }}
                        >
                          <Clock className="h-3 w-3 text-white" />
                        </motion.div>
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl px-3 py-2.5 border border-amber-200 dark:border-amber-800 max-w-[85%]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <motion.div
                              className="flex gap-0.5"
                            >
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-1.5 h-1.5 bg-amber-500 rounded-full"
                                  animate={{
                                    scale: [1, 1.3, 1],
                                    opacity: [1, 0.6, 1],
                                  }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                  }}
                                />
                              ))}
                            </motion.div>
                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                              {language === "TR" ? "Fiyat Bekleniyor" : "Waiting for Price"}
                            </span>
                            {/* Waiting time display */}
                            {waitingTimeDisplay && (
                              <span className="text-[10px] font-mono bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">
                                {waitingTimeDisplay}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                            {language === "TR" 
                              ? "Operasyon yetkilimiz bu güzergah için en iyi fiyatı belirliyor. Tahmini süre: 1-3 dakika" 
                              : "Our team is determining the best price for this route. Est. time: 1-3 minutes"}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <motion.div
                              className="h-1 flex-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden"
                            >
                              <motion.div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                                animate={{
                                  x: ["-100%", "200%"],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                                style={{ width: "50%" }}
                              />
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* AI Speaking Indicator - Mobile - Enhanced Waveform */}
                    {isSpeaking && !isLoading && (
                      <ChatSpeakingWaveform language={language} />
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Mobile Input - Sticky at bottom with improved keyboard handling */}
                <div 
                  className="shrink-0 p-3 border-t border-border bg-card/95 backdrop-blur-sm mt-auto"
                  style={{ 
                    paddingBottom: keyboardHeight > 0 ? '8px' : 'max(12px, env(safe-area-inset-bottom))'
                  }}
                >
                  {/* Large Recording Overlay with animated indicator */}
                  <AnimatePresence>
                    {(isRecording || isProcessing) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-4 mb-3"
                      >
                        {/* Large animated recording circle */}
                        <div className="relative flex items-center justify-center">
                          {/* Outer pulsing rings */}
                          {isRecording && !isProcessing && (
                            <>
                              <motion.div
                                className="absolute w-24 h-24 rounded-full border-2 border-destructive/30"
                                animate={{
                                  scale: [1, 1.5, 2],
                                  opacity: [0.6, 0.3, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                }}
                              />
                              <motion.div
                                className="absolute w-24 h-24 rounded-full border-2 border-destructive/20"
                                animate={{
                                  scale: [1, 1.5, 2],
                                  opacity: [0.4, 0.2, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "easeOut",
                                  delay: 0.5,
                                }}
                              />
                            </>
                          )}
                          
                          {/* Main recording circle with glow */}
                          <motion.div
                            className={cn(
                              "relative w-20 h-20 rounded-full flex items-center justify-center",
                              isProcessing 
                                ? "bg-primary/20" 
                                : "bg-destructive/20"
                            )}
                            animate={isRecording && !isProcessing ? {
                              scale: [1, 1.08, 1],
                            } : {}}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            {/* Inner glow */}
                            <motion.div
                              className={cn(
                                "absolute w-16 h-16 rounded-full",
                                isProcessing 
                                  ? "bg-primary/30" 
                                  : "bg-destructive/30"
                              )}
                              animate={isRecording && !isProcessing ? {
                                scale: [0.9, 1.1, 0.9],
                              } : {}}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                            
                            {/* Icon */}
                            {isProcessing ? (
                              <motion.div
                                className="relative z-10"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="h-8 w-8 text-primary" />
                              </motion.div>
                            ) : (
                              <motion.div
                                className="relative z-10"
                                animate={{
                                  scale: [1, 1.15, 1],
                                }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <Mic className="h-8 w-8 text-destructive" />
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                        
                        {/* Audio waveform visualizer - real-time audio levels */}
                        {isRecording && !isProcessing && (
                          <div className="flex items-center justify-center gap-1 h-8">
                            {audioLevels.slice(0, 12).map((level, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-destructive rounded-full"
                                animate={{
                                  height: Math.max(4, 4 + level * 28),
                                }}
                                transition={{
                                  duration: 0.05,
                                  ease: "linear",
                                }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Status text with badges */}
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <motion.div
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full",
                              isProcessing ? "bg-primary" : "bg-destructive"
                            )}
                          />
                          <span className={isProcessing ? "text-primary" : "text-destructive"}>
                            {isProcessing 
                              ? (language === "TR" ? "İşleniyor..." : "Processing...")
                              : (language === "TR" ? "Dinleniyor..." : "Listening...")
                            }
                          </span>
                          {useWhisperFallback && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI
                            </span>
                          )}
                        </div>
                        
                        {/* Audio quality warning - only show after enough time */}
                        {isRecording && !isProcessing && audioQuality !== 'good' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                              audioQuality === 'silent' && "bg-muted text-muted-foreground",
                              audioQuality === 'low' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                              audioQuality === 'noisy' && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                            )}
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>
                              {audioQuality === 'silent' && (language === "TR" ? "Ses algılanmıyor - Mikrofona yakın konuşun" : "No audio - Speak closer to mic")}
                              {audioQuality === 'low' && (language === "TR" ? "Ses çok düşük" : "Volume too low")}
                              {audioQuality === 'noisy' && (language === "TR" ? "Gürültü algılandı" : "Too much noise")}
                            </span>
                          </motion.div>
                        )}
                        
                        {/* Tap to stop hint */}
                        {isRecording && !isProcessing && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            className="text-xs text-muted-foreground"
                          >
                            {language === "TR" ? "Durdurmak için butona dokunun" : "Tap button to stop"}
                          </motion.p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isProcessing}
                      size="icon"
                      variant="outline"
                      className={cn(
                        "h-12 w-12 rounded-xl shrink-0 touch-manipulation transition-all active:scale-95",
                        isRecording && "bg-destructive/10 border-destructive text-destructive"
                      )}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isRecording ? (
                        <Square className="h-5 w-5 fill-current" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      onFocus={() => {
                        // iOS needs the input to scroll into view when keyboard opens
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                        const delay = isIOS ? 450 : 350;
                        
                        setTimeout(() => {
                          // Scroll input into visible area above keyboard
                          inputRef.current?.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'nearest'
                          });
                        }, delay);
                      }}
                      onBlur={() => {
                        // Prevent keyboard from closing unexpectedly on iOS
                        setTimeout(() => {
                          window.scrollTo(0, 0);
                        }, 100);
                      }}
                      placeholder={language === "TR" ? "Mesaj yazın..." : "Type message..."}
                      disabled={isLoading || isRecording}
                      className="h-12 rounded-xl text-base flex-1 touch-manipulation border-2 focus:border-primary transition-colors"
                      style={{ fontSize: '16px' }}
                      autoComplete="off"
                      autoCorrect="on"
                      autoCapitalize="sentences"
                      enterKeyHint="send"
                      inputMode="text"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={isLoading || !input.trim()}
                      size="icon"
                      data-chat-submit
                      className={cn(
                        "h-12 w-12 rounded-xl shrink-0 touch-manipulation transition-all active:scale-95",
                        input.trim() ? "bg-primary shadow-lg shadow-primary/30" : "bg-muted"
                      )}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                    
                    {/* Mobile Voice Settings - Full Screen Drawer */}
                    <VoiceSettingsPanel
                      language={language}
                      isVoiceEnabled={isVoiceEnabled}
                      toggleVoice={toggleVoice}
                      continuousMode={continuousMode}
                      toggleContinuousMode={toggleContinuousMode}
                      availableVoices={availableVoices}
                      selectedVoiceId={selectedVoiceId}
                      selectVoice={selectVoice}
                      speechRate={speechRate}
                      changeRate={changeRate}
                      voiceSettings={voiceSettings}
                      changeVoiceSettings={changeVoiceSettings}
                    />
                  </div>
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop mode - inline chat interface
  return (
    <div className="w-full">
      {/* Browser warning - Enhanced microphone permission message */}
      {showBrowserWarning && (
        <MicrophonePermissionAlert 
          language={language} 
          onDismiss={dismissWarning} 
        />
      )}

      {/* Messages Area with Header */}
      <div className="rounded-xl bg-background/50 border border-border mb-3 overflow-hidden">
        {/* Desktop Chat Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-3 w-3 text-primary" />
            </div>
            <span className="font-medium text-sm">
              {language === "TR" ? "AI Asistan" : "AI Assistant"}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearConversation}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {language === "TR" ? "Temizle" : "Clear"}
          </Button>
        </div>
        <ScrollArea className="h-[340px]">
          <div className="p-3 space-y-2">
          {messages.map((msg, msgIndex) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm relative",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted",
                  speakingMessageId === msg.id && isSpeaking && msg.role === "assistant" && "ring-2 ring-primary/30"
                )}
              >
                {/* Speaking overlay for active message */}
                {msg.role === "assistant" && (
                  <SpeakingBubbleOverlay 
                    isActive={speakingMessageId === msg.id && isSpeaking} 
                    variant="desktop" 
                  />
                )}
                {msg.role === "assistant" ? (
                  <div className="relative group">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {cleanResponseForDisplay(msg.content)}
                    </ReactMarkdown>
                    {/* Read Aloud Button - Desktop */}
                    <button
                      onClick={() => {
                        if (speakingMessageId === msg.id && isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakMessage(msg.id, msg.content);
                        }
                      }}
                      className={cn(
                        "mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full transition-all",
                        speakingMessageId === msg.id && isSpeaking
                          ? "bg-primary/20 text-primary"
                          : "bg-muted-foreground/10 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {speakingMessageId === msg.id && isSpeaking ? (
                        <>
                          <SoundWaveInline isPlaying={true} className="text-primary" />
                          <span>{language === "TR" ? "Durdur" : "Stop"}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3 w-3" />
                          <span>{language === "TR" ? "Sesli Oku" : "Read Aloud"}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  msg.content
                )}
                
                {/* Vehicle Cards for Desktop */}
                {/* Vehicle Cards for Desktop - show 2x2 quick select when vehicle selection is needed */}
                {/* Only show on LAST message, hide if isComplete is explicitly true (user made selection) */}
                {msgIndex === messages.length - 1 && !isLoading && (((msg.showVehicleCards && msg.vehiclePrices) || msg.showVehicleSelection)) && !msg.bookingData?.isComplete && (
                  <ChatVehicleCards
                    passengers={msg.passengerCount || msg.bookingData?.passengers || 2}
                    prices={msg.vehiclePrices}
                    currency={msg.bookingData?.currency || "EUR"}
                    selectedVehicle={msg.bookingData?.vehicleType || undefined}
                    language={language}
                    discountPercentage={msg.bookingData?.discountPercentage || undefined}
                    hasReturnTrip={msg.bookingData?.hasReturnTrip || false}
                    returnDiscountPercentage={25}
                    onSelectVehicle={(vehicleType) => {
                      // Sync all booking data to form when vehicle is selected
                      if (onApplyBooking) {
                        const syncData: Partial<BookingData> = { vehicleType };
                        
                        // Add passenger count
                        const passengerCount = msg.passengerCount || msg.bookingData?.passengers;
                        if (passengerCount) syncData.passengers = passengerCount;
                        
                        // Add date if available
                        if (msg.bookingData?.date) syncData.date = msg.bookingData.date;
                        
                        // Add time if available
                        if (msg.bookingData?.time) syncData.time = msg.bookingData.time;
                        
                        // Add locations if available
                        if (msg.bookingData?.pickup) syncData.pickup = msg.bookingData.pickup;
                        if (msg.bookingData?.dropoff) syncData.dropoff = msg.bookingData.dropoff;
                        
                        console.log("[ChatVehicleCards Desktop] Syncing all data to form:", syncData);
                        onApplyBooking(syncData as BookingData);
                      }
                      // Update message's bookingData to reflect selection and trigger booking creation
                      setMessages(prev => prev.map((m, idx) => 
                        idx === msgIndex 
                          ? { 
                              ...m,
                              showVehicleCards: false,
                              showVehicleSelection: false,
                              bookingData: { ...(m.bookingData || ({} as BookingData)), vehicleType, isComplete: true }
                            }
                          : m
                      ));
                      
                      // Send a message to confirm vehicle selection and trigger booking creation
                      const vehicleLabels: Record<string, string> = {
                        'sedan': 'Sedan',
                        'mercedes-vito': 'Mercedes Vito',
                        'vip-mercedes': 'Mercedes Vito VIP',
                        'maybach-minibus': 'Maybach',
                        'minibus': 'Mercedes Sprinter'
                      };
                      const label = vehicleLabels[vehicleType] || vehicleType;
                      setInput(label);
                      setTimeout(() => {
                        const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                        if (submitButton) submitButton.click();
                      }, 100);
                    }}
                  />
                )}

                {/* Vehicle Features Card for Desktop */}
                {msg.showVehicleFeatures && msg.vehicleFeatures && (
                  <ChatVehicleFeaturesCard
                    language={language}
                    features={msg.vehicleFeatures}
                    vehicleType={msg.bookingData?.vehicleType || undefined}
                  />
                )}

                {/* Redirect Button removed - only show inside booking summary card */}
                
                {/* Booking Summary Card for Desktop - Show after vehicle selection */}
                {msg.bookingData && msg.bookingData.vehicleType && msg.vehiclePrices && (
                  <div className="mt-3 p-4 bg-gradient-to-br from-background to-muted/30 rounded-xl border border-border shadow-lg">
                    {/* Header with Vehicle & Price */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">
                            {msg.bookingData.vehicleType === 'sedan' ? 'Sedan' :
                             msg.bookingData.vehicleType === 'mercedes-vito' ? 'Mercedes Vito' :
                             msg.bookingData.vehicleType === 'vip-mercedes' ? 'Mercedes Vito VIP' :
                             msg.bookingData.vehicleType === 'maybach-minibus' ? 'Maybach' :
                             msg.bookingData.vehicleType === 'minibus' ? 'Mercedes Sprinter' :
                             msg.bookingData.vehicleType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {msg.bookingData.passengers || 2} {language === "TR" ? "Yolcu" : "Passengers"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {language === "TR" ? "Toplam Tutar" : "Total"}
                        </p>
                        <p className="font-bold text-primary text-2xl">
                          {msg.bookingData.currency === "TRY" ? "₺" : "€"}
                          {(() => {
                            const basePrice = msg.vehiclePrices?.[msg.bookingData.vehicleType!] || msg.bookingData.estimatedPrice || 0;
                            if (msg.bookingData.hasReturnTrip) {
                              const returnPrice = Math.round(basePrice * 0.75);
                              return basePrice + returnPrice;
                            }
                            return basePrice;
                          })()}
                        </p>
                        {msg.bookingData.hasReturnTrip && (
                          <p className="text-[10px] text-green-600 font-medium">
                            {language === "TR" ? "Gidiş + Dönüş" : "Round Trip"} (-25%)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Trip Details - Professional Layout */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Pickup */}
                      {msg.bookingData.pickup && (
                        <div className="col-span-2 flex items-start gap-2 p-2.5 bg-green-500/5 rounded-lg border border-green-500/10">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">
                              {language === "TR" ? "Alış Noktası" : "Pickup Location"}
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {msg.bookingData.pickup}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Dropoff */}
                      {msg.bookingData.dropoff && (
                        <div className="col-span-2 flex items-start gap-2 p-2.5 bg-red-500/5 rounded-lg border border-red-500/10">
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="h-3 w-3 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-red-600 font-medium uppercase tracking-wide">
                              {language === "TR" ? "Bırakış Noktası" : "Dropoff Location"}
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {msg.bookingData.dropoff}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Date */}
                      {msg.bookingData.date && (
                        <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <p className="text-[10px] text-primary font-medium uppercase tracking-wide">
                              {language === "TR" ? "Tarih" : "Date"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-1">
                            {new Date(msg.bookingData.date).toLocaleDateString(language === "TR" ? "tr-TR" : "en-US", {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {/* Time */}
                      {msg.bookingData.time && (
                        <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <p className="text-[10px] text-primary font-medium uppercase tracking-wide">
                              {language === "TR" ? "Saat" : "Time"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-1">
                            {msg.bookingData.time}
                          </p>
                        </div>
                      )}

                      {/* Return Trip Info */}
                      {msg.bookingData.hasReturnTrip && msg.bookingData.returnDate && (
                        <div className="col-span-2 p-2.5 bg-amber-500/5 rounded-lg border border-amber-500/20">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                            <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">
                              {language === "TR" ? "Dönüş Transferi" : "Return Transfer"}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-foreground">
                            {new Date(msg.bookingData.returnDate).toLocaleDateString(language === "TR" ? "tr-TR" : "en-US", {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                            {msg.bookingData.returnTime && ` • ${msg.bookingData.returnTime}`}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleApplyBooking(msg.bookingData!)}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-lg shadow-primary/25"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {language === "TR" ? "Rezervasyonu Tamamla" : "Complete Booking"}
                      </Button>
                      <ChatRedirectButton
                        language={language}
                        bookingToken={bookingCreated?.token}
                        bookingData={msg.bookingData}
                        onRedirect={() => handleApplyBooking(msg.bookingData!)}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Reply Buttons - Desktop */}
                {/* Only show on LAST message and hide if already answered (via bookingData flags) */}
                {msgIndex === messages.length - 1 && !isLoading && !msg.bookingData?.isComplete && (msg.showReturnQuestion || msg.showPaymentMethod || msg.showPassengerCount || msg.showExtras || msg.showAirportSelection) && (
                  <ChatQuickReplyButtons
                    language={language}
                    type={
                      msg.showAirportSelection ? "airport_selection" :
                      msg.showReturnQuestion ? "return_transfer" :
                      msg.showPaymentMethod ? "payment_method" :
                      msg.showPassengerCount ? "passenger_count" :
                      "extras"
                    }
                    onReply={(answer, metadata) => {
                      // Apply metadata to form if available
                      if (metadata && onApplyBooking) {
                        const partialBookingData: Partial<BookingData> = {};
                        if (metadata.vehicleType) partialBookingData.vehicleType = metadata.vehicleType;
                        if (metadata.paymentMethod) partialBookingData.paymentMethod = metadata.paymentMethod;
                        if (metadata.passengers) partialBookingData.passengers = metadata.passengers;
                        
                        if (Object.keys(partialBookingData).length > 0) {
                          console.log("[QuickReply] Syncing to form:", partialBookingData);
                          onApplyBooking(partialBookingData as BookingData);
                        }
                      }
                      
                      // Hide quick reply buttons after selection - update ALL messages' flags
                      setMessages(prev => prev.map((m) => ({ 
                        ...m,
                        showReturnQuestion: false,
                        showPaymentMethod: false,
                        showPassengerCount: false,
                        showExtras: false,
                        showAirportSelection: false,
                      })));
                      
                      setInput(answer);
                      setTimeout(() => {
                        const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                        if (submitButton) submitButton.click();
                      }, 100);
                    }}
                    disabled={isLoading}
                  />
                )}

                {/* Date Time Picker - Desktop */}
                {/* Hide picker if date AND time are already selected */}
                {msgIndex === messages.length - 1 && !isLoading && msg.showDateTimePicker && !(msg.bookingData?.date && msg.bookingData?.time) && (
                  <ChatDateTimePicker
                    language={language}
                    onSelectDateTime={(date, formattedDate, time, formattedTime, returnDate, formattedReturnDate, returnTime, formattedReturnTime) => {
                      // Sync to form
                      if (onApplyBooking) {
                        const dateStr = date.toISOString().split('T')[0];
                        console.log("[DateTimePicker] Syncing to form:", dateStr, time, returnDate ? returnDate.toISOString().split('T')[0] : 'no return');
                        onApplyBooking({ date: dateStr, time } as BookingData);
                      }
                      
                      // Hide date time picker after selection
                      setMessages(prev => prev.map((m, idx) => 
                        idx === msgIndex 
                          ? { ...m, showDateTimePicker: false }
                          : m
                      ));
                      
                      // Build message
                      let message = `${formattedDate} ${time}`;
                      if (returnDate && formattedReturnDate && returnTime) {
                        message += ` → ${formattedReturnDate} ${returnTime}`;
                      }
                      setInput(message);
                      setTimeout(() => {
                        const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
                        if (submitButton) submitButton.click();
                      }, 100);
                    }}
                    disabled={isLoading}
                  />
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          
          {/* Streaming content */}
          {isTyping && streamingContent && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="max-w-[85%] rounded-xl px-3 py-2 text-sm bg-muted">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {cleanResponseForDisplay(streamingContent)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          
          {/* Typing indicator */}
          {isTyping && !streamingContent && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-muted rounded-xl px-3 py-2">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                  <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                </div>
              </div>
            </div>
          )}
          
          {/* AI Speaking Indicator - Desktop - Enhanced Waveform */}
          {isSpeaking && !isTyping && (
            <ChatSpeakingWaveform language={language} />
          )}
          
          {/* Waiting for Admin Price Animation - Desktop */}
          {waitingForPrice && !isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5 justify-start"
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30"
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              >
                <Clock className="h-4 w-4 text-white" />
              </motion.div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800 max-w-[85%]">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-amber-500 rounded-full"
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.6, 1],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </motion.div>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    {language === "TR" ? "Fiyat Bekleniyor" : "Waiting for Price"}
                  </span>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                  {language === "TR" 
                    ? "Operasyon yetkilimiz bu güzergah için en iyi fiyatı belirliyor. Lütfen bekleyin..." 
                    : "Our team is determining the best price for this route. Please wait..."}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <motion.div className="h-1.5 flex-1 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                      animate={{
                        x: ["-100%", "200%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: "50%" }}
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      </div>

      {/* Desktop Recording indicator with large animated visual */}
      <AnimatePresence>
        {(isRecording || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center gap-3 mb-3 py-4 bg-muted/50 rounded-xl"
          >
            {/* Large animated recording circle */}
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing rings */}
              {isRecording && !isProcessing && (
                <>
                  <motion.div
                    className="absolute w-20 h-20 rounded-full border-2 border-destructive/30"
                    animate={{
                      scale: [1, 1.4, 1.8],
                      opacity: [0.5, 0.25, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                  <motion.div
                    className="absolute w-20 h-20 rounded-full border-2 border-destructive/20"
                    animate={{
                      scale: [1, 1.4, 1.8],
                      opacity: [0.3, 0.15, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: 0.5,
                    }}
                  />
                </>
              )}
              
              {/* Main recording circle */}
              <motion.div
                className={cn(
                  "relative w-16 h-16 rounded-full flex items-center justify-center",
                  isProcessing 
                    ? "bg-primary/20" 
                    : "bg-destructive/20"
                )}
                animate={isRecording && !isProcessing ? {
                  scale: [1, 1.08, 1],
                } : {}}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {/* Inner glow */}
                <motion.div
                  className={cn(
                    "absolute w-12 h-12 rounded-full",
                    isProcessing 
                      ? "bg-primary/30" 
                      : "bg-destructive/30"
                  )}
                  animate={isRecording && !isProcessing ? {
                    scale: [0.9, 1.1, 0.9],
                  } : {}}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Icon */}
                {isProcessing ? (
                  <motion.div
                    className="relative z-10"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-6 w-6 text-primary" />
                  </motion.div>
                ) : (
                  <motion.div
                    className="relative z-10"
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Mic className="h-6 w-6 text-destructive" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Audio waveform visualizer */}
            {isRecording && !isProcessing && (
              <div className="flex items-center justify-center gap-[3px] h-7">
                {audioLevels.map((level, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-destructive rounded-full"
                    animate={{
                      height: Math.max(4, 4 + level * 24),
                    }}
                    transition={{
                      duration: 0.05,
                      ease: "linear",
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Status text with badges */}
            <div className="flex items-center gap-2 text-sm font-medium">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  isProcessing ? "bg-primary" : "bg-destructive"
                )}
              />
              <span className={isProcessing ? "text-primary" : "text-destructive"}>
                {isProcessing 
                  ? (language === "TR" ? "İşleniyor..." : "Processing...")
                  : (language === "TR" ? "Dinleniyor..." : "Listening...")
                }
              </span>
              {useWhisperFallback && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </div>
            
            {/* Real-time transcript display */}
            {isRecording && interimTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[280px] px-4 py-2 bg-background/80 border border-border/50 rounded-xl text-sm text-foreground/80 text-center"
              >
                <span className="italic">"{interimTranscript}"</span>
              </motion.div>
            )}
            
            {/* Audio quality warning */}
            {isRecording && !isProcessing && audioQuality !== 'good' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  audioQuality === 'silent' && "bg-muted text-muted-foreground",
                  audioQuality === 'low' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
                  audioQuality === 'noisy' && "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                )}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                <span>
                  {audioQuality === 'silent' && (language === "TR" ? "Ses algılanmıyor - Mikrofona yakın konuşun" : "No audio - Speak closer to mic")}
                  {audioQuality === 'low' && (language === "TR" ? "Ses çok düşük" : "Volume too low")}
                  {audioQuality === 'noisy' && (language === "TR" ? "Gürültü algılandı" : "Too much noise")}
                </span>
              </motion.div>
            )}

            {/* Tap to stop hint */}
            {isRecording && !isProcessing && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                className="text-xs text-muted-foreground"
              >
                {language === "TR" ? "Durdurmak için butona tıklayın" : "Click button to stop"}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push-to-Talk Hero Button - Professional Design - Only for mobile floating mode */}
      {mobileFloating && isSpeechSupported && !isProcessing && !isLoading && !isSpeaking && messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-6"
        >
          {/* Push-to-Talk Instructions */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <motion.div
                className="w-2 h-2 rounded-full bg-primary"
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-sm font-medium text-primary">
                {language === "TR" ? "Basılı Tut ve Konuş" : "Push to Talk"}
              </span>
            </div>
          </motion.div>

          {/* Main Push-to-Talk Button */}
          <motion.button
            onMouseDown={() => {
              if (!isRecording) {
                triggerHaptic('medium');
                startRecording();
              }
            }}
            onMouseUp={() => {
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onMouseLeave={() => {
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isRecording) {
                triggerHaptic('medium');
                startRecording();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isRecording) {
                triggerHaptic('success');
                stopRecording();
              }
            }}
            onTouchCancel={(e) => {
              // Critical for iOS - triggered when touch is interrupted
              e.preventDefault();
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "relative w-28 h-28 rounded-full flex items-center justify-center transition-all select-none",
              // iOS-specific: use touch-manipulation instead of touch-none for better response
              "touch-manipulation",
              // Prevent text selection and callout on iOS
              "[-webkit-touch-callout:none] [-webkit-user-select:none]",
              isRecording 
                ? "bg-gradient-to-br from-destructive via-destructive to-destructive/80 text-destructive-foreground shadow-2xl shadow-destructive/40 scale-110"
                : "bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40"
            )}
            whileHover={!isRecording ? { scale: 1.05 } : {}}
            animate={isRecording ? { scale: 1.1 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {/* Outer pulse rings - animate faster when recording */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-destructive/50" : "border-primary/30"
              )}
              animate={{
                scale: isRecording ? [1, 1.4, 1.4] : [1, 1.3, 1.3],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: isRecording ? 0.8 : 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-destructive/50" : "border-primary/30"
              )}
              animate={{
                scale: isRecording ? [1, 1.3, 1.3] : [1, 1.2, 1.2],
                opacity: [0.5, 0, 0],
              }}
              transition={{
                duration: isRecording ? 0.8 : 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: isRecording ? 0.2 : 0.5,
              }}
            />
            
            {/* Inner glow effect when recording */}
            {isRecording && (
              <motion.div
                className="absolute inset-2 rounded-full bg-destructive-foreground/10"
                animate={{ scale: [0.9, 1, 0.9], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            )}
            
            {/* Circular waveform around the button when recording */}
            <CircularWaveform 
              isRecording={isRecording} 
              audioLevels={audioLevels}
              color="white"
            />
            
            {/* Center content - waveform or mic icon */}
            {isRecording ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RecordingWaveform
                  isRecording={isRecording}
                  audioLevels={audioLevels.slice(2, 14)}
                  variant="large"
                  color="white"
                />
              </div>
            ) : (
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mic className="h-12 w-12" />
              </motion.div>
            )}
          </motion.button>
          
          {/* Status text and visual feedback */}
          <div className="mt-5 flex flex-col items-center gap-3">
            {isRecording ? (
              <>
                {/* Recording indicator */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    className="w-3 h-3 rounded-full bg-destructive"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                  <span className="text-base font-semibold text-destructive">
                    {language === "TR" ? "Dinliyorum..." : "Listening..."}
                  </span>
                </motion.div>
                
                {/* Waveform visualization */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-[2px] h-8 px-4 py-2 bg-destructive/10 rounded-full"
                >
                  {audioLevels.map((level, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive/80 rounded-full"
                      animate={{
                        height: Math.max(4, 4 + level * 20),
                      }}
                      transition={{
                        duration: 0.05,
                        ease: "linear",
                      }}
                    />
                  ))}
                </motion.div>
                
                {/* Interim transcript */}
                {interimTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-[280px] px-4 py-2 bg-background/80 border border-border/50 rounded-xl"
                  >
                    <p className="text-sm text-foreground/80 italic text-center">
                      "{interimTranscript}"
                    </p>
                  </motion.div>
                )}
                
                {/* Release hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  className="text-xs text-destructive/80 font-medium"
                >
                  {language === "TR" ? "Bırakınca gönderilecek" : "Release to send"}
                </motion.p>
              </>
            ) : (
              <>
                {/* Instruction when not recording */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="flex items-center gap-1"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <span className="text-2xl">👆</span>
                    </motion.div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {language === "TR" ? "Parmağınızı basılı tutun" : "Hold to record"}
                    </span>
                  </div>
                  
                  {/* Visual guide */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <span>{language === "TR" ? "Basılı tut" : "Press"}</span>
                    </div>
                    <ArrowRight className="h-3 w-3" />
                    <div className="flex items-center gap-1">
                      <Mic className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{language === "TR" ? "Konuş" : "Speak"}</span>
                    </div>
                    <ArrowRight className="h-3 w-3" />
                    <div className="flex items-center gap-1">
                      <Send className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{language === "TR" ? "Bırak" : "Release"}</span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Input Area - Simplified with Push-to-Talk */}
      <div className={cn(
        "flex gap-2",
        // Hide input area when showing hero mic button (but not during processing) - only for mobile
        mobileFloating && isSpeechSupported && !isProcessing && !isLoading && !isSpeaking && messages.length <= 1 && "hidden"
      )}>
        {/* Push-to-Talk microphone button - only show on mobile floating mode */}
        {mobileFloating && isSpeechSupported && (
          <Button
            onMouseDown={() => {
              if (!isRecording && !isLoading && !isProcessing) {
                triggerHaptic('medium');
                startRecording();
              }
            }}
            onMouseUp={() => {
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onMouseLeave={() => {
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isRecording && !isLoading && !isProcessing) {
                triggerHaptic('medium');
                startRecording();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isRecording) {
                triggerHaptic('success');
                stopRecording();
              }
            }}
            onTouchCancel={(e) => {
              // Critical for iOS - triggered when touch is interrupted
              e.preventDefault();
              if (isRecording) {
                triggerHaptic('light');
                stopRecording();
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isLoading || isProcessing}
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-xl shrink-0 select-none touch-manipulation transition-all",
              "[-webkit-touch-callout:none] [-webkit-user-select:none]",
              isRecording && "bg-destructive/20 border-destructive text-destructive scale-110 shadow-lg shadow-destructive/20"
            )}
          >
            {isProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isRecording ? (
              <InlineRecordingWave 
                isRecording={isRecording}
                barCount={5}
                className="text-destructive"
              />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}
        
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === "TR" ? "Mesajınızı yazın..." : "Type your message..."}
          disabled={isLoading || isRecording}
          className="h-11 rounded-xl text-sm flex-1"
        />
        
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          data-chat-submit
          className="h-11 w-11 rounded-xl shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
        
        {/* Simple Voice toggle button - only show on mobile */}
        {mobileFloating && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleVoice}
            className={cn(
              "h-11 w-11 rounded-xl shrink-0 transition-colors",
              isVoiceEnabled && "bg-primary/10 border-primary"
            )}
          >
            {isVoiceEnabled ? (
              <Volume2 className="h-5 w-5 text-primary" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
