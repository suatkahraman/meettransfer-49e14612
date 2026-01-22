import { useEffect, useRef, useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { runAfterInteractive } from "@/utils/afterInteractive";

// Storage keys
const VISITOR_ID_KEY = "meet_visitor_id";
const TRACKING_SESSION_KEY = "meet_tracking_session";

// Tracking configuration
const SCROLL_DEPTH_THRESHOLDS = [25, 50, 75, 90, 100];
const CLICK_DEBOUNCE_MS = 100;
const INTERACTION_BATCH_SIZE = 20;
const INTERACTION_FLUSH_INTERVAL = 30000; // 30 seconds

interface ScrollEvent {
  type: "scroll";
  depth: number;
  timestamp: number;
  page: string;
}

interface ClickEvent {
  type: "click";
  element: string;
  selector: string;
  x: number;
  y: number;
  viewportWidth: number;
  viewportHeight: number;
  timestamp: number;
  page: string;
}

interface FormEvent {
  type: "form_start" | "form_field_focus" | "form_field_blur" | "form_submit" | "form_abandon";
  formId: string;
  fieldName?: string;
  timeSpent?: number;
  timestamp: number;
  page: string;
}

interface EngagementEvent {
  type: "time_on_page" | "visibility_change" | "idle" | "active";
  duration?: number;
  visible?: boolean;
  timestamp: number;
  page: string;
}

type TrackingEvent = ScrollEvent | ClickEvent | FormEvent | EngagementEvent;

interface TrackingSession {
  visitorId: string;
  sessionStart: number;
  events: TrackingEvent[];
  scrollDepthsReached: Set<number>;
  formInteractions: Map<string, { startTime: number; fieldsInteracted: Set<string> }>;
  pageLoadTime: number;
  activeTime: number;
  idleTime: number;
}

// Get or create visitor ID
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = `v_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return `v_temp_${Date.now().toString(36)}`;
  }
}

// Get element identifier for click tracking
function getElementIdentifier(element: HTMLElement): { selector: string; label: string } {
  const tag = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes = element.className && typeof element.className === "string" 
    ? `.${element.className.split(" ").filter(Boolean).slice(0, 2).join(".")}` 
    : "";
  
  // Try to get meaningful label
  let label = "";
  if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
    label = element.textContent?.trim().substring(0, 50) || "";
  } else if (element instanceof HTMLInputElement) {
    label = element.placeholder || element.name || element.type;
  } else if (element.getAttribute("aria-label")) {
    label = element.getAttribute("aria-label") || "";
  }

  const selector = id || classes || tag;
  return { selector: `${tag}${selector}`, label: label || tag };
}

// Check if element is part of a form
function getFormInfo(element: HTMLElement): { formId: string; fieldName: string } | null {
  const form = element.closest("form");
  if (!form) return null;
  
  const formId = form.id || form.getAttribute("name") || "unnamed-form";
  const fieldName = (element as HTMLInputElement).name || 
                    (element as HTMLInputElement).id || 
                    element.getAttribute("aria-label") || 
                    "unknown-field";
  
  return { formId, fieldName };
}

export function useAdvancedTracking() {
  const location = useLocation();
  const [enabled, setEnabled] = useState(false);
  const sessionRef = useRef<TrackingSession | null>(null);
  // Defer heavy event listeners + timers until after first interaction/idle.
  useEffect(() => {
    runAfterInteractive(
      () => setEnabled(true),
      { requireInteraction: true, idleTimeoutMs: 4500, minDelayMs: 0 }
    );
  }, []);

  const lastClickRef = useRef<number>(0);
  const lastScrollRef = useRef<number>(0);
  const pageStartTimeRef = useRef<number>(Date.now());
  const isActiveRef = useRef<boolean>(true);
  const lastActivityRef = useRef<number>(Date.now());
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize session
  const initSession = useCallback(() => {
    const visitorId = getVisitorId();
    sessionRef.current = {
      visitorId,
      sessionStart: Date.now(),
      events: [],
      scrollDepthsReached: new Set(),
      formInteractions: new Map(),
      pageLoadTime: Date.now(),
      activeTime: 0,
      idleTime: 0,
    };
    pageStartTimeRef.current = Date.now();
  }, []);

  // Add event to batch
  const addEvent = useCallback((event: TrackingEvent) => {
    if (!sessionRef.current) return;
    
    sessionRef.current.events.push(event);
    
    // Auto-flush if batch is full
    if (sessionRef.current.events.length >= INTERACTION_BATCH_SIZE) {
      flushEvents();
    }
  }, []);

  // Flush events to server
  const flushEvents = useCallback(async () => {
    if (!sessionRef.current || sessionRef.current.events.length === 0) return;
    
    const session = sessionRef.current;
    const events = [...session.events];
    session.events = []; // Clear the batch

    try {
      await supabase.functions.invoke("track-interactions", {
        body: {
          visitor_id: session.visitorId,
          page_path: location.pathname,
          events,
          scroll_depths_reached: Array.from(session.scrollDepthsReached),
          active_time_ms: session.activeTime,
          idle_time_ms: session.idleTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Re-add events if flush failed
      session.events = [...events, ...session.events];
      console.error("[AdvancedTracking] Flush error:", error);
    }
  }, [location.pathname]);

  // Track scroll depth
  const handleScroll = useCallback(() => {
    if (!sessionRef.current) return;
    
    const now = Date.now();
    if (now - lastScrollRef.current < 200) return; // Throttle
    lastScrollRef.current = now;

    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

    // Check which thresholds are crossed
    for (const threshold of SCROLL_DEPTH_THRESHOLDS) {
      if (scrollPercent >= threshold && !sessionRef.current.scrollDepthsReached.has(threshold)) {
        sessionRef.current.scrollDepthsReached.add(threshold);
        addEvent({
          type: "scroll",
          depth: threshold,
          timestamp: now,
          page: location.pathname,
        });
      }
    }
  }, [location.pathname, addEvent]);

  // Track clicks
  const handleClick = useCallback((e: MouseEvent) => {
    if (!sessionRef.current) return;
    
    const now = Date.now();
    if (now - lastClickRef.current < CLICK_DEBOUNCE_MS) return;
    lastClickRef.current = now;

    const target = e.target as HTMLElement;
    if (!target) return;

    // Get clickable element (bubble up to find button, link, etc.)
    let clickableElement = target;
    const maxDepth = 5;
    for (let i = 0; i < maxDepth && clickableElement; i++) {
      if (
        clickableElement.tagName === "BUTTON" ||
        clickableElement.tagName === "A" ||
        clickableElement.tagName === "INPUT" ||
        clickableElement.getAttribute("role") === "button" ||
        clickableElement.onclick
      ) {
        break;
      }
      clickableElement = clickableElement.parentElement as HTMLElement;
    }

    const { selector, label } = getElementIdentifier(clickableElement || target);

    addEvent({
      type: "click",
      element: label,
      selector,
      x: e.clientX,
      y: e.clientY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timestamp: now,
      page: location.pathname,
    });

    // Track activity
    lastActivityRef.current = now;
    isActiveRef.current = true;
  }, [location.pathname, addEvent]);

  // Track form interactions
  const handleFocus = useCallback((e: FocusEvent) => {
    if (!sessionRef.current) return;
    
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const formInfo = getFormInfo(target);
    if (!formInfo) return;

    const now = Date.now();
    const { formId, fieldName } = formInfo;

    // Initialize form tracking if not exists
    if (!sessionRef.current.formInteractions.has(formId)) {
      sessionRef.current.formInteractions.set(formId, {
        startTime: now,
        fieldsInteracted: new Set(),
      });
      
      addEvent({
        type: "form_start",
        formId,
        timestamp: now,
        page: location.pathname,
      });
    }

    const formData = sessionRef.current.formInteractions.get(formId)!;
    formData.fieldsInteracted.add(fieldName);

    addEvent({
      type: "form_field_focus",
      formId,
      fieldName,
      timestamp: now,
      page: location.pathname,
    });

    lastActivityRef.current = now;
  }, [location.pathname, addEvent]);

  const handleBlur = useCallback((e: FocusEvent) => {
    if (!sessionRef.current) return;
    
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    const formInfo = getFormInfo(target);
    if (!formInfo) return;

    const now = Date.now();
    const { formId, fieldName } = formInfo;

    addEvent({
      type: "form_field_blur",
      formId,
      fieldName,
      timestamp: now,
      page: location.pathname,
    });
  }, [location.pathname, addEvent]);

  // Track form submission
  const handleSubmit = useCallback((e: Event) => {
    if (!sessionRef.current) return;
    
    const form = e.target as HTMLFormElement;
    if (!form) return;

    const formId = form.id || form.getAttribute("name") || "unnamed-form";
    const now = Date.now();
    
    const formData = sessionRef.current.formInteractions.get(formId);
    const timeSpent = formData ? now - formData.startTime : 0;

    addEvent({
      type: "form_submit",
      formId,
      timeSpent,
      timestamp: now,
      page: location.pathname,
    });
  }, [location.pathname, addEvent]);

  // Track visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (!sessionRef.current) return;
    
    const now = Date.now();
    const visible = document.visibilityState === "visible";

    addEvent({
      type: "visibility_change",
      visible,
      timestamp: now,
      page: location.pathname,
    });

    if (!visible) {
      // User left the page - track time
      sessionRef.current.activeTime += now - pageStartTimeRef.current;
    } else {
      pageStartTimeRef.current = now;
    }
  }, [location.pathname, addEvent]);

  // Track idle/active state
  const checkIdleState = useCallback(() => {
    if (!sessionRef.current) return;
    
    const now = Date.now();
    const timeSinceActivity = now - lastActivityRef.current;
    const wasActive = isActiveRef.current;

    // Consider idle after 30 seconds of no activity
    const isNowActive = timeSinceActivity < 30000;

    if (wasActive && !isNowActive) {
      isActiveRef.current = false;
      addEvent({
        type: "idle",
        timestamp: now,
        page: location.pathname,
      });
    } else if (!wasActive && isNowActive) {
      isActiveRef.current = true;
      addEvent({
        type: "active",
        timestamp: now,
        page: location.pathname,
      });
    }

    // Update time tracking
    if (isNowActive) {
      sessionRef.current.activeTime += 5000; // 5 second interval
    } else {
      sessionRef.current.idleTime += 5000;
    }
  }, [location.pathname, addEvent]);

  // Track page unload
  const handleBeforeUnload = useCallback(() => {
    if (!sessionRef.current) return;
    
    // Check for form abandonment
    sessionRef.current.formInteractions.forEach((data, formId) => {
      if (data.fieldsInteracted.size > 0) {
        addEvent({
          type: "form_abandon",
          formId,
          timeSpent: Date.now() - data.startTime,
          timestamp: Date.now(),
          page: location.pathname,
        });
      }
    });

    // Final time tracking
    addEvent({
      type: "time_on_page",
      duration: Date.now() - pageStartTimeRef.current,
      timestamp: Date.now(),
      page: location.pathname,
    });

    // Synchronous flush on unload
    flushEvents();
  }, [location.pathname, addEvent, flushEvents]);

  // Setup and cleanup
  useEffect(() => {
    if (!enabled) return;
    initSession();

    // Add event listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    document.addEventListener("submit", handleSubmit, { capture: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Setup intervals
    flushIntervalRef.current = setInterval(flushEvents, INTERACTION_FLUSH_INTERVAL);
    idleTimeoutRef.current = setInterval(checkIdleState, 5000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
      document.removeEventListener("submit", handleSubmit, { capture: true });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (flushIntervalRef.current) clearInterval(flushIntervalRef.current);
      if (idleTimeoutRef.current) clearInterval(idleTimeoutRef.current);

      // Final flush
      flushEvents();
    };
  }, [enabled, initSession, handleScroll, handleClick, handleFocus, handleBlur, handleSubmit, handleVisibilityChange, handleBeforeUnload, flushEvents, checkIdleState]);

  // Track page changes
  useEffect(() => {
    if (!enabled) return;
    if (!sessionRef.current) return;
    
    // Reset page-specific tracking
    sessionRef.current.scrollDepthsReached.clear();
    pageStartTimeRef.current = Date.now();

    addEvent({
      type: "time_on_page",
      duration: 0,
      timestamp: Date.now(),
      page: location.pathname,
    });
  }, [location.pathname, addEvent]);

  return { visitorId: sessionRef.current?.visitorId || getVisitorId() };
}
