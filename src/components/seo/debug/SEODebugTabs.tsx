import { Button } from '@/components/ui/button';
import { 
  Code, Languages, Link2, Tag, Bot, Gauge, Share2, FileCode, Globe 
} from 'lucide-react';
import { type SEODebugTab } from './types';

interface SEODebugTabsProps {
  activeTab: SEODebugTab;
  setActiveTab: (tab: SEODebugTab) => void;
  hasScanResults: boolean;
  hasLanguageResults: boolean;
  hasHreflangResults: boolean;
  hasCanonicalResults: boolean;
  hasMetaTagResults: boolean;
  hasRobotsResult: boolean;
  hasVitalsResult: boolean;
  hasSocialResult: boolean;
}

export const SEODebugTabs = ({
  activeTab,
  setActiveTab,
  hasScanResults,
  hasLanguageResults,
  hasHreflangResults,
  hasCanonicalResults,
  hasMetaTagResults,
  hasRobotsResult,
  hasVitalsResult,
  hasSocialResult
}: SEODebugTabsProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Button 
        variant={activeTab === 'current' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => setActiveTab('current')}
      >
        <Code className="h-4 w-4 mr-1" />
        Bu Sayfa
      </Button>
      {hasScanResults && (
        <Button 
          variant={activeTab === 'scanned' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('scanned')}
        >
          <FileCode className="h-4 w-4 mr-1" />
          Taranan
        </Button>
      )}
      {hasLanguageResults && (
        <Button 
          variant={activeTab === 'languages' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('languages')}
        >
          <Languages className="h-4 w-4 mr-1" />
          Diller
        </Button>
      )}
      {hasHreflangResults && (
        <Button 
          variant={activeTab === 'hreflang' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('hreflang')}
        >
          <Globe className="h-4 w-4 mr-1" />
          Hreflang
        </Button>
      )}
      {hasCanonicalResults && (
        <Button 
          variant={activeTab === 'canonical' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('canonical')}
        >
          <Link2 className="h-4 w-4 mr-1" />
          Canonical
        </Button>
      )}
      {hasMetaTagResults && (
        <Button 
          variant={activeTab === 'metatags' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('metatags')}
        >
          <Tag className="h-4 w-4 mr-1" />
          Meta
        </Button>
      )}
      {hasRobotsResult && (
        <Button 
          variant={activeTab === 'sitemap' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('sitemap')}
        >
          <Bot className="h-4 w-4 mr-1" />
          Sitemap
        </Button>
      )}
      {hasVitalsResult && (
        <Button 
          variant={activeTab === 'vitals' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('vitals')}
        >
          <Gauge className="h-4 w-4 mr-1" />
          Vitals
        </Button>
      )}
      {hasSocialResult && (
        <Button 
          variant={activeTab === 'social' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setActiveTab('social')}
        >
          <Share2 className="h-4 w-4 mr-1" />
          Sosyal
        </Button>
      )}
    </div>
  );
};
