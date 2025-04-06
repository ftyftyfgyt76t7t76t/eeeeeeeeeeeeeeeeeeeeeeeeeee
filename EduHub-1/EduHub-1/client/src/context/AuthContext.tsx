import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { UserRoleType } from "@shared/schema";

interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRoleType;
  profilePicture?: string;
  isDemo?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemo: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const { data: apiUser, isFetching } = useQuery({
    queryKey: ["/api/auth/current-user"],
    enabled: !!auth.currentUser,
    onSuccess: (data) => {
      if (data) {
        setUser(data);
        setIsDemo(!!data.isDemo);
      } else {
        setUser(null);
        setIsDemo(false);
      }
    },
    onError: () => {
      setUser(null);
      setIsDemo(false);
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsLoading(false);
        setIsDemo(false);
        return;
      }
      
      try {
        const response = await apiRequest("GET", "/api/auth/current-user", undefined);
        const userData = await response.json();
        setUser(userData);
        setIsDemo(!!userData.isDemo);
      } catch (error) {
        setUser(null);
        setIsDemo(false);
      } finally {
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      await apiRequest("POST", "/api/auth/logout", undefined);
      setUser(null);
      setIsDemo(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  const value = {
    user,
    isLoading: isLoading || isFetching,
    isAuthenticated: !!user,
    isDemo,
    setUser,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
