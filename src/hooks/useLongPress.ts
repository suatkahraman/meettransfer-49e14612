import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  threshold?: number; // How long to wait before triggering (ms)
  onLongPress?: () => void;
  onLongPressEnd?: () => void;
}

export function useLongPress({
  threshold = 500,
  onLongPress,
  onLongPressEnd,
}: UseLongPressOptions = {}) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      // Prevent context menu on mobile
      event.preventDefault();
      targetRef.current = event.target;

      timeoutRef.current = setTimeout(() => {
        setIsPressed(true);
        onLongPress?.();
      }, threshold);
    },
    [threshold, onLongPress]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isPressed) {
      setIsPressed(false);
      onLongPressEnd?.();
    }
  }, [isPressed, onLongPressEnd]);

  const handlers = {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: cancel,
    onTouchCancel: cancel,
    // For desktop fallback (optional)
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
  };

  return {
    isPressed,
    handlers,
  };
}
