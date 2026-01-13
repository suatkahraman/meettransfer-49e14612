import { useState, useEffect } from "react";
import type { CityVideo } from "@/components/hero/types";

import vitoVipImg from "@/assets/vito-vip-1.jpg";

// CDN URLs for hero videos (Supabase Storage with edge caching)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CDN_VIDEO_BASE = `${SUPABASE_URL}/storage/v1/object/public/hero-videos`;

// Video configuration with CDN URLs and local fallbacks
const VIDEO_CONFIG = {
  istanbul: {
    cdn: `${CDN_VIDEO_BASE}/hero-istanbul.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-istanbul.webm`,
    poster: "/images/destinations/istanbul-city.jpg",
    label: "Istanbul",
    labelTR: "İstanbul"
  },
  antalya: {
    cdn: `${CDN_VIDEO_BASE}/hero-antalya.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-antalya.webm`,
    poster: "/images/destinations/antalya-city.jpg",
    label: "Antalya",
    labelTR: "Antalya"
  },
  bodrum: {
    cdn: `${CDN_VIDEO_BASE}/hero-bodrum.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-bodrum.webm`,
    poster: "/images/destinations/bodrum-city.jpg",
    label: "Bodrum",
    labelTR: "Bodrum"
  },
  vipTransfer: {
    cdn: `${CDN_VIDEO_BASE}/hero-mercedes-video.mp4`,
    cdnWebm: `${CDN_VIDEO_BASE}/hero-mercedes-video.webm`,
    poster: vitoVipImg,
    label: "VIP Transfer",
    labelTR: "VIP Transfer"
  }
};

export interface UseHeroVideosReturn {
  videosLoaded: boolean;
  cityVideos: CityVideo[];
  currentVideoIndex: number;
  setCurrentVideoIndex: React.Dispatch<React.SetStateAction<number>>;
}

export function useHeroVideos(): UseHeroVideosReturn {
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [cityVideos, setCityVideos] = useState<CityVideo[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  // Load videos from CDN - DEFERRED to not block initial render
  useEffect(() => {
    // On mobile, videos are not shown - skip entirely
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return;

    const loadVideosFromCDN = async () => {
      try {
        // Load Istanbul first (most common destination) - direct URL, no HEAD check
        const istanbulVideo: CityVideo = {
          src: VIDEO_CONFIG.istanbul.cdn,
          srcMp4: VIDEO_CONFIG.istanbul.cdn,
          poster: VIDEO_CONFIG.istanbul.poster,
          label: VIDEO_CONFIG.istanbul.label,
          labelTR: VIDEO_CONFIG.istanbul.labelTR
        };

        setCityVideos([istanbulVideo]);
        setVideosLoaded(true);

        // Load remaining videos much later with very low priority
        setTimeout(() => {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => {
              const additionalVideos: CityVideo[] = [
                { 
                  src: VIDEO_CONFIG.antalya.cdn,
                  poster: VIDEO_CONFIG.antalya.poster,
                  label: VIDEO_CONFIG.antalya.label,
                  labelTR: VIDEO_CONFIG.antalya.labelTR
                },
                { 
                  src: VIDEO_CONFIG.bodrum.cdn,
                  poster: VIDEO_CONFIG.bodrum.poster,
                  label: VIDEO_CONFIG.bodrum.label,
                  labelTR: VIDEO_CONFIG.bodrum.labelTR
                },
                { 
                  src: VIDEO_CONFIG.vipTransfer.cdn,
                  poster: VIDEO_CONFIG.vipTransfer.poster,
                  label: VIDEO_CONFIG.vipTransfer.label,
                  labelTR: VIDEO_CONFIG.vipTransfer.labelTR
                },
              ];

              setCityVideos(prev => [...prev, ...additionalVideos]);
            }, { timeout: 5000 });
          } else {
            // Fallback for browsers without requestIdleCallback
            const additionalVideos: CityVideo[] = [
              { 
                src: VIDEO_CONFIG.antalya.cdn,
                poster: VIDEO_CONFIG.antalya.poster,
                label: VIDEO_CONFIG.antalya.label,
                labelTR: VIDEO_CONFIG.antalya.labelTR
              },
              { 
                src: VIDEO_CONFIG.bodrum.cdn,
                poster: VIDEO_CONFIG.bodrum.poster,
                label: VIDEO_CONFIG.bodrum.label,
                labelTR: VIDEO_CONFIG.bodrum.labelTR
              },
              { 
                src: VIDEO_CONFIG.vipTransfer.cdn,
                poster: VIDEO_CONFIG.vipTransfer.poster,
                label: VIDEO_CONFIG.vipTransfer.label,
                labelTR: VIDEO_CONFIG.vipTransfer.labelTR
              },
            ];
            setCityVideos(prev => [...prev, ...additionalVideos]);
          }
        }, 3000); // Wait 3 seconds before loading additional videos
      } catch (error) {
        console.error('[Hero] Video load error:', error);
        setVideosLoaded(true); // Allow fallback image to show
      }
    };

    // Delay video loading to prioritize form rendering
    const timer = setTimeout(loadVideosFromCDN, 500);
    return () => clearTimeout(timer);
  }, []);

  // Video rotation
  useEffect(() => {
    if (!videosLoaded || cityVideos.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentVideoIndex((prev) => (prev + 1) % cityVideos.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [videosLoaded, cityVideos.length]);

  return {
    videosLoaded,
    cityVideos,
    currentVideoIndex,
    setCurrentVideoIndex
  };
}
