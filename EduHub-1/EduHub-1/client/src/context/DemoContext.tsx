import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

// Default demo mode time in seconds (10 minutes)
const DEFAULT_DEMO_TIME = 10 * 60;
// Warning threshold in seconds (1 minute)
const WARNING_THRESHOLD = 60;

interface DemoContextType {
  demoTimeLeft: number;
  isDemoExpiring: boolean;
}

const DemoContext = createContext<DemoContextType>({
  demoTimeLeft: DEFAULT_DEMO_TIME,
  isDemoExpiring: false
});

export function DemoProvider({ children }: { children: ReactNode }) {
  const { isDemo } = useAuth();
  const [demoTimeLeft, setDemoTimeLeft] = useState(DEFAULT_DEMO_TIME);
  const [isDemoExpiring, setIsDemoExpiring] = useState(false);
  
  // Set up timer for demo mode
  useEffect(() => {
    if (!isDemo) {
      return;
    }
    
    // Initialize or reset the timer when demo mode is activated
    setDemoTimeLeft(DEFAULT_DEMO_TIME);
    setIsDemoExpiring(false);
    
    // Set up interval to decrement timer
    const interval = setInterval(() => {
      setDemoTimeLeft(prevTime => {
        // Check if time is running low
        if (prevTime <= WARNING_THRESHOLD && !isDemoExpiring) {
          setIsDemoExpiring(true);
        }
        
        // Prevent going below zero
        return Math.max(0, prevTime - 1);
      });
    }, 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, [isDemo, isDemoExpiring]);
  
  return (
    <DemoContext.Provider value={{ demoTimeLeft, isDemoExpiring }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  return useContext(DemoContext);
}