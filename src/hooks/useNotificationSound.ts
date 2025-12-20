import { useCallback } from 'react';
import { useUserRole } from './useUserRole';

export const useNotificationSound = () => {
  const { role } = useUserRole();
  const isAdmin = role === 'admin';

  const vibrate = useCallback(() => {
    // Vibration API - only for admin users
    if (isAdmin && 'vibrate' in navigator) {
      try {
        // Pattern: vibrate 200ms, pause 100ms, vibrate 200ms, pause 100ms, vibrate 300ms
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (error) {
        console.log('Vibration not supported:', error);
      }
    }
  }, [isAdmin]);

  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Admin users get louder notifications
      const volume = isAdmin ? 0.8 : 0.3;
      const duration = isAdmin ? 0.5 : 0.3;

      // Pleasant notification tone - more prominent for admins
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6 note
      
      if (isAdmin) {
        // Add a second tone burst for admin notifications
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2); // A5 again
        oscillator.frequency.setValueAtTime(1318.51, audioContext.currentTime + 0.3); // E6 note (higher)
        
        // Trigger vibration for admin
        vibrate();
      }
      
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }, [isAdmin, vibrate]);

  return { playSound, vibrate };
};
