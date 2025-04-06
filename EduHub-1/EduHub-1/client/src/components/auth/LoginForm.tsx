import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { loginUser, sendMfaVerificationCode } from "@/lib/auth";
import VerificationCodeModal from "./VerificationCodeModal";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onDemoMode: () => void;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginForm({ onSwitchToSignup, onDemoMode }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationId, setVerificationId] = useState<string | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // Attempt to log in with Firebase (may require MFA)
      const loginResult = await loginUser(data.email, data.password);
      
      if (loginResult.success) {
        // Standard login successful
        setUser(loginResult.user);
        
        if (data.rememberMe) {
          // Set a longer session expiry in a real app
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }
        
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        
        // Navigate to dashboard
        navigate("/dashboard");
      } else if (loginResult.mfaRequired) {
        // MFA is required, get the verification code
        // Create invisible recaptcha container if needed
        if (!document.getElementById('recaptcha-mfa-container')) {
          const recaptchaDiv = document.createElement('div');
          recaptchaDiv.id = 'recaptcha-mfa-container';
          document.body.appendChild(recaptchaDiv);
        }
        
        try {
          // Use the first hint if available
          const hint = loginResult.hints && loginResult.hints.length > 0 
            ? loginResult.hints[0] 
            : undefined;
            
          // Show verification modal
          setPhoneNumber(hint?.phoneNumber || 'your phone');
          
          // Request verification code
          const verId = await sendMfaVerificationCode('recaptcha-mfa-container', hint?.uid);
          setVerificationId(verId);
          setShowVerification(true);
        } catch (mfaError) {
          console.error("Error setting up MFA:", mfaError);
          toast({
            title: "Authentication error",
            description: "Failed to send verification code. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!recoveryEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsRecovering(true);
    
    // In a real app, we would send a password reset email
    // For this demo, we'll just show a success message
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Recovery email sent",
        description: "Check your email for password reset instructions",
      });
      
      setForgotPasswordOpen(false);
      setRecoveryEmail("");
    } catch (error) {
      toast({
        title: "Failed to send recovery email",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsRecovering(false);
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="w-full px-4 py-3 rounded-lg"
            {...register("password", {
              required: "Password is required",
            })}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Checkbox
              id="remember-me"
              {...register("rememberMe")}
            />
            <Label htmlFor="remember-me" className="ml-2 text-sm text-gray-700">
              Remember me
            </Label>
          </div>
          <div>
            <Button 
              type="button" 
              variant="link" 
              className="text-sm font-medium text-blue-600 hover:text-blue-800 p-0"
              onClick={() => setForgotPasswordOpen(true)}
            >
              Forgot password?
            </Button>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <span className="mx-auto">Continue</span>
        </Button>
        
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={onDemoMode}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Try 10-minute demo mode
          </Button>
        </div>
      </form>
      
      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <Input
              type="email"
              placeholder="Enter your email"
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setForgotPasswordOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleForgotPassword} 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={isRecovering}
            >
              {isRecovering ? "Sending..." : "Send reset link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Two-factor verification modal */}
      {showVerification && (
        <VerificationCodeModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onSuccess={() => {
            setShowVerification(false);
            toast({
              title: "Login successful",
              description: "You have been verified and logged in.",
            });
            navigate("/dashboard");
          }}
          verificationId={verificationId}
          phoneNumber={phoneNumber}
          mode="login"
        />
      )}
      
      {/* Hidden recaptcha container */}
      <div id="recaptcha-mfa-container" style={{ display: 'none' }}></div>
    </>
  );
}
