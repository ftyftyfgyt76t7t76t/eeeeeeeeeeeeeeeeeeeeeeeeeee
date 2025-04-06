import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import logoSrc from "@/assets/logo.svg";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, isDemo } = useAuth();
  
  const baseNavItems = [
    { path: "/dashboard", label: "Home", icon: "fas fa-home" },
    { path: "/videos", label: "Videos", icon: "fas fa-video" },
    { path: "/messaging", label: "Messaging", icon: "fas fa-comments" },
    { path: "/books", label: "Books & Worksheets", icon: "fas fa-book" },
  ];
  
  // Add profile settings only for non-demo users
  const navItems = isDemo 
    ? baseNavItems 
    : [...baseNavItems, { path: "/profile", label: "Profile Settings", icon: "fas fa-user-cog" }];
  
  return (
    <div className={cn("w-64 bg-white border-r border-gray-200 flex flex-col h-screen", className)}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center">
          <img src={logoSrc} alt="EduHub Logo" className="h-8" />
        </Link>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            href={item.path}
            className={cn(
              "flex items-center px-4 py-3 rounded-lg font-medium transition-colors",
              location === item.path
                ? "text-primary-500 bg-primary-50"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <i className={cn(item.icon, "mr-3")}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={`${user.fullName}'s profile`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.fullName || "User"}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || "Guest"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
