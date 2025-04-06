import { useState } from "react";
import { useLocation } from "wouter";
import { Bell, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [unreadMessages] = useState(3); // This would come from a query in a real app
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <Bell className="h-5 w-5" />
          </Button>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <Mail className="h-5 w-5" />
            </Button>
            {unreadMessages > 0 && (
              <Badge 
                className="absolute top-0 right-0 h-4 w-4 bg-[#F72585] text-white text-xs flex items-center justify-center rounded-full p-0"
              >
                {unreadMessages}
              </Badge>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="hidden sm:inline-flex"
          >
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
