import * as React from "react";

interface LazyOnViewProps {
  children: React.ReactNode;
  /** Rendered before the content becomes visible (keeps layout stable) */
  placeholder?: React.ReactNode;
  /** Preload distance before entering viewport */
  rootMargin?: string;
  /** If true, mounts immediately (useful for SSR-ish cases) */
  disabled?: boolean;
}

export default function LazyOnView({
  children,
  placeholder,
  rootMargin = "600px 0px",
  disabled = false,
}: LazyOnViewProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = React.useState(disabled);

  React.useEffect(() => {
    if (disabled || visible) return;
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin, threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [disabled, visible, rootMargin]);

  return (
    <div ref={ref}>
      {visible ? children : (placeholder ?? null)}
    </div>
  );
}
