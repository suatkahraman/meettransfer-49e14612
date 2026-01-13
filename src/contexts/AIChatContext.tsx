import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface AIChatContextType {
  isAIChatOpen: boolean;
  setAIChatOpen: (open: boolean) => void;
}

const AIChatContext = createContext<AIChatContextType>({
  isAIChatOpen: false,
  setAIChatOpen: () => {},
});

export function AIChatProvider({ children }: { children: ReactNode }) {
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const setAIChatOpen = useCallback((open: boolean) => {
    setIsAIChatOpen(open);
  }, []);

  return (
    <AIChatContext.Provider value={{ isAIChatOpen, setAIChatOpen }}>
      {children}
    </AIChatContext.Provider>
  );
}

export function useAIChat() {
  return useContext(AIChatContext);
}
