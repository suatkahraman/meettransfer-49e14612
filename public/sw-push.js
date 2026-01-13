// Push notification service worker with enhanced features
// Works even when app is closed - handles sound, vibration, and badge
const APP_NAME = 'Meet Transfer';
const DEFAULT_ICON = '/pwa-192x192.png';
const BADGE_ICON = '/pwa-192x192.png';

// Store badge count
let currentBadgeCount = 0;

// Notification type configurations with sounds
const NOTIFICATION_CONFIGS = {
  reservation: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 300],
    requireInteraction: true,
    tag: 'reservation',
    sound: 'default'
  },
  driver: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [250, 100, 250],
    requireInteraction: true,
    tag: 'driver',
    sound: 'default'
  },
  payment: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100, 50, 200],
    requireInteraction: false,
    tag: 'payment',
    sound: 'default'
  },
  urgent: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100, 50, 100, 50, 100, 50, 400],
    requireInteraction: true,
    tag: 'urgent',
    sound: 'default'
  },
  default: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: 'notification',
    sound: 'default'
  }
};

// Get notification type from title/body
function getNotificationType(title, body) {
  const text = (title + ' ' + body).toLowerCase();
  
  if (text.includes('urgent') || text.includes('acil') || text.includes('immediately')) {
    return 'urgent';
  }
  if (text.includes('driver') || text.includes('sürücü') || text.includes('job') || text.includes('iş')) {
    return 'driver';
  }
  if (text.includes('payment') || text.includes('ödeme') || text.includes('price') || text.includes('fiyat') || text.includes('₺') || text.includes('€') || text.includes('$')) {
    return 'payment';
  }
  if (text.includes('reservation') || text.includes('rezervasyon') || text.includes('booking') || text.includes('transfer')) {
    return 'reservation';
  }
  
  return 'default';
}

// Format timestamp for notification
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Update app badge count
async function updateBadgeCount(increment = true) {
  if (increment) {
    currentBadgeCount++;
  }
  
  if ('setAppBadge' in navigator) {
    try {
      if (currentBadgeCount > 0) {
        await navigator.setAppBadge(currentBadgeCount);
        console.log('[SW] Badge set to:', currentBadgeCount);
      } else {
        await navigator.clearAppBadge();
        console.log('[SW] Badge cleared');
      }
    } catch (err) {
      console.log('[SW] Badge error:', err);
    }
  }
  
  // Also try to use registration badge API
  if (self.registration && 'setAppBadge' in self.registration) {
    try {
      if (currentBadgeCount > 0) {
        await self.registration.setAppBadge(currentBadgeCount);
      } else {
        await self.registration.clearAppBadge();
      }
    } catch (err) {
      console.log('[SW] Registration badge error:', err);
    }
  }
}

// Main push event handler - works when app is closed
self.addEventListener('push', function(event) {
  console.log('[SW] Push received (app may be closed):', event);
  
  let data = {
    title: APP_NAME,
    body: 'Yeni bir bildiriminiz var',
    icon: DEFAULT_ICON,
    badge: BADGE_ICON,
    url: '/',
    type: 'default',
    timestamp: Date.now()
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    try {
      data.body = event.data.text();
    } catch (textError) {
      console.error('[SW] Error parsing push text:', textError);
    }
  }

  // Determine notification type
  const notificationType = data.type || getNotificationType(data.title, data.body);
  const config = NOTIFICATION_CONFIGS[notificationType] || NOTIFICATION_CONFIGS.default;

  // Build notification options - these work even when app is closed
  const options = {
    body: data.body,
    icon: data.icon || config.icon,
    badge: data.badge || config.badge,
    vibrate: config.vibrate, // Vibration pattern
    data: {
      url: data.url,
      type: notificationType,
      timestamp: data.timestamp,
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Aç', icon: '/pwa-192x192.png' },
      { action: 'close', title: 'Kapat' }
    ],
    requireInteraction: config.requireInteraction,
    tag: config.tag + '-' + Date.now(),
    renotify: true,
    // CRITICAL: silent must be false for sound to play when app is closed
    silent: false,
    timestamp: data.timestamp || Date.now()
  };

  // Add time to body if available
  if (data.timestamp) {
    options.body = `${data.body}\n🕐 ${formatTime(data.timestamp)}`;
  }

  event.waitUntil(
    Promise.all([
      // Show notification with sound and vibration
      self.registration.showNotification(data.title, options),
      // Update badge count
      updateBadgeCount(true)
    ])
      .then(() => {
        console.log('[SW] Notification shown with sound and vibration');
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then(clients => {
        // Notify open windows if any
        clients.forEach(client => {
          client.postMessage({ 
            type: 'NOTIFICATION_RECEIVED',
            data: data,
            badgeCount: currentBadgeCount
          });
        });
      })
      .catch(err => {
        console.error('[SW] Error showing notification:', err);
      })
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.action, event.notification);
  
  event.notification.close();
  
  // Decrease badge count when notification is clicked
  if (currentBadgeCount > 0) {
    currentBadgeCount--;
    updateBadgeCount(false);
  }
  
  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.navigate(urlToOpen).then(() => client.focus());
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .then(() => {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'NOTIFICATION_CLICKED',
            url: urlToOpen,
            notificationType: event.notification.data?.type,
            badgeCount: currentBadgeCount
          });
        });
      })
  );
});

// Handle notification close/dismiss
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Decrease badge count when notification is dismissed
  if (currentBadgeCount > 0) {
    currentBadgeCount--;
    updateBadgeCount(false);
  }
  
  // Notify app about dismissed notification
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ 
        type: 'NOTIFICATION_DISMISSED',
        tag: event.notification.tag,
        badgeCount: currentBadgeCount
      });
    });
  });
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SET_BADGE') {
    currentBadgeCount = event.data.count || 0;
    updateBadgeCount(false);
  }
  
  if (event.data && event.data.type === 'CLEAR_BADGE') {
    currentBadgeCount = 0;
    updateBadgeCount(false);
  }
  
  if (event.data && event.data.type === 'GET_BADGE_COUNT') {
    event.source.postMessage({
      type: 'BADGE_COUNT',
      count: currentBadgeCount
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[SW] Activated - push notifications ready for background');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear badge on activation
      updateBadgeCount(false)
    ])
  );
});

// Handle service worker installation
// NOTE: Do NOT call skipWaiting() here.
// PWA updates are controlled by the in-app prompt (SKIP_WAITING message).
self.addEventListener('install', function(event) {
  console.log('[SW] Installed - push handlers loaded');
});

