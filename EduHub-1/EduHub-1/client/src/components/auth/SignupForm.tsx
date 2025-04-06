import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { registerUser, initiatePhoneVerification } from "@/lib/auth";
import VerificationCodeModal from "./VerificationCodeModal";

interface SignupFormProps {
  onSwitchToLogin: () => void;
}

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(5, "Phone number is required"),
  role: z.enum(["student", "teacher", "school"]),
  schoolName: z.string().optional(),
  age: z.string().optional(),
  grade: z.string().optional(),
  address: z.string().optional(),
  teachingGrades: z.string().optional(),
  ceoName: z.string().optional(),
  rememberMe: z.boolean(),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationId, setVerificationId] = useState<string | undefined>(undefined);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userData, setUserData] = useState<any>(null);
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
      role: "student",
      rememberMe: false,
    },
  });
  
  const role = watch("role");
  
  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    
    try {
      // Store form data for later use
      setUserData(data);
      
      // First register the user in Firebase
      await registerUser(data.email, data.password, {
        ...data
      });
      
      // Format phone number to E.164 format if needed (e.g. +1234567890)
      let formattedPhone = data.phone;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone.replace(/\D/g, '')}`;
      }
      setPhoneNumber(formattedPhone);
      
      // Create invisible recaptcha container if needed
      if (!document.getElementById('recaptcha-container')) {
        const recaptchaDiv = document.createElement('div');
        recaptchaDiv.id = 'recaptcha-container';
        document.body.appendChild(recaptchaDiv);
      }
      
      // Initiate phone verification
      const verId = await initiatePhoneVerification(formattedPhone, 'recaptcha-container');
      setVerificationId(verId);
      setShowVerification(true);
      
      // Remember me preference handled after successful verification
      if (data.rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: "There was a problem creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle verification success
  const handleVerificationSuccess = async () => {
    try {
      // Complete registration process now that 2FA is set up
      const response = await apiRequest("POST", "/api/auth/register", userData);
      const user = await response.json();
      
      // Set the user in context
      setUser(user);
      
      // Show success toast
      toast({
        title: "Account created!",
        description: "Your account has been secured with two-factor authentication.",
      });
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error finishing registration:", error);
      toast({
        title: "Registration error",
        description: "There was an issue finalizing your account. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">I am a:</Label>
          <RadioGroup className="grid grid-cols-3 gap-2" defaultValue="student" {...register("role")}>
            {/* Student Option */}
            <div className="relative">
              <RadioGroupItem value="student" id="role-student" className="peer sr-only" />
              <Label
                htmlFor="role-student"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex flex-col items-center">
                  <i className="fas fa-user-graduate text-xl mb-2 text-primary-500"></i>
                  <span className="text-sm font-medium">Student</span>
                </div>
              </Label>
            </div>
            
            {/* Teacher Option */}
            <div className="relative">
              <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
              <Label
                htmlFor="role-teacher"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex flex-col items-center">
                  <i className="fas fa-chalkboard-teacher text-xl mb-2 text-primary-900"></i>
                  <span className="text-sm font-medium">Teacher</span>
                </div>
              </Label>
            </div>
            
            {/* School Option */}
            <div className="relative">
              <RadioGroupItem value="school" id="role-school" className="peer sr-only" />
              <Label
                htmlFor="role-school"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div className="flex flex-col items-center">
                  <i className="fas fa-school text-xl mb-2 text-accent-500"></i>
                  <span className="text-sm font-medium">School</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        {/* Common Fields */}
        <div>
          <Label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </Label>
          <Input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-3 rounded-lg"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            className="w-full px-4 py-3 rounded-lg"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </Label>
          <Input
            id="full-name"
            type="text"
            placeholder="Enter your full name"
            className="w-full px-4 py-3 rounded-lg"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Enter phone number"
            className="w-full px-4 py-3 rounded-lg"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
        
        {/* Role Specific Fields */}
        {/* Student Fields */}
        {role === "student" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="student-school" className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </Label>
              <Input
                id="student-school"
                type="text"
                placeholder="Enter your school name"
                className="w-full px-4 py-3 rounded-lg"
                {...register("schoolName")}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student-age" className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </Label>
                <Input
                  id="student-age"
                  type="number"
                  placeholder="Your age"
                  className="w-full px-4 py-3 rounded-lg"
                  {...register("age")}
                />
              </div>
              
              <div>
                <Label htmlFor="student-grade" className="block text-sm font-medium text-gray-700 mb-1">
                  Grade
                </Label>
                <Input
                  id="student-grade"
                  type="text"
                  placeholder="Your grade"
                  className="w-full px-4 py-3 rounded-lg"
                  {...register("grade")}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="student-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </Label>
              <Input
                id="student-address"
                type="text"
                placeholder="Enter your address"
                className="w-full px-4 py-3 rounded-lg"
                {...register("address")}
              />
            </div>
          </div>
        )}
        
        {/* Teacher Fields */}
        {role === "teacher" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="teacher-school" className="block text-sm font-medium text-gray-700 mb-1">
                School Name
              </Label>
              <Input
                id="teacher-school"
                type="text"
                placeholder="School where you teach"
                className="w-full px-4 py-3 rounded-lg"
                {...register("schoolName")}
              />
            </div>
            
            <div>
              <Label htmlFor="teacher-grades" className="block text-sm font-medium text-gray-700 mb-1">
                Grades You Teach
              </Label>
              <Input
                id="teacher-grades"
                type="text"
                placeholder="e.g., 9th, 10th, 11th"
                className="w-full px-4 py-3 rounded-lg"
                {...register("teachingGrades")}
              />
            </div>
            
            <div>
              <Label htmlFor="teacher-address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </Label>
              <Input
                id="teacher-address"
                type="text"
                placeholder="Enter your address"
                className="w-full px-4 py-3 rounded-lg"
                {...register("address")}
              />
            </div>
          </div>
        )}
        
        {/* School Fields */}
        {role === "school" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="school-ceo" className="block text-sm font-medium text-gray-700 mb-1">
                CEO/Principal Name
              </Label>
              <Input
                id="school-ceo"
                type="text"
                placeholder="Enter CEO/Principal name"
                className="w-full px-4 py-3 rounded-lg"
                {...register("ceoName")}
              />
            </div>
            
            <div>
              <Label htmlFor="school-location" className="block text-sm font-medium text-gray-700 mb-1">
                School Location
              </Label>
              <Input
                id="school-location"
                type="text"
                placeholder="School address"
                className="w-full px-4 py-3 rounded-lg"
                {...register("address")}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center mt-4">
          <Checkbox
            id="signup-remember-me"
            {...register("rememberMe")}
          />
          <Label htmlFor="signup-remember-me" className="ml-2 text-sm text-gray-700">
            Remember me
          </Label>
        </div>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-0.5"
        >
          <span className="mx-auto">{isLoading ? "Creating Account..." : "Continue"}</span>
        </Button>
        
        {/* Hidden recaptcha container */}
        <div id="recaptcha-container" style={{ display: 'none' }}></div>
      </form>
      
      {/* Verification Modal */}
      {showVerification && (
        <VerificationCodeModal
          isOpen={showVerification}
          onClose={() => setShowVerification(false)}
          onSuccess={handleVerificationSuccess}
          verificationId={verificationId}
          phoneNumber={phoneNumber}
          mode="register"
        />
      )}
    </>
  );
}
