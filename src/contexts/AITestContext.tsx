import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

export interface BookingStep {
  id: string;
  name: string;
  nameEn: string;
  required: boolean;
  completed: boolean;
  value: string | number | null;
  timestamp: number | null;
  error: string | null;
}

export interface TestChecklistState {
  steps: BookingStep[];
  currentStep: string | null;
  isComplete: boolean;
  startTime: number | null;
  endTime: number | null;
}

export interface SmokeTestConfig {
  enabled: boolean;
  autoMode: boolean;
  logLevel: 'minimal' | 'verbose' | 'debug';
  showUIFlags: boolean;
  testScenario: 'standard' | 'return-trip' | 'hourly' | null;
}

interface AITestContextType {
  // Checklist state
  checklist: TestChecklistState;
  
  // Smoke test config
  smokeTestConfig: SmokeTestConfig;
  
  // Actions
  initChecklist: () => void;
  updateStep: (stepId: string, value: string | number | null, completed?: boolean, error?: string | null) => void;
  setCurrentStep: (stepId: string) => void;
  resetChecklist: () => void;
  
  // Smoke test controls
  enableSmokeTest: (scenario?: 'standard' | 'return-trip' | 'hourly') => void;
  disableSmokeTest: () => void;
  setLogLevel: (level: 'minimal' | 'verbose' | 'debug') => void;
  toggleUIFlags: (show: boolean) => void;
  
  // Logging
  log: (message: string, data?: any, level?: 'info' | 'warn' | 'error' | 'debug') => void;
  getTestReport: () => TestReport;
}

export interface TestReport {
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  completedSteps: BookingStep[];
  pendingSteps: BookingStep[];
  errors: { step: string; error: string }[];
  isSuccess: boolean;
}

const defaultSteps: BookingStep[] = [
  { id: 'pickup', name: 'Alış Noktası', nameEn: 'Pickup Location', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'dropoff', name: 'Varış Noktası', nameEn: 'Dropoff Location', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'date', name: 'Tarih', nameEn: 'Date', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'time', name: 'Saat', nameEn: 'Time', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'passengers', name: 'Yolcu Sayısı', nameEn: 'Passenger Count', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'vehicle', name: 'Araç Tipi', nameEn: 'Vehicle Type', required: true, completed: false, value: null, timestamp: null, error: null },
  { id: 'payment', name: 'Ödeme Yöntemi', nameEn: 'Payment Method', required: false, completed: false, value: null, timestamp: null, error: null },
  { id: 'returnTrip', name: 'Dönüş Transferi', nameEn: 'Return Trip', required: false, completed: false, value: null, timestamp: null, error: null },
  { id: 'confirmation', name: 'Onay', nameEn: 'Confirmation', required: true, completed: false, value: null, timestamp: null, error: null },
];

const AITestContext = createContext<AITestContextType | null>(null);

export function AITestProvider({ children }: { children: ReactNode }) {
  const [checklist, setChecklist] = useState<TestChecklistState>({
    steps: [...defaultSteps],
    currentStep: null,
    isComplete: false,
    startTime: null,
    endTime: null,
  });

  const [smokeTestConfig, setSmokeTestConfig] = useState<SmokeTestConfig>({
    enabled: false,
    autoMode: false,
    logLevel: 'verbose',
    showUIFlags: true,
    testScenario: null,
  });

  const logHistory = useRef<{ timestamp: number; level: string; message: string; data?: any }[]>([]);

  const log = useCallback((message: string, data?: any, level: 'info' | 'warn' | 'error' | 'debug' = 'info') => {
    if (!smokeTestConfig.enabled) return;
    
    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };
    
    logHistory.current.push(logEntry);
    
    const prefix = `[AI-TEST ${level.toUpperCase()}]`;
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    
    if (smokeTestConfig.logLevel === 'minimal' && level !== 'error') return;
    if (smokeTestConfig.logLevel === 'verbose' && level === 'debug') return;
    
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    
    if (data) {
      consoleMethod(`${prefix} [${timestamp}] ${message}`, data);
    } else {
      consoleMethod(`${prefix} [${timestamp}] ${message}`);
    }
  }, [smokeTestConfig.enabled, smokeTestConfig.logLevel]);

  const initChecklist = useCallback(() => {
    const now = Date.now();
    setChecklist({
      steps: defaultSteps.map(s => ({ ...s, completed: false, value: null, timestamp: null, error: null })),
      currentStep: 'pickup',
      isComplete: false,
      startTime: now,
      endTime: null,
    });
    log('Checklist initialized', { startTime: new Date(now).toISOString() });
  }, [log]);

  const updateStep = useCallback((
    stepId: string, 
    value: string | number | null, 
    completed: boolean = true, 
    error: string | null = null
  ) => {
    setChecklist(prev => {
      const newSteps = prev.steps.map(step => {
        if (step.id === stepId) {
          return {
            ...step,
            value,
            completed: error ? false : completed,
            timestamp: Date.now(),
            error,
          };
        }
        return step;
      });

      const requiredSteps = newSteps.filter(s => s.required);
      const allRequiredComplete = requiredSteps.every(s => s.completed);
      const isComplete = allRequiredComplete && newSteps.find(s => s.id === 'confirmation')?.completed;

      log(
        `Step updated: ${stepId}`,
        { value, completed, error, allRequiredComplete },
        error ? 'error' : 'info'
      );

      return {
        ...prev,
        steps: newSteps,
        isComplete: isComplete || false,
        endTime: isComplete ? Date.now() : prev.endTime,
      };
    });
  }, [log]);

  const setCurrentStep = useCallback((stepId: string) => {
    setChecklist(prev => ({ ...prev, currentStep: stepId }));
    log(`Current step: ${stepId}`, undefined, 'debug');
  }, [log]);

  const resetChecklist = useCallback(() => {
    setChecklist({
      steps: [...defaultSteps],
      currentStep: null,
      isComplete: false,
      startTime: null,
      endTime: null,
    });
    logHistory.current = [];
    log('Checklist reset');
  }, [log]);

  const enableSmokeTest = useCallback((scenario: 'standard' | 'return-trip' | 'hourly' = 'standard') => {
    setSmokeTestConfig(prev => ({
      ...prev,
      enabled: true,
      testScenario: scenario,
    }));
    initChecklist();
    console.log(`[AI-TEST] 🚀 Smoke test ENABLED - Scenario: ${scenario}`);
    console.log('[AI-TEST] 📋 Test steps:', defaultSteps.map(s => s.nameEn).join(' → '));
  }, [initChecklist]);

  const disableSmokeTest = useCallback(() => {
    setSmokeTestConfig(prev => ({
      ...prev,
      enabled: false,
      testScenario: null,
    }));
    console.log('[AI-TEST] 🛑 Smoke test DISABLED');
  }, []);

  const setLogLevel = useCallback((level: 'minimal' | 'verbose' | 'debug') => {
    setSmokeTestConfig(prev => ({ ...prev, logLevel: level }));
  }, []);

  const toggleUIFlags = useCallback((show: boolean) => {
    setSmokeTestConfig(prev => ({ ...prev, showUIFlags: show }));
  }, []);

  const getTestReport = useCallback((): TestReport => {
    const completedSteps = checklist.steps.filter(s => s.completed);
    const pendingSteps = checklist.steps.filter(s => !s.completed && s.required);
    const errors = checklist.steps
      .filter(s => s.error)
      .map(s => ({ step: s.nameEn, error: s.error! }));

    const duration = checklist.startTime && checklist.endTime
      ? checklist.endTime - checklist.startTime
      : checklist.startTime
        ? Date.now() - checklist.startTime
        : 0;

    const report: TestReport = {
      duration,
      stepsCompleted: completedSteps.length,
      totalSteps: checklist.steps.length,
      completedSteps,
      pendingSteps,
      errors,
      isSuccess: checklist.isComplete && errors.length === 0,
    };

    console.log('[AI-TEST] 📊 Test Report:', report);
    return report;
  }, [checklist]);

  return (
    <AITestContext.Provider value={{
      checklist,
      smokeTestConfig,
      initChecklist,
      updateStep,
      setCurrentStep,
      resetChecklist,
      enableSmokeTest,
      disableSmokeTest,
      setLogLevel,
      toggleUIFlags,
      log,
      getTestReport,
    }}>
      {children}
    </AITestContext.Provider>
  );
}

export function useAITest() {
  const context = useContext(AITestContext);
  if (!context) {
    throw new Error('useAITest must be used within an AITestProvider');
  }
  return context;
}

// Optional hook that doesn't throw if context is not available
export function useAITestOptional() {
  return useContext(AITestContext);
}
