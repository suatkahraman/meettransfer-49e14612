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

// Voice recording hook using Web Speech API with Whisper fallback for unsupported browsers
function useVoiceRecorder(onTranscription: (text: string) => void, language: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [useWhisperFallback, setUseWhisperFallback] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(0));
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
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
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevels = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
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
    setAudioLevels(new Array(16).fill(0));
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

  // Send audio to Whisper API for transcription
  const transcribeWithWhisper = useCallback(async (audioBlob: Blob) => {
    console.log('🎤 Whisper: Transcribing audio blob, size:', audioBlob.size);
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
      console.log('🎤 Whisper: Base64 audio length:', base64Audio.length);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-to-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ audio: base64Audio, language }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎤 Whisper: API error:', response.status, errorText);
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('🎤 Whisper: Transcription result:', result.text);
      
      if (result.text && result.text.trim()) {
        onTranscription(result.text.trim());
      }
    } catch (error) {
      console.error('🎤 Whisper: Transcription error:', error);
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
      
      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';
      
      console.log('🎤 Whisper: Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
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
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          console.log('🎤 Whisper: Total audio blob size:', audioBlob.size);
          
          if (audioBlob.size > 1000) { // Only transcribe if there's meaningful audio
            await transcribeWithWhisper(audioBlob);
          } else {
            console.log('🎤 Whisper: Audio too short, skipping transcription');
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
      console.log('🎤 Whisper: Recording started');
      
    } catch (error) {
      console.error('🎤 Whisper: Error starting recording:', error);
      setShowBrowserWarning(true);
    }
  }, [transcribeWithWhisper, setupAudioAnalyser, cleanupAudioAnalyser]);

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
    console.log('🎤 Permission granted:', permissionGranted);
    console.log('🎤 Native Speech API supported:', isNativeSupported);
    console.log('🎤 MediaRecorder supported:', isMediaRecorderSupported);
    
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
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          console.log(`🎤 Result[${i}]: "${transcript}" (confidence: ${confidence}, isFinal: ${result.isFinal})`);
          
          if (result.isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const transcript = finalTranscript || interimTranscript;
        
        if (transcript) {
          transcriptRef.current = transcript;
          console.log('🎤 Current transcript:', transcript, 'isFinal:', !!finalTranscript);
          
          if (finalTranscript) {
            console.log('🎤 Sending final transcript to onTranscription...');
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
  }, [language, getLanguageCode, onTranscription, isIOS, permissionGranted, requestMicrophonePermission, isNativeSupported, isMediaRecorderSupported, startWhisperRecording, setupAudioAnalyser, cleanupAudioAnalyser]);

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

  return { isRecording, isProcessing, startRecording, stopRecording, isSupported, showBrowserWarning, dismissWarning, useWhisperFallback, audioLevels };
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

  // Ref to track if we should auto-send voice transcription
  const pendingVoiceMessageRef = useRef<string | null>(null);

  // Voice recording - auto-send transcribed text
  const handleTranscription = useCallback((text: string) => {
    if (!text.trim()) return;
    
    // Store the transcribed text for auto-send
    pendingVoiceMessageRef.current = text.trim();
    setInput(text.trim());
    
    // Close keyboard on mobile
    if (mobileFloating && inputRef.current) {
      inputRef.current.blur();
    }
    
    // Scroll to bottom
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [mobileFloating]);
  
  const { isRecording, isProcessing, startRecording, stopRecording, isSupported: isSpeechSupported, showBrowserWarning, dismissWarning, useWhisperFallback, audioLevels } = useVoiceRecorder(
    handleTranscription,
    language
  );
  
  // Auto-send voice message when transcription is complete and not recording/processing
  useEffect(() => {
    if (pendingVoiceMessageRef.current && !isRecording && !isProcessing && input === pendingVoiceMessageRef.current) {
      const messageToSend = pendingVoiceMessageRef.current;
      pendingVoiceMessageRef.current = null;
      
      // Small delay to ensure UI has updated
      const timeoutId = setTimeout(() => {
        const submitButton = document.querySelector('[data-chat-submit]') as HTMLButtonElement;
        if (submitButton && !submitButton.disabled) {
          submitButton.click();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [input, isRecording, isProcessing]);

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

        {/* Mobile Backdrop - Separate layer for iOS tap reliability */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              data-mobile-backdrop
              className="fixed inset-0 z-[9997] bg-background/80 backdrop-blur-sm"
              style={{ touchAction: 'manipulation' }}
            />
          )}
        </AnimatePresence>

        {/* Mobile Floating Panel */}
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
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              data-mobile-panel
              className="fixed inset-x-0 bottom-0 z-[9998] bg-card rounded-t-3xl shadow-2xl border-t border-border flex flex-col"
              style={{
                bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 0,
                height: keyboardHeight > 0 ? `min(50vh, 400px)` : "min(60vh, 500px)",
                maxHeight: keyboardHeight > 0 ? `calc(100vh - ${keyboardHeight}px - 20px)` : undefined,
                // iOS Safari: ensure panel content is tappable
                touchAction: 'auto',
                // Prevent pointer-events from being blocked
                pointerEvents: 'auto',
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
                  {/* Recording indicator with waveform */}
                  {(isRecording || isProcessing) && (
                    <div className="flex flex-col items-center gap-2 mb-3">
                      {/* Audio waveform visualizer - real-time audio levels */}
                      {isRecording && !isProcessing && (
                        <div className="flex items-center justify-center gap-[3px] h-8">
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
                      
                      {/* Processing spinner */}
                      {isProcessing && (
                        <div className="flex items-center justify-center h-8">
                          <motion.div
                            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                        </div>
                      )}
                      
                      {/* Status text with badges */}
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className={cn(
                            "w-2 h-2 rounded-full",
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
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full flex items-center gap-1">
                            <Sparkles className="h-2.5 w-2.5" />
                            AI
                          </span>
                        )}
                      </div>
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
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop mode - inline chat interface
  return (
    <div className="w-full">
      {/* Browser warning */}
      {showBrowserWarning && (
        <Alert variant="destructive" className="mb-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-xs">
              {language === "TR" 
                ? "Ses tanıma için mikrofon izni gerekli"
                : "Microphone permission required for voice"
              }
            </span>
            <Button variant="ghost" size="sm" onClick={dismissWarning} className="h-6 px-2">
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Messages Area */}
      <ScrollArea className="h-[180px] rounded-lg bg-background/50 border border-border mb-2">
        <div className="p-3 space-y-2">
          {messages.map((msg) => (
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
                  "max-w-[85%] rounded-xl px-3 py-2 text-sm",
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
                
                {/* Booking Card */}
                {msg.bookingData && msg.bookingData.estimatedPrice && (
                  <div className="mt-2 p-2 bg-background rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {language === "TR" ? "Fiyat" : "Price"}
                      </span>
                      <span className="font-bold text-primary">
                        {msg.bookingData.currency === "TRY" ? "₺" : "€"}
                        {msg.bookingData.estimatedPrice}
                      </span>
                    </div>
                    {onApplyBooking && (
                      <Button
                        size="sm"
                        onClick={() => handleApplyBooking(msg.bookingData!)}
                        className="w-full mt-2 h-7 text-xs"
                      >
                        {language === "TR" ? "Forma Uygula" : "Apply to Form"}
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
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
                  {streamingContent}
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
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Desktop Recording indicator with waveform */}
      {(isRecording || isProcessing) && (
        <div className="flex flex-col items-center gap-2 mb-2 py-2 bg-muted/50 rounded-lg">
          {/* Audio waveform visualizer - real-time audio levels */}
          {isRecording && !isProcessing && (
            <div className="flex items-center justify-center gap-[3px] h-6">
              {audioLevels.map((level, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-destructive rounded-full"
                  animate={{
                    height: Math.max(3, 3 + level * 21),
                  }}
                  transition={{
                    duration: 0.05,
                    ease: "linear",
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Processing spinner */}
          {isProcessing && (
            <div className="flex items-center justify-center h-6">
              <motion.div
                className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
          
          {/* Status text with badges */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className={cn(
                "w-2 h-2 rounded-full",
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
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2">
        {/* Voice recording button */}
        {isSpeechSupported && (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isProcessing}
            size="icon"
            variant="outline"
            className={cn(
              "h-10 w-10 rounded-lg shrink-0",
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
        )}
        
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={language === "TR" ? "Mesajınızı yazın..." : "Type your message..."}
          disabled={isLoading || isRecording}
          className="h-10 rounded-lg text-sm flex-1"
        />
        
        <Button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          size="icon"
          data-chat-submit
          className="h-10 w-10 rounded-lg shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
        
        {/* Voice output toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleVoice}
          className="h-10 w-10 rounded-lg shrink-0"
        >
          {isVoiceEnabled ? (
            <Volume2 className="h-4 w-4 text-primary" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}
