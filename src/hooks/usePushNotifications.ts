import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// VAPID Public Key for Web Push
const VAPID_PUBLIC_KEY = 'BP3443JUKs9-80SKdwtiYac7YrALgxcsAJNIm0RABGG7cjT8eGwiINjbuO4FBdanQ0yA6EOklaSkVz6ZBJKBK6A';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

const PENDING_SUBSCRIPTION_KEY = 'pending_push_subscription';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [user]);

  // Sync pending subscription when user logs in
  useEffect(() => {
    if (user && isSupported) {
      syncPendingSubscription();
    }
  }, [user, isSupported]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Keep backend in sync (prevents "subscribed but no push" after stale endpoints are pruned)
      if (user && subscription) {
        const subscriptionJson = subscription.toJSON();
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert(
            {
              user_id: user.id,
              endpoint: subscriptionJson.endpoint!,
              p256dh: subscriptionJson.keys!.p256dh,
              auth: subscriptionJson.keys!.auth,
            },
            {
              onConflict: 'user_id,endpoint',
            }
          );

        if (error) {
          console.warn('Push subscription sync failed:', error);
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const syncPendingSubscription = async () => {
    if (!user) return;
    
    const pending = localStorage.getItem(PENDING_SUBSCRIPTION_KEY);
    if (!pending) return;
    
    try {
      const subscriptionJson = JSON.parse(pending);
      
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys.p256dh,
          auth: subscriptionJson.keys.auth
        }, {
          onConflict: 'user_id,endpoint'
        });

      if (!error) {
        localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
        console.log('Pending subscription synced to database');
      }
    } catch (error) {
      console.error('Error syncing pending subscription:', error);
    }
  };

  const subscribe = useCallback(async () => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subscriptionJson = subscription.toJSON();
      
      if (user) {
        // Save subscription to database immediately
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: subscriptionJson.endpoint!,
            p256dh: subscriptionJson.keys!.p256dh,
            auth: subscriptionJson.keys!.auth
          }, {
            onConflict: 'user_id,endpoint'
          });

        if (error) {
          console.error('Error saving subscription:', error);
          toast.error('Failed to save notification settings');
          return false;
        }
      } else {
        // Store in localStorage for later sync after login
        localStorage.setItem(PENDING_SUBSCRIPTION_KEY, JSON.stringify(subscriptionJson));
        toast.success('Notifications enabled! Sign in to receive personalized alerts.');
      }

      setIsSubscribed(true);
      if (user) {
        toast.success('Push notifications enabled!');
      }
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Failed to enable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database if logged in
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('endpoint', subscription.endpoint);
        }
      }
      
      // Clear any pending subscription
      localStorage.removeItem(PENDING_SUBSCRIPTION_KEY);
      
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe
  };
};
