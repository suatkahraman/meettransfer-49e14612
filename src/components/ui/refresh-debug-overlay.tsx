import { useState, useEffect, useRef } from 'react';
import { X, Bug } from 'lucide-react';

interface DebugEvent {
  id: number;
  timestamp: string;
  type: string;
  message: string;
}

const debugEvents: DebugEvent[] = [];
let eventId = 0;

const logEvent = (type: string, message: string) => {
  const now = new Date();
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  const timestamp = now.toLocaleTimeString('en-US', { hour12: false }) + '.' + ms;
  debugEvents.push({ id: ++eventId, timestamp, type, message });
  if (debugEvents.length > 30) debugEvents.shift();
  window.dispatchEvent(new CustomEvent('debug-event'));
};

// Attach global listeners once
if (typeof window !== 'undefined' && !(window as any).__refreshDebugInit) {
  (window as any).__refreshDebugInit = true;
  
  // Track page load
  logEvent('load', 'Page loaded');
  
  // Track visibility changes
  document.addEventListener('visibilitychange', () => {
    logEvent('visibility', `Document ${document.visibilityState}`);
  });
  
  // Track focus/blur
  window.addEventListener('focus', () => logEvent('focus', 'Window focused'));
  window.addEventListener('blur', () => logEvent('blur', 'Window blurred'));
  
  // Track beforeunload (page about to refresh/close)
  window.addEventListener('beforeunload', () => {
    logEvent('beforeunload', 'Page unloading!');
  });
  
  // Track popstate (navigation)
  window.addEventListener('popstate', () => {
    logEvent('popstate', `Navigation: ${window.location.pathname}`);
  });
  
  // Track errors
  window.addEventListener('error', (e) => {
    logEvent('error', e.message || 'Unknown error');
  });
  
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (e) => {
    logEvent('rejection', String(e.reason).slice(0, 100));
  });
  
  // Track HMR events from Vite
  if ((import.meta as any).hot) {
    (import.meta as any).hot.on('vite:beforeUpdate', () => {
      logEvent('hmr', 'Vite HMR update incoming');
    });
    (import.meta as any).hot.on('vite:afterUpdate', () => {
      logEvent('hmr', 'Vite HMR update applied');
    });
    (import.meta as any).hot.on('vite:beforeFullReload', () => {
      logEvent('hmr', '⚠️ Vite FULL RELOAD triggered!');
    });
    (import.meta as any).hot.on('vite:error', (e: any) => {
      logEvent('hmr', `Vite error: ${e?.message || 'unknown'}`);
    });
  }
  
  // Track service worker messages
  navigator.serviceWorker?.addEventListener('message', (e) => {
    logEvent('sw', `SW message: ${JSON.stringify(e.data).slice(0, 80)}`);
  });
  
  // Track service worker state changes
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    logEvent('sw', '⚠️ SW controller changed - may cause reload!');
  });
}

export const RefreshDebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([...debugEvents]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setEvents([...debugEvents]);
      setTimeout(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
      }, 10);
    };
    window.addEventListener('debug-event', update);
    return () => window.removeEventListener('debug-event', update);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-[9999] p-2 bg-red-500/90 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
        title="Open Refresh Debug"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hmr': return 'text-orange-400';
      case 'sw': return 'text-purple-400';
      case 'error': case 'rejection': return 'text-red-400';
      case 'load': return 'text-green-400';
      case 'beforeunload': return 'text-red-500 font-bold';
      default: return 'text-blue-400';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-96 max-h-80 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg shadow-xl overflow-hidden text-white">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/50">
        <span className="text-xs font-medium flex items-center gap-1.5">
          <Bug className="h-3 w-3 text-red-400" />
          Refresh Debug ({events.length} events)
        </span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div ref={scrollRef} className="overflow-y-auto max-h-64 p-2 space-y-1 text-xs font-mono">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No events yet</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="px-2 py-1 rounded bg-gray-800/50">
              <span className="text-gray-500">{event.timestamp}</span>{' '}
              <span className={getTypeColor(event.type)}>[{event.type}]</span>{' '}
              <span className="text-gray-300">{event.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RefreshDebugOverlay;
