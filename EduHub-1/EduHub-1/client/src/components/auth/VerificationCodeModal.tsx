import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import VerificationCodeInput from "./VerificationCodeInput";
import { sendMfaVerificationCode, completeMfaLogin, completePhoneVerification } from "@/lib/auth";

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  verificationId?: string;
  phoneNumber: string;
  mode: "login" | "register";
}

export default function VerificationCodeModal({
  isOpen,
  onClose,
  onSuccess,
  verificationId,
  phoneNumber,
  mode
}: VerificationCodeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localVerificationId, setLocalVerificationId] = useState<string | undefined>(verificationId);
  
  // Handle verification code submission
  const handleVerificationComplete = async (code: string) => {
    if (!localVerificationId) {
      setError("Verification ID not found. Please try again.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (mode === "login") {
        // Handle login MFA verification
        const result = await completeMfaLogin(localVerificationId, code);
        
        if (result.success) {
          onSuccess();
        } else {
          setError("Failed to verify code. Please try again.");
        }
      } else {
        // Handle registration MFA enrollment
        await completePhoneVerification(localVerificationId, code);
        onSuccess();
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("The verification code is invalid. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle resending verification code
  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset the verification ID
      const newVerificationId = await sendMfaVerificationCode("recaptcha-container");
      setLocalVerificationId(newVerificationId);
    } catch (error) {
      console.error("Error resending code:", error);
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verification Required</DialogTitle>
          <DialogDescription>
            Please enter the 6-digit verification code sent to your phone ({phoneNumber}).
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4 space-y-6">
          <VerificationCodeInput
            onComplete={handleVerificationComplete}
            isLoading={isLoading}
          />
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <div id="recaptcha-container"></div>
          
          <Button
            variant="ghost"
            className="text-sm"
            disabled={isLoading}
            onClick={handleResendCode}
          >
            Didn't receive a code? Resend
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}