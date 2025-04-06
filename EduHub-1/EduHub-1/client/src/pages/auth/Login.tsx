import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import logoSrc from "@/assets/logo.svg";

export default function Login() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [isHandlingDemo, setIsHandlingDemo] = useState(false);
  const { setUser, user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Redirect to dashboard if user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);
  
  const handleDemoMode = async () => {
    setIsHandlingDemo(true);
    
    try {
      // Default to student role for demo
      const response = await apiRequest("POST", "/api/auth/demo", {
        role: UserRole.STUDENT,
      });
      
      const user = await response.json();
      setUser(user);
      
      toast({
        title: "Demo mode activated",
        description: "You now have 10 minutes to explore EduHub.",
      });
      
      // Navigate to dashboard after successful demo activation
      navigate("/dashboard");
    } catch (error) {
      console.error("Demo mode error:", error);
      toast({
        title: "Failed to start demo mode",
        description: "Please try again or create an account.",
        variant: "destructive",
      });
    } finally {
      setIsHandlingDemo(false);
    }
  };
  
  return (
    <div className="login-bg min-h-screen flex flex-col justify-center items-center px-4 py-12 md:px-6 lg:px-8">
      {/* Logo and Header */}
      <div className="text-center mb-8 animate-pulse-slow">
        <div className="flex items-center justify-center mb-4">
          <img src={logoSrc} alt="EduHub Logo" className="h-16" />
        </div>
        <h2 className="text-lg md:text-xl text-gray-600 font-medium">Connect, Learn, Grow</h2>
      </div>
      
      {/* Login/Signup Form */}
      <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:shadow-2xl">
        <div className="px-6 py-8">
          {/* Tabs */}
          <div className="relative mb-8">
            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 font-medium ${
                  activeTab === "login" ? "text-primary-500" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Log In
              </button>
              <button
                className={`flex-1 py-3 font-medium ${
                  activeTab === "signup" ? "text-primary-500" : "text-gray-400"
                }`}
                onClick={() => setActiveTab("signup")}
              >
                Sign Up
              </button>
            </div>
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-primary-500 transform transition-transform duration-300"
              style={{
                width: "50%",
                transform: `translateX(${activeTab === "login" ? "0%" : "100%"})`,
              }}
            ></div>
          </div>
          
          {/* Login Form */}
          {activeTab === "login" ? (
            <LoginForm
              onSwitchToSignup={() => setActiveTab("signup")}
              onDemoMode={handleDemoMode}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setActiveTab("login")}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
