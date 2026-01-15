import { memo } from "react";
import { useAITestOptional, BookingStep } from "@/contexts/AITestContext";
import { cn } from "@/lib/utils";
import { Check, Circle, AlertCircle, Clock, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AITestChecklistProps {
  language?: string;
  compact?: boolean;
}

const StepIcon = memo(({ step, isCurrent }: { step: BookingStep; isCurrent: boolean }) => {
  if (step.error) {
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  }
  if (step.completed) {
    return <Check className="h-3.5 w-3.5 text-green-500" />;
  }
  if (isCurrent) {
    return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />;
});

StepIcon.displayName = 'StepIcon';

export const AITestChecklist = memo(function AITestChecklist({ 
  language = 'EN',
  compact = false 
}: AITestChecklistProps) {
  const testContext = useAITestOptional();
  
  if (!testContext || !testContext.smokeTestConfig.enabled || !testContext.smokeTestConfig.showUIFlags) {
    return null;
  }

  const { checklist, getTestReport } = testContext;
  const { steps, currentStep, startTime, isComplete } = checklist;
  
  const completedCount = steps.filter(s => s.completed).length;
  const requiredCount = steps.filter(s => s.required).length;
  const progress = (completedCount / steps.length) * 100;
  
  const elapsedTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="fixed top-2 right-2 z-[9999] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {isComplete ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            )}
            <span className="font-medium">{completedCount}/{steps.length}</span>
          </div>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-muted-foreground">{formatTime(elapsedTime)}</span>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed top-16 right-2 z-[9999] bg-background/95 backdrop-blur-sm border rounded-xl shadow-xl p-3 w-64 text-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isComplete ? "bg-green-500" : "bg-yellow-500 animate-pulse"
            )} />
            <span className="font-semibold text-sm">AI Test Mode</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(elapsedTime)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>{completedCount} of {steps.length} steps</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className={cn(
                "h-full rounded-full",
                isComplete ? "bg-green-500" : "bg-primary"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {steps.map((step) => {
            const isCurrent = step.id === currentStep;
            const isTR = language === 'TR';
            
            return (
              <motion.div
                key={step.id}
                className={cn(
                  "flex items-center gap-2 p-1.5 rounded-md transition-colors",
                  isCurrent && "bg-primary/10",
                  step.completed && "bg-green-500/10",
                  step.error && "bg-destructive/10"
                )}
                layout
              >
                <StepIcon step={step} isCurrent={isCurrent} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium truncate",
                    step.completed && "text-green-600",
                    step.error && "text-destructive"
                  )}>
                    {isTR ? step.name : step.nameEn}
                    {!step.required && (
                      <span className="text-muted-foreground ml-1">(optional)</span>
                    )}
                  </div>
                  {step.value && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {String(step.value)}
                    </div>
                  )}
                  {step.error && (
                    <div className="text-[10px] text-destructive truncate">
                      {step.error}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Status footer */}
        <div className="mt-2 pt-2 border-t">
          {isComplete ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <Check className="h-3.5 w-3.5" />
              <span className="font-medium">Test Complete!</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Testing in progress...</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
});
