// Push notification service worker with enhanced features
const APP_NAME = 'Meet Transfer';
const DEFAULT_ICON = '/pwa-192x192.png';
const BADGE_ICON = '/pwa-192x192.png';

// Notification type configurations
const NOTIFICATION_CONFIGS = {
  reservation: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200, 100, 300],
    requireInteraction: true,
    tag: 'reservation'
  },
  driver: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [250, 100, 250],
    requireInteraction: true,
    tag: 'driver'
  },
  payment: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100, 50, 200],
    requireInteraction: false,
    tag: 'payment'
  },
  urgent: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [100, 50, 100, 50, 100, 50, 100, 50, 400],
    requireInteraction: true,
    tag: 'urgent'
  },
  default: {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    tag: 'notification'
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

self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
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
    // Try to parse as text
    try {
      data.body = event.data.text();
    } catch (textError) {
      console.error('[SW] Error parsing push text:', textError);
    }
  }

  // Determine notification type
  const notificationType = data.type || getNotificationType(data.title, data.body);
  const config = NOTIFICATION_CONFIGS[notificationType] || NOTIFICATION_CONFIGS.default;

  const options = {
    body: data.body,
    icon: data.icon || config.icon,
    badge: data.badge || config.badge,
    vibrate: config.vibrate,
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
    tag: config.tag + '-' + Date.now(), // Unique tag for each notification
    renotify: true,
    silent: false, // Allow sound
    timestamp: data.timestamp || Date.now()
  };

  // Add time to body if available
  if (data.timestamp) {
    options.body = `${data.body}\n🕐 ${formatTime(data.timestamp)}`;
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
        // Notify all clients about the new notification
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'NOTIFICATION_RECEIVED',
            data: data
          });
        });
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click:', event.action, event.notification);
  
  event.notification.close();
  
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
            // Navigate and focus the existing window
            return client.navigate(urlToOpen).then(() => client.focus());
          }
        }
        // If no window is open, open a new one
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .then(() => {
        // Notify the app that notification was clicked
        return self.clients.matchAll({ type: 'window' });
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'NOTIFICATION_CLICKED',
            url: urlToOpen,
            notificationType: event.notification.data?.type
          });
        });
      })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Notify app about dismissed notification
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ 
        type: 'NOTIFICATION_DISMISSED',
        tag: event.notification.tag
      });
    });
  });
});

// Handle messages from the main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SET_BADGE') {
    const count = event.data.count;
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => console.log('[SW] Badge error:', err));
      } else {
        navigator.clearAppBadge().catch(err => console.log('[SW] Clear badge error:', err));
      }
    }
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('[SW] Installed');
  self.skipWaiting();
});
