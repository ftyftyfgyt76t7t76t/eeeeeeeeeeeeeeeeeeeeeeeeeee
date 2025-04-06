import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface MobileNavbarProps {
  onCreatePost: () => void;
}

export default function MobileNavbar({ onCreatePost }: MobileNavbarProps) {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/dashboard", label: "Home", icon: "fas fa-home" },
    { path: "/videos", label: "Videos", icon: "fas fa-video" },
    { path: "/messaging", label: "Messages", icon: "fas fa-comments" },
    { path: "/books", label: "Books", icon: "fas fa-book" },
  ];
  
  return (
    <nav className="bg-white border-t border-gray-200 flex justify-around py-3 sticky bottom-0 z-10">
      {navItems.map((item, index) => (
        <Link 
          key={index}
          href={item.path}
          className={cn(
            "flex flex-col items-center",
            location === item.path ? "text-primary-500" : "text-gray-500"
          )}
        >
          <i className={cn(item.icon, "text-xl")}></i>
          <span className="text-xs mt-1">{item.label}</span>
        </Link>
      ))}
      {/* Create Post Button */}
      <div className="flex flex-col items-center">
        <button 
          onClick={onCreatePost}
          className="bg-primary-500 text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg transform -translate-y-2"
        >
          <i className="fas fa-plus text-xl"></i>
        </button>
      </div>
    </nav>
  );
}
