import { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  isLoading?: boolean;
  className?: string;
}

export default function VerificationCodeInput({
  length = 6,
  onComplete,
  isLoading = false,
  className
}: VerificationCodeInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  
  useEffect(() => {
    // Focus on first input when component mounts
    if (inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, []);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    
    if (value === "") {
      // Handle backspace case
      const newCode = [...code];
      newCode[index] = "";
      setCode(newCode);
      return;
    }
    
    // Only accept single numeric values
    if (/^\d$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      // Move to next input if available
      if (index < length - 1 && inputs.current[index + 1]) {
        inputs.current[index + 1]?.focus();
      } else {
        // Check if all inputs are filled
        if (newCode.every(val => val !== "")) {
          onComplete(newCode.join(""));
        }
      }
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0 && inputs.current[index - 1]) {
        inputs.current[index - 1]?.focus();
      }
    }
    
    // Handle left arrow
    if (e.key === "ArrowLeft" && index > 0 && inputs.current[index - 1]) {
      inputs.current[index - 1]?.focus();
    }
    
    // Handle right arrow
    if (e.key === "ArrowRight" && index < length - 1 && inputs.current[index + 1]) {
      inputs.current[index + 1]?.focus();
    }
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    
    // Only proceed if pasted content matches expected length and is all digits
    if (pastedData.length === length && /^\d+$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      
      // Focus last input
      if (inputs.current[length - 1]) {
        inputs.current[length - 1]?.focus();
      }
      
      onComplete(pastedData);
    }
  };
  
  return (
    <div className={cn("flex justify-center gap-2", className)}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={el => inputs.current[index] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[index]}
          onChange={e => handleChange(e, index)}
          onKeyDown={e => handleKeyDown(e, index)}
          onPaste={handlePaste}
          disabled={isLoading}
          className={cn(
            "w-12 h-14 text-center text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none",
            isLoading && "opacity-50 cursor-not-allowed",
            code[index] !== "" && "bg-blue-50 border-blue-300"
          )}
        />
      ))}
    </div>
  );
}