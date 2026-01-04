import { useCallback, useRef, useEffect } from 'react';
import { useUserRole } from './useUserRole';

export type NotificationSoundType = 
  | 'default'
  | 'success'
  | 'warning'
  | 'urgent'
  | 'message'
  | 'reservation'
  | 'driver'
  | 'payment';

interface NotificationSoundOptions {
  type?: NotificationSoundType;
  volume?: number; // 0.0 to 1.0
  vibrate?: boolean;
}

// Sound configurations for different notification types
const SOUND_CONFIGS: Record<NotificationSoundType, { 
  frequencies: number[]; 
  durations: number[]; 
  delays: number[];
  waveform: OscillatorType;
}> = {
  default: {
    frequencies: [880, 1108.73],
    durations: [0.1, 0.15],
    delays: [0, 0.1],
    waveform: 'sine'
  },
  success: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 - Major chord ascending
    durations: [0.1, 0.1, 0.2],
    delays: [0, 0.1, 0.2],
    waveform: 'sine'
  },
  warning: {
    frequencies: [440, 440, 440], // A4 repeated - attention grabbing
    durations: [0.15, 0.15, 0.15],
    delays: [0, 0.25, 0.5],
    waveform: 'triangle'
  },
  urgent: {
    frequencies: [880, 1046.5, 880, 1046.5, 1318.51], // Urgent pattern
    durations: [0.1, 0.1, 0.1, 0.1, 0.2],
    delays: [0, 0.12, 0.24, 0.36, 0.48],
    waveform: 'square'
  },
  message: {
    frequencies: [659.25, 783.99], // E5, G5 - Simple pleasant
    durations: [0.08, 0.12],
    delays: [0, 0.08],
    waveform: 'sine'
  },
  reservation: {
    frequencies: [523.25, 783.99, 1046.5], // C5, G5, C6 - Celebratory
    durations: [0.1, 0.1, 0.25],
    delays: [0, 0.12, 0.24],
    waveform: 'sine'
  },
  driver: {
    frequencies: [392, 523.25, 659.25], // G4, C5, E5 - Professional
    durations: [0.15, 0.15, 0.2],
    delays: [0, 0.18, 0.36],
    waveform: 'sine'
  },
  payment: {
    frequencies: [783.99, 987.77, 1174.66], // G5, B5, D6 - Cash register feel
    durations: [0.08, 0.08, 0.15],
    delays: [0, 0.1, 0.2],
    waveform: 'sine'
  }
};

// Vibration patterns for different notification types
const VIBRATION_PATTERNS: Record<NotificationSoundType, number[]> = {
  default: [200, 100, 200],
  success: [100, 50, 100, 50, 200],
  warning: [300, 100, 300, 100, 300],
  urgent: [100, 50, 100, 50, 100, 50, 100, 50, 400],
  message: [150, 75, 150],
  reservation: [200, 100, 200, 100, 300],
  driver: [250, 100, 250],
  payment: [100, 50, 100, 50, 200]
};

export const useNotificationSound = () => {
  const { role } = useUserRole();
  const audioContextRef = useRef<AudioContext | null>(null);
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver';
  const isImportantRole = isAdmin || isDriver;

  // Initialize AudioContext on first user interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const vibrate = useCallback((pattern?: number[]) => {
    if ('vibrate' in navigator) {
      try {
        const vibratePattern = pattern || VIBRATION_PATTERNS.default;
        navigator.vibrate(vibratePattern);
      } catch (error) {
        console.log('Vibration not supported:', error);
      }
    }
  }, []);

  const playSound = useCallback((options: NotificationSoundOptions = {}) => {
    const { 
      type = 'default', 
      volume: customVolume, 
      vibrate: shouldVibrate = isImportantRole 
    } = options;

    try {
      const audioContext = getAudioContext();
      const config = SOUND_CONFIGS[type];
      
      // Volume based on role and custom setting
      const baseVolume = isImportantRole ? 0.7 : 0.4;
      const volume = customVolume ?? baseVolume;

      // Create master gain for overall volume control
      const masterGain = audioContext.createGain();
      masterGain.connect(audioContext.destination);
      masterGain.gain.setValueAtTime(volume, audioContext.currentTime);

      // Play each tone in the sequence
      config.frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.type = config.waveform;
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        
        const startTime = audioContext.currentTime + config.delays[index];
        const duration = config.durations[index];
        
        // Envelope for smoother sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(1, startTime + 0.02);
        gainNode.gain.setValueAtTime(1, startTime + duration - 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.01);
      });

      // Vibrate if enabled
      if (shouldVibrate) {
        vibrate(VIBRATION_PATTERNS[type]);
      }
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }, [getAudioContext, isImportantRole, vibrate]);

  // Convenience methods for common notification types
  const playSuccess = useCallback(() => playSound({ type: 'success' }), [playSound]);
  const playWarning = useCallback(() => playSound({ type: 'warning' }), [playSound]);
  const playUrgent = useCallback(() => playSound({ type: 'urgent' }), [playSound]);
  const playMessage = useCallback(() => playSound({ type: 'message' }), [playSound]);
  const playReservation = useCallback(() => playSound({ type: 'reservation' }), [playSound]);
  const playDriver = useCallback(() => playSound({ type: 'driver' }), [playSound]);
  const playPayment = useCallback(() => playSound({ type: 'payment' }), [playSound]);

  // Test sound function
  const testSound = useCallback((type: NotificationSoundType = 'default') => {
    playSound({ type, vibrate: true });
  }, [playSound]);

  return { 
    playSound, 
    vibrate,
    // Convenience methods
    playSuccess,
    playWarning,
    playUrgent,
    playMessage,
    playReservation,
    playDriver,
    playPayment,
    // Testing
    testSound,
    // State
    isImportantRole
  };
};
