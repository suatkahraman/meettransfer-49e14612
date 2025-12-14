import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X, Bug } from 'lucide-react';

interface DebugEvent {
  id: number;
  timestamp: string;
  type: 'init' | 'place_changed' | 'error' | 'cleanup';
  message: string;
}

// Global event bus for debug events
const debugEvents: DebugEvent[] = [];
const listeners: Set<() => void> = new Set();
let eventId = 0;

export const logGooglePlacesEvent = (
  type: DebugEvent['type'],
  message: string
) => {
  const now = new Date();
  const ms = now.getMilliseconds().toString().padStart(3, '0');
  const timestamp = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + ms;
  const event: DebugEvent = {
    id: ++eventId,
    timestamp,
    type,
    message,
  };
  debugEvents.push(event);
  // Keep only last 20 events
  if (debugEvents.length > 20) {
    debugEvents.shift();
  }
  listeners.forEach((listener) => listener());
};

export const GooglePlacesDebugOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([...debugEvents]);

  useEffect(() => {
    const update = () => setEvents([...debugEvents]);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 p-2 bg-muted/90 border border-border rounded-full shadow-lg hover:bg-muted transition-colors"
        title="Open Google Places Debug"
      >
        <Bug className="h-4 w-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 w-80 max-h-72 bg-background/95 backdrop-blur border border-border rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
          <Bug className="h-3 w-3" />
          Google Places Debug
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-56 p-2 space-y-1 text-xs font-mono">
        {events.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No events yet</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={cn(
                'px-2 py-1 rounded',
                event.type === 'init' && 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
                event.type === 'place_changed' && 'bg-green-500/10 text-green-700 dark:text-green-300',
                event.type === 'error' && 'bg-red-500/10 text-red-700 dark:text-red-300',
                event.type === 'cleanup' && 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300'
              )}
            >
              <span className="text-muted-foreground">{event.timestamp}</span>{' '}
              <span className="font-semibold">[{event.type}]</span> {event.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GooglePlacesDebugOverlay;
