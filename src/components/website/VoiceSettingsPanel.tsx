import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Volume2, VolumeX, Settings2, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface VoiceOption {
  id: string;
  name: string;
  lang: string;
  gender: 'male' | 'female' | 'neutral';
}

interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
}

interface VoiceSettingsPanelProps {
  language: string;
  isVoiceEnabled: boolean;
  toggleVoice: () => void;
  continuousMode: boolean;
  toggleContinuousMode: () => void;
  availableVoices: VoiceOption[];
  selectedVoiceId: string | null;
  selectVoice: (voiceId: string) => void;
  speechRate: number;
  changeRate: (rate: number) => void;
  voiceSettings?: VoiceSettings;
  changeVoiceSettings?: (settings: VoiceSettings) => void;
  triggerClassName?: string;
}

export function VoiceSettingsPanel({
  language,
  isVoiceEnabled,
  toggleVoice,
  continuousMode,
  toggleContinuousMode,
  availableVoices,
  selectedVoiceId,
  selectVoice,
  speechRate,
  changeRate,
  voiceSettings = { stability: 0.75, similarityBoost: 0.85, style: 0.35 },
  changeVoiceSettings,
  triggerClassName,
}: VoiceSettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-xl shrink-0 touch-manipulation",
            triggerClassName
          )}
        >
          {isVoiceEnabled ? (
            <Volume2 className="h-5 w-5 text-primary" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md px-4 pb-8">
          <DrawerHeader className="px-0 pb-4">
            <DrawerTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-primary" />
              {language === "TR" ? "Ses Ayarları" : "Voice Settings"}
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-6">
            {/* Voice Response Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isVoiceEnabled ? "bg-primary/20" : "bg-muted"
                )}>
                  {isVoiceEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {language === "TR" ? "Sesli Yanıt" : "Voice Response"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "TR" ? "AI yanıtlarını sesli dinle" : "Listen to AI responses"}
                  </p>
                </div>
              </div>
              <Button
                variant={isVoiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVoice}
                className="h-9 px-4"
              >
                {isVoiceEnabled 
                  ? (language === "TR" ? "Açık" : "On")
                  : (language === "TR" ? "Kapalı" : "Off")
                }
              </Button>
            </div>

            {/* Continuous Mode Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  continuousMode ? "bg-primary/20" : "bg-muted"
                )}>
                  <motion.div
                    animate={continuousMode ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <svg className={cn(
                      "h-5 w-5",
                      continuousMode ? "text-primary" : "text-muted-foreground"
                    )} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.5 12a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                      <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
                    </svg>
                  </motion.div>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {language === "TR" ? "Sürekli Konuşma" : "Continuous Mode"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === "TR" ? "Otomatik dinleme modu" : "Auto-listening mode"}
                  </p>
                </div>
              </div>
              <Button
                variant={continuousMode ? "default" : "outline"}
                size="sm"
                onClick={toggleContinuousMode}
                className="h-9 px-4"
              >
                {continuousMode 
                  ? (language === "TR" ? "Açık" : "On")
                  : (language === "TR" ? "Kapalı" : "Off")
                }
              </Button>
            </div>

            {/* Voice Selection */}
            {availableVoices.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium px-1">
                  {language === "TR" ? "Ses Seçimi" : "Voice Selection"}
                </p>
                
                {/* Gender Quick Select */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 text-sm"
                    onClick={() => {
                      const femaleVoice = availableVoices.find(v => v.gender === 'female');
                      if (femaleVoice) selectVoice(femaleVoice.id);
                    }}
                  >
                    <span className="text-lg mr-2">♀</span>
                    {language === "TR" ? "Kadın Ses" : "Female Voice"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 text-sm"
                    onClick={() => {
                      const maleVoice = availableVoices.find(v => v.gender === 'male');
                      if (maleVoice) selectVoice(maleVoice.id);
                    }}
                  >
                    <span className="text-lg mr-2">♂</span>
                    {language === "TR" ? "Erkek Ses" : "Male Voice"}
                  </Button>
                </div>
                
                {/* Voice List */}
                <div className="grid grid-cols-2 gap-2">
                  {availableVoices.slice(0, 6).map((voice) => (
                    <Button
                      key={voice.id}
                      variant={selectedVoiceId === voice.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectVoice(voice.id)}
                      className="h-10 text-sm justify-start px-3"
                    >
                      <span className="truncate flex-1">{voice.name}</span>
                      {voice.gender !== 'neutral' && (
                        <span className="ml-1 opacity-60">
                          {voice.gender === 'female' ? '♀' : '♂'}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Speech Rate - iOS optimized with touch slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-sm font-medium">
                  {language === "TR" ? "Konuşma Hızı" : "Speech Rate"}
                </p>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded-lg">
                  {speechRate.toFixed(2)}x
                </span>
              </div>
              
              <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                {/* Speed preset buttons */}
                <div className="grid grid-cols-5 gap-1">
                  {[0.7, 0.85, 1.0, 1.1, 1.2].map((rate) => (
                    <Button
                      key={rate}
                      variant={Math.abs(speechRate - rate) < 0.05 ? "default" : "outline"}
                      size="sm"
                      className="h-10 text-xs px-1 touch-manipulation"
                      onClick={() => changeRate(rate)}
                    >
                      {rate}x
                    </Button>
                  ))}
                </div>
                
                {/* Fine-tune controls */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0 touch-manipulation"
                    onClick={() => changeRate(Math.max(0.7, speechRate - 0.05))}
                    disabled={speechRate <= 0.7}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  {/* Touch-friendly slider for iOS */}
                  <div 
                    className="flex-1 h-8 bg-muted rounded-full overflow-hidden relative cursor-pointer touch-manipulation"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const percentage = x / rect.width;
                      // Map 0-1 to 0.7-1.2
                      const newRate = 0.7 + (percentage * 0.5);
                      changeRate(Math.max(0.7, Math.min(1.2, newRate)));
                    }}
                    onTouchMove={(e) => {
                      const touch = e.touches[0];
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = touch.clientX - rect.left;
                      const percentage = Math.max(0, Math.min(1, x / rect.width));
                      const newRate = 0.7 + (percentage * 0.5);
                      changeRate(Math.max(0.7, Math.min(1.2, newRate)));
                    }}
                  >
                    <motion.div 
                      className="h-full bg-primary rounded-full"
                      initial={false}
                      animate={{ width: `${((speechRate - 0.7) / 0.5) * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                    {/* Drag handle */}
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full shadow-lg border-2 border-background"
                      initial={false}
                      animate={{ left: `calc(${((speechRate - 0.7) / 0.5) * 100}% - 12px)` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0 touch-manipulation"
                    onClick={() => changeRate(Math.min(1.2, speechRate + 0.05))}
                    disabled={speechRate >= 1.2}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>0.7x {language === "TR" ? "Yavaş" : "Slow"}</span>
                <span>1.0x {language === "TR" ? "Normal" : "Normal"}</span>
                <span>1.2x {language === "TR" ? "Hızlı" : "Fast"}</span>
              </div>
            </div>

            {/* Voice Quality Settings - Stability, Similarity, Style */}
            {changeVoiceSettings && (
              <div className="space-y-4">
                <p className="text-sm font-medium px-1">
                  {language === "TR" ? "Ses Kalitesi Ayarları" : "Voice Quality Settings"}
                </p>
                
                {/* Stability Control */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {language === "TR" ? "Kararlılık" : "Stability"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "TR" 
                          ? "Düşük = daha ifadeli, Yüksek = daha tutarlı" 
                          : "Low = more expressive, High = more consistent"}
                      </p>
                    </div>
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded-lg">
                      {(voiceSettings.stability * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        stability: Math.max(0, voiceSettings.stability - 0.1)
                      })}
                      disabled={voiceSettings.stability <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={false}
                        animate={{ width: `${voiceSettings.stability * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        stability: Math.min(1, voiceSettings.stability + 0.1)
                      })}
                      disabled={voiceSettings.stability >= 1}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Similarity Boost Control */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {language === "TR" ? "Ses Benzerliği" : "Similarity"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "TR" 
                          ? "Orijinal sese yakınlık" 
                          : "Closeness to original voice"}
                      </p>
                    </div>
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded-lg">
                      {(voiceSettings.similarityBoost * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        similarityBoost: Math.max(0, voiceSettings.similarityBoost - 0.1)
                      })}
                      disabled={voiceSettings.similarityBoost <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={false}
                        animate={{ width: `${voiceSettings.similarityBoost * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        similarityBoost: Math.min(1, voiceSettings.similarityBoost + 0.1)
                      })}
                      disabled={voiceSettings.similarityBoost >= 1}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Style Control */}
                <div className="p-4 rounded-xl bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {language === "TR" ? "Stil Yoğunluğu" : "Style Intensity"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === "TR" 
                          ? "Konuşma stili abartısı" 
                          : "Speaking style exaggeration"}
                      </p>
                    </div>
                    <span className="text-sm font-mono bg-background px-2 py-1 rounded-lg">
                      {(voiceSettings.style * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        style: Math.max(0, voiceSettings.style - 0.1)
                      })}
                      disabled={voiceSettings.style <= 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary rounded-full"
                        initial={false}
                        animate={{ width: `${voiceSettings.style * 100}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 rounded-lg"
                      onClick={() => changeVoiceSettings({
                        ...voiceSettings,
                        style: Math.min(1, voiceSettings.style + 0.1)
                      })}
                      disabled={voiceSettings.style >= 1}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
