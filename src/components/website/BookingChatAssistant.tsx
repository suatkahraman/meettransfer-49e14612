import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Sparkles, X, Bot, User, Loader2, ArrowRight, Mic, Square, Volume2, VolumeX, AlertCircle, Settings2, ChevronDown, Trash2, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAIChat } from "@/contexts/AIChatContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoiceSettingsPanel } from "./VoiceSettingsPanel";

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

      // Detect MIME type from blob
      const detectedMimeType = audioBlob.type || 'audio/webm';
      console.log('🎤 Whisper: Sending audio with type:', detectedMimeType);
      
      const response = await fetch(
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
          console.log('🎤 Whisper: Total audio blob size:', audioBlob.size, 'type:', actualMimeType);
          
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

// Text-to-Speech hook using Web Speech API (no API key required)
function useTextToSpeech(language: string, onSpeakEnd?: () => void) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onSpeakEndRef = useRef(onSpeakEnd);
  
  // Keep callback ref updated
  useEffect(() => {
    onSpeakEndRef.current = onSpeakEnd;
  }, [onSpeakEnd]);

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

  // Load and filter voices for current language - prefer high quality voices
  const loadVoices = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.log('🔊 [Voices] speechSynthesis not available');
      return;
    }
    
    const voices = window.speechSynthesis.getVoices();
    console.log('🔊 [Voices] Loading voices, total available:', voices.length);
    
    const langCode = getLanguageCode(language);
    const langPrefix = langCode.split('-')[0];
    console.log('🔊 [Voices] Looking for language:', langCode, 'prefix:', langPrefix);
    
    // Keywords indicating higher quality voices
    const premiumKeywords = ['premium', 'enhanced', 'natural', 'neural', 'hd', 'wavenet', 'google', 'microsoft'];
    
    const filteredVoices: VoiceOption[] = voices
      .filter(voice => voice.lang.startsWith(langPrefix))
      .map(voice => ({
        id: voice.voiceURI,
        name: voice.name.replace(/Microsoft |Google |Apple /, '').split(' ')[0],
        lang: voice.lang,
        gender: detectGender(voice),
        isPremium: premiumKeywords.some(kw => voice.name.toLowerCase().includes(kw)) || voice.localService === false
      }))
      .sort((a, b) => {
        // Sort premium/remote voices first (usually higher quality)
        if ((a as any).isPremium && !(b as any).isPremium) return -1;
        if (!(a as any).isPremium && (b as any).isPremium) return 1;
        return 0;
      });
    
    console.log('🔊 [Voices] Filtered voices for language:', filteredVoices.length);
    if (filteredVoices.length > 0) {
      console.log('🔊 [Voices] First 3 voices:', filteredVoices.slice(0, 3).map(v => v.name));
    }
    
    // Add fallback voices if none found for the language
    if (filteredVoices.length === 0) {
      console.log('🔊 [Voices] ⚠️ No voices for language, using defaults');
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
    
    // Auto-select best quality voice (first in sorted list) if none selected
    if (!selectedVoiceId && filteredVoices.length > 0) {
      console.log('🔊 [Voices] Auto-selecting voice:', filteredVoices[0].name);
      setSelectedVoiceId(filteredVoices[0].id);
    }
  }, [language, getLanguageCode, detectGender, selectedVoiceId]);

  const speak = useCallback((text: string) => {
    console.log('🔊 [TTS] speak() called');
    console.log('🔊 [TTS] isVoiceEnabled:', isVoiceEnabled);
    console.log('🔊 [TTS] text length:', text?.length);
    console.log('🔊 [TTS] window exists:', typeof window !== 'undefined');
    
    if (!isVoiceEnabled || !text || typeof window === 'undefined') {
      console.log('🔊 [TTS] Early return - voice disabled or no text');
      return;
    }

    // Check for browser support
    if (!('speechSynthesis' in window)) {
      console.error('🔊 [TTS] ❌ Speech synthesis not supported in this browser');
      return;
    }
    
    console.log('🔊 [TTS] ✅ speechSynthesis supported');

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    console.log('🔊 [TTS] Cancelled any ongoing speech');

    // Clean text for speech (remove emojis and special characters)
    const cleanText = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport & map symbols
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // dingbats
      .replace(/👋|🎤|📍|📅|👥|🚗|💰/g, '')  // specific emojis
      .trim();

    if (!cleanText) {
      console.log('🔊 [TTS] No clean text to speak after removing emojis');
      return;
    }
    
    console.log('🔊 [TTS] Clean text:', cleanText.substring(0, 50) + '...');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utteranceRef.current = utterance;

    const langCode = getLanguageCode(language);
    utterance.lang = langCode;
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    console.log('🔊 [TTS] Utterance configured - lang:', langCode, 'rate:', speechRate);

    // Use selected voice if available
    const voices = window.speechSynthesis.getVoices();
    console.log('🔊 [TTS] Available voices:', voices.length);
    
    if (selectedVoiceId) {
      const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceId);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🔊 [TTS] Using selected voice:', selectedVoice.name);
      } else {
        console.log('🔊 [TTS] ⚠️ Selected voice not found:', selectedVoiceId);
      }
    } else {
      // Fallback to any matching voice
      const matchingVoice = voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
        console.log('🔊 [TTS] Using fallback voice:', matchingVoice.name);
      } else {
        console.log('🔊 [TTS] ⚠️ No matching voice found for language:', langCode);
      }
    }

    utterance.onstart = () => {
      console.log('🔊 [TTS] 🎵 Speech started');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('🔊 [TTS] ✅ Speech ended');
      setIsSpeaking(false);
      // Call the onSpeakEnd callback when speech finishes
      if (onSpeakEndRef.current) {
        onSpeakEndRef.current();
      }
    };
    utterance.onerror = (event) => {
      console.error('🔊 [TTS] ❌ Speech error:', event.error);
      console.error('🔊 [TTS] Error details:', {
        error: event.error,
        message: (event as any).message,
        charIndex: event.charIndex,
        elapsedTime: event.elapsedTime
      });
      setIsSpeaking(false);
    };

    try {
      console.log('🔊 [TTS] Calling speechSynthesis.speak()...');
      window.speechSynthesis.speak(utterance);
      console.log('🔊 [TTS] speak() called successfully');
      
      // Chrome bug workaround: speech can get stuck, resume it
      if (window.speechSynthesis.paused) {
        console.log('🔊 [TTS] ⚠️ Speech was paused, resuming...');
        window.speechSynthesis.resume();
      }
    } catch (err) {
      console.error('🔊 [TTS] ❌ Exception in speak():', err);
    }
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
  EN: "Hello! I'm MT, your VIP transfer assistant. How can I help you?",
  TR: "Merhaba! Ben MT, VIP transfer asistanınız. Size nasıl yardımcı olabilirim?",
  DE: "Hallo! Ich bin MT, Ihr VIP-Transfer-Assistent. Wie kann ich Ihnen helfen?",
  FR: "Bonjour! Je suis MT, votre assistant de transfert VIP. Comment puis-je vous aider?",
  RU: "Здравствуйте! Я MT, ваш VIP-ассистент по трансферу. Чем могу помочь?",
  AR: "مرحباً! أنا MT، مساعدك للنقل VIP. كيف يمكنني مساعدتك؟",
  ES: "¡Hola! Soy MT, tu asistente de transfer VIP. ¿Cómo puedo ayudarte?",
  IT: "Ciao! Sono MT, il tuo assistente VIP per i trasferimenti. Come posso aiutarti?",
  UK: "Вітаю! Я MT, ваш VIP-асистент з трансферу. Чим можу допомогти?",
  JA: "こんにちは！VIPトランスファーアシスタントのMTです。どのようにお手伝いしましょうか？"
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
  const { setAIChatOpen } = useAIChat();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId] = useState(() => getVisitorId());
  const [bookingCreated, setBookingCreated] = useState<{ id: string; token: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
  // Default to true for hands-free experience
  const [continuousMode, setContinuousMode] = useState(true);
  const continuousModeRef = useRef(true);
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
    console.log('🔊 TTS finished speaking, continuousMode:', continuousModeRef.current);
    if (continuousModeRef.current && !isRecording && !isProcessing && isOpen) {
      // Small delay before starting recording to avoid feedback
      setTimeout(() => {
        if (continuousModeRef.current && startRecordingRef.current && !isRecording && !isProcessing && isOpen) {
          console.log('🎤 Auto-starting recording in continuous mode');
          startRecordingRef.current();
        }
      }, 500);
    }
  }, [isRecording, isProcessing, isOpen]);

  // Text-to-Speech with callback when speech ends
  const { isSpeaking, isVoiceEnabled, speak, stopSpeaking, toggleVoice, availableVoices, selectedVoiceId, selectVoice, speechRate, changeRate } = useTextToSpeech(language, handleSpeakEnd);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  
  // Toggle continuous conversation mode
  const toggleContinuousMode = useCallback(() => {
    setContinuousMode(prev => !prev);
  }, []);

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

  // Add welcome message when opened and no messages
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = welcomeMessages[language] || welcomeMessages.EN;
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: welcomeMessage
      }]);
      
      // Store the welcome message for speaking after voices are loaded
      if (!hasSpokenWelcomeRef.current) {
        welcomeMessageRef.current = welcomeMessage;
      }
    }
  }, [isOpen, language, messages.length]);

  // Function to speak welcome message with retry
  const speakWelcome = useCallback(() => {
    if (!welcomeMessageRef.current || hasSpokenWelcomeRef.current || !isVoiceEnabled) {
      return;
    }
    
    const voices = window.speechSynthesis?.getVoices() || [];
    console.log('🎙️ [Welcome] speakWelcome called, voices:', voices.length, 'userInteracted:', userInteractedRef.current);
    
    if (voices.length === 0) {
      console.log('🎙️ [Welcome] No voices yet, waiting...');
      return;
    }
    
    hasSpokenWelcomeRef.current = true;
    const messageToSpeak = welcomeMessageRef.current;
    welcomeMessageRef.current = null;
    
    console.log('🎙️ [Welcome] ✅ Speaking welcome message:', messageToSpeak.substring(0, 30) + '...');
    
    // Cancel any ongoing speech first
    window.speechSynthesis?.cancel();
    
    // Small delay for Chrome stability
    setTimeout(() => {
      speak(messageToSpeak);
    }, 100);
  }, [isVoiceEnabled, speak]);

  // Auto-speak welcome message once voices are loaded and chat is opened (user interaction)
  useEffect(() => {
    console.log('🎙️ [Welcome] Effect check:', {
      welcomeMessage: welcomeMessageRef.current?.substring(0, 30),
      availableVoices: availableVoices.length,
      hasSpokenWelcome: hasSpokenWelcomeRef.current,
      isVoiceEnabled,
      isOpen
    });
    
    // Opening the chat IS a user interaction, so we can speak
    if (isOpen && welcomeMessageRef.current && availableVoices.length > 0 && !hasSpokenWelcomeRef.current && isVoiceEnabled) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        speakWelcome();
      }, 500);
    } else if (welcomeMessageRef.current && !isVoiceEnabled) {
      console.log('🎙️ [Welcome] ⚠️ Voice disabled, not speaking welcome');
    } else if (welcomeMessageRef.current && availableVoices.length === 0) {
      console.log('🎙️ [Welcome] ⚠️ No voices available yet, will retry when loaded');
    }
  }, [availableVoices.length, isVoiceEnabled, speakWelcome, isOpen]);

  // Reset the spoken flag when chat is closed
  useEffect(() => {
    if (!isOpen) {
      hasSpokenWelcomeRef.current = false;
      welcomeMessageRef.current = null;
      hasAutoStartedRef.current = false;
    }
  }, [isOpen]);
  
  // Auto-start recording after welcome message when voice is disabled or not available
  useEffect(() => {
    if (isOpen && messages.length === 1 && !hasAutoStartedRef.current && continuousModeRef.current && !isVoiceEnabled) {
      // If voice is disabled, auto-start recording after a delay
      hasAutoStartedRef.current = true;
      setTimeout(() => {
        if (startRecordingRef.current && !isRecording && !isProcessing) {
          console.log('🎤 Auto-starting recording (voice disabled)');
          startRecordingRef.current();
        }
      }, 1000);
    }
  }, [isOpen, messages.length, isVoiceEnabled, isRecording, isProcessing]);

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
        {/* Mobile Floating Toggle Button - More prominent with animation */}
        <AnimatePresence>
          {!isOpen && (
            <MobileTooltip
              content={
                <span className="font-medium">
                  {language === "TR" ? "AI Rezervasyon Asistanı" : "AI Booking Assistant"}
                </span>
              }
              side="left"
              contentClassName="bg-primary text-primary-foreground border border-primary"
              longPressThreshold={400}
              autoHideDelay={2500}
            >
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                data-chat-trigger
                className="fixed bottom-[calc(8.75rem+env(safe-area-inset-bottom))] right-3 z-[9999] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-xl touch-manipulation border-2 border-primary-foreground/20"
                style={{
                  WebkitTapHighlightColor: "transparent",
                  boxShadow:
                    "0 4px 20px rgba(0, 0, 0, 0.25), 0 0 0 3px hsl(var(--primary) / 0.2)",
                }}
              >
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
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) {
                  setIsOpen(false);
                }
              }}
              data-mobile-panel
              className="fixed inset-x-0 z-[9998] bg-card rounded-t-2xl shadow-2xl border-t border-border flex flex-col"
              style={{
                // Position panel above keyboard
                top: keyboardHeight > 0 ? '0.5rem' : '25%',
                bottom: keyboardHeight > 0 ? `${keyboardHeight}px` : 0,
                maxHeight: keyboardHeight > 0 
                  ? `calc(100% - ${keyboardHeight}px - 0.5rem)` 
                  : '75%',
                minHeight: '200px',
                touchAction: 'auto',
                pointerEvents: 'auto',
                paddingBottom: '0',
              }}
            >
                {/* Drag Handle - Swipe indicator */}
                 <div 
                   className="flex justify-center pt-2 pb-1.5 cursor-grab active:cursor-grabbing shrink-0"
                   style={{ touchAction: 'none' }}
                   onPointerDown={(e) => dragControls.start(e.nativeEvent)}
                 >
                   <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                 </div>
                
                {/* Mobile Header - More Compact */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 shrink-0">
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
                    {messages.map((msg) => (
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
                            "max-w-[82%] rounded-xl px-2.5 py-1.5 text-[12px] leading-relaxed",
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
                    
                    {/* AI Speaking Indicator - Mobile */}
                    {isSpeaking && !isLoading && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex gap-2"
                      >
                        <motion.div 
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        >
                          <Volume2 className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-3 py-2 border border-primary/20">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-medium text-primary">
                              {language === "TR" ? "Konuşuyor" : "Speaking"}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                  key={i}
                                  className="w-0.5 bg-primary rounded-full"
                                  animate={{
                                    height: [4, 12 + Math.random() * 8, 4],
                                  }}
                                  transition={{
                                    duration: 0.4 + Math.random() * 0.2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.08,
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>

                {/* Mobile Input - Sticky at bottom */}
                <div 
                  className="shrink-0 p-2 border-t border-border bg-card mt-auto"
                  style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
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
                  <div className="flex gap-2">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isProcessing}
                      size="icon"
                      variant="outline"
                      className={cn(
                        "h-12 w-12 rounded-xl shrink-0 touch-manipulation",
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
                            block: 'center'
                          });
                        }, delay);
                      }}
                      placeholder={language === "TR" ? "Mesaj yazın..." : "Type message..."}
                      disabled={isLoading || isRecording}
                      className="h-12 rounded-xl text-sm flex-1 touch-manipulation"
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
                        "h-12 w-12 rounded-xl shrink-0 touch-manipulation",
                        input.trim() ? "bg-primary" : "bg-muted"
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
          
          {/* AI Speaking Indicator - Desktop */}
          {isSpeaking && !isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex gap-2.5 justify-start"
            >
              <motion.div 
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              >
                <Volume2 className="h-4 w-4 text-primary-foreground" />
              </motion.div>
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl px-4 py-2.5 border border-primary/20">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary">
                    {language === "TR" ? "Konuşuyor" : "Speaking"}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{
                          height: [6, 18 + Math.random() * 10, 6],
                        }}
                        transition={{
                          duration: 0.4 + Math.random() * 0.2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.08,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

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

      {/* Centered Microphone Button - Hero Style */}
      {isSpeechSupported && !isProcessing && !isLoading && !isSpeaking && messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-8"
        >
          <motion.button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center transition-colors",
              isRecording 
                ? "bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-lg shadow-destructive/30"
                : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Outer pulse rings - always animate */}
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-destructive/40" : "border-primary/30"
              )}
              animate={{
                scale: [1, 1.6, 1.6],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-destructive/40" : "border-primary/30"
              )}
              animate={{
                scale: [1, 1.4, 1.4],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
            <motion.div
              className={cn(
                "absolute inset-0 rounded-full border-2",
                isRecording ? "border-destructive/40" : "border-primary/30"
              )}
              animate={{
                scale: [1, 1.2, 1.2],
                opacity: [0.6, 0, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 1,
              }}
            />
            
            {/* Sound wave bars when recording */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive-foreground/80 rounded-full"
                      animate={{
                        height: [8, 20 + Math.random() * 16, 8],
                      }}
                      transition={{
                        duration: 0.5 + Math.random() * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Mic icon - show when not recording */}
            {!isRecording && (
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Mic className="h-10 w-10" />
              </motion.div>
            )}
          </motion.button>
          
          {/* Status text with wave animation */}
          <div className="mt-5 flex flex-col items-center gap-2">
            {isRecording ? (
              <>
                {/* Listening text with animated dots */}
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5"
                >
                  <motion.div
                    className="w-2 h-2 rounded-full bg-destructive"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-base font-medium text-destructive">
                    {language === "TR" ? "Dinliyorum" : "Listening"}
                  </span>
                  <motion.span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="text-destructive font-medium"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      >
                        .
                      </motion.span>
                    ))}
                  </motion.span>
                </motion.div>
                
                {/* Sound wave visualization */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-[3px] h-6"
                >
                  {audioLevels.map((level, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-destructive/70 rounded-full"
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
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    className="text-sm text-muted-foreground italic max-w-[250px] text-center"
                  >
                    "{interimTranscript}"
                  </motion.p>
                )}
                
                {/* Tap to stop hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-xs text-muted-foreground"
                >
                  {language === "TR" ? "Durdurmak için butona tıklayın" : "Tap to stop"}
                </motion.p>
              </>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-muted-foreground text-center"
              >
                {language === "TR" ? "Konuşmak için tıklayın" : "Tap to speak"}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className={cn(
        "flex gap-2",
        // Hide input area when showing hero mic button (but not during processing)
        isSpeechSupported && !isProcessing && !isLoading && !isSpeaking && messages.length <= 1 && "hidden"
      )}>
        {/* Voice recording button */}
        {isSpeechSupported && (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading || isProcessing}
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-xl shrink-0",
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
        
        {/* Voice output toggle with settings popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl shrink-0"
            >
              {isVoiceEnabled ? (
                <Volume2 className="h-5 w-5 text-primary" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3">
            <div className="space-y-4">
              {/* Voice toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === "TR" ? "Sesli Yanıt" : "Voice Response"}
                </span>
                <Button
                  variant={isVoiceEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleVoice}
                  className="h-7 px-3"
                >
                  {isVoiceEnabled 
                    ? (language === "TR" ? "Açık" : "On")
                    : (language === "TR" ? "Kapalı" : "Off")
                  }
                </Button>
              </div>
              
              {/* Continuous conversation mode toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {language === "TR" ? "Sürekli Konuşma" : "Continuous Mode"}
                </span>
                <Button
                  variant={continuousMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleContinuousMode}
                  className="h-7 px-3"
                >
                  {continuousMode 
                    ? (language === "TR" ? "Açık" : "On")
                    : (language === "TR" ? "Kapalı" : "Off")
                  }
                </Button>
              </div>

              {/* Voice selection with gender filter */}
              {availableVoices.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "TR" ? "Ses Seçimi" : "Voice Selection"}
                  </label>
                  
                  {/* Gender filter buttons */}
                  <div className="flex gap-1 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => {
                        const femaleVoice = availableVoices.find(v => v.gender === 'female');
                        if (femaleVoice) selectVoice(femaleVoice.id);
                      }}
                    >
                      <span>♀</span>
                      <span>{language === "TR" ? "Kadın" : "Female"}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs flex-1 gap-1"
                      onClick={() => {
                        const maleVoice = availableVoices.find(v => v.gender === 'male');
                        if (maleVoice) selectVoice(maleVoice.id);
                      }}
                    >
                      <span>♂</span>
                      <span>{language === "TR" ? "Erkek" : "Male"}</span>
                    </Button>
                  </div>
                  
                  {/* Voice list */}
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto">
                    {availableVoices.slice(0, 8).map((voice) => (
                      <Button
                        key={voice.id}
                        variant={selectedVoiceId === voice.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => selectVoice(voice.id)}
                        className="h-7 text-xs justify-start px-2"
                      >
                        <span className="truncate">{voice.name}</span>
                        {voice.gender !== 'neutral' && (
                          <span className="ml-1 opacity-60 text-[10px]">
                            {voice.gender === 'female' ? '♀' : '♂'}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Speech rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    {language === "TR" ? "Konuşma Hızı" : "Speech Rate"}
                  </label>
                  <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                    {speechRate.toFixed(1)}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => changeRate(Math.max(0.5, speechRate - 0.25))}
                    disabled={speechRate <= 0.5}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${((speechRate - 0.5) / 1.5) * 100}%` }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => changeRate(Math.min(2, speechRate + 0.25))}
                    disabled={speechRate >= 2}
                  >
                    <ChevronDown className="h-3 w-3 rotate-180" />
                  </Button>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>{language === "TR" ? "Yavaş" : "Slow"}</span>
                  <span>{language === "TR" ? "Normal" : "Normal"}</span>
                  <span>{language === "TR" ? "Hızlı" : "Fast"}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
