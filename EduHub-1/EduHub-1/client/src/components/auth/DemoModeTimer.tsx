import { useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDemo } from "@/context/DemoContext";

export default function DemoModeTimer() {
  const { demoTimeLeft, isDemoExpiring } = useDemo();
  const [, setLocation] = useLocation();
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // Redirect when timer reaches zero
  useEffect(() => {
    if (demoTimeLeft <= 0) {
      setLocation("/auth/signup");
    }
  }, [demoTimeLeft, setLocation]);
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "transition-all duration-300 cursor-default",
        isDemoExpiring && "bg-red-100 border-red-300 text-red-700 animate-pulse"
      )}
    >
      <span className="mr-1">Demo Mode:</span>
      <span className={cn(
        "font-mono font-bold",
        isDemoExpiring && "text-red-600"
      )}>
        {formatTime(demoTimeLeft)}
      </span>
    </Badge>
  );
}