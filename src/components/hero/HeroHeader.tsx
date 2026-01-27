import { memo } from "react";

interface HeroHeaderProps {
  language: string;
}

// Simplified HeroHeader - trust badges removed as requested
export const HeroHeader = memo(({ language }: HeroHeaderProps) => {
  return null; // Header content now handled by WebsiteHeader
});

HeroHeader.displayName = "HeroHeader";
