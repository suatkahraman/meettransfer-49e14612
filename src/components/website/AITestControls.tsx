import { memo, useState } from "react";
import { useAITestOptional } from "@/contexts/AITestContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  TestTube2, 
  Play, 
  Square, 
  RotateCcw, 
  FileText, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AITestControlsProps {
  language?: string;
}

export const AITestControls = memo(function AITestControls({ language = 'EN' }: AITestControlsProps) {
  const testContext = useAITestOptional();
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!testContext) {
    return null;
  }

  const { 
    smokeTestConfig, 
    enableSmokeTest, 
    disableSmokeTest, 
    resetChecklist,
    toggleUIFlags,
    setLogLevel,
    getTestReport 
  } = testContext;

  const { enabled, showUIFlags, logLevel } = smokeTestConfig;
  const isTR = language === 'TR';

  const handleToggleTest = () => {
    if (enabled) {
      disableSmokeTest();
    } else {
      enableSmokeTest('standard');
    }
  };

  const handleGetReport = () => {
    const report = getTestReport();
    console.log('═'.repeat(50));
    console.log('[AI-TEST] 📊 FINAL TEST REPORT');
    console.log('═'.repeat(50));
    console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`Progress: ${report.stepsCompleted}/${report.totalSteps} steps`);
    console.log(`Status: ${report.isSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    if (report.errors.length > 0) {
      console.log('Errors:', report.errors);
    }
    console.log('Completed:', report.completedSteps.map(s => s.nameEn));
    console.log('Pending:', report.pendingSteps.map(s => s.nameEn));
    console.log('═'.repeat(50));
  };

  return (
    <div className="fixed bottom-20 left-2 z-[9999]">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2 bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl p-3 w-52"
          >
            <div className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              {isTR ? 'Test Kontrolleri' : 'Test Controls'}
            </div>
            
            <div className="space-y-2">
              {/* Toggle Test */}
              <Button
                size="sm"
                variant={enabled ? "destructive" : "default"}
                className="w-full h-8 text-xs"
                onClick={handleToggleTest}
              >
                {enabled ? (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    {isTR ? 'Testi Durdur' : 'Stop Test'}
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 mr-1" />
                    {isTR ? 'Testi Başlat' : 'Start Test'}
                  </>
                )}
              </Button>

              {enabled && (
                <>
                  {/* Reset */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={resetChecklist}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {isTR ? 'Sıfırla' : 'Reset'}
                  </Button>

                  {/* Get Report */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-8 text-xs"
                    onClick={handleGetReport}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {isTR ? 'Rapor Al' : 'Get Report'}
                  </Button>

                  {/* Toggle UI Flags */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 text-xs"
                    onClick={() => toggleUIFlags(!showUIFlags)}
                  >
                    {showUIFlags ? (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        {isTR ? 'UI Gizle' : 'Hide UI'}
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        {isTR ? 'UI Göster' : 'Show UI'}
                      </>
                    )}
                  </Button>

                  {/* Log Level */}
                  <div className="flex gap-1">
                    {(['minimal', 'verbose', 'debug'] as const).map((level) => (
                      <Button
                        key={level}
                        size="sm"
                        variant={logLevel === level ? "secondary" : "ghost"}
                        className="flex-1 h-7 text-[10px] px-1"
                        onClick={() => setLogLevel(level)}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1, 3)}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <Button
        size="sm"
        variant={enabled ? "default" : "outline"}
        className={cn(
          "h-9 px-3 shadow-lg",
          enabled && "bg-primary text-primary-foreground"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TestTube2 className={cn("h-4 w-4", isExpanded && "mr-1")} />
        {isExpanded && (
          <>
            <span className="text-xs mr-1">Test</span>
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </>
        )}
      </Button>
    </div>
  );
});
