import { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import CreatePostBox from "@/components/dashboard/CreatePostBox";
import PostsList from "@/components/dashboard/PostsList";
import { useMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import logoSrc from "@/assets/logo.svg";

export default function Home() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMobile = useMobile();
  
  return (
    <>
      <Helmet>
        <title>Home | EduHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Home" />
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {/* Search Bar */}
              <div className="bg-white rounded-lg shadow mb-6 p-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search posts, videos, or resources..." 
                      className="pl-10 w-full"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setCreatePostOpen(true)}
                  >
                    <i className="fas fa-plus text-sm"></i>
                    <span>Create Post</span>
                  </Button>
                </div>
              </div>
              <PostsList />
            </main>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-screen">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            {isSearchOpen ? (
              <div className="flex-1 flex items-center space-x-2">
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <Input 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
              </div>
            ) : (
              <>
                <div>
                  <img src={logoSrc} alt="EduHub Logo" className="h-8" />
                </div>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                  <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <i className="fas fa-bell"></i>
                  </button>
                  <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    <i className="fas fa-envelope"></i>
                  </button>
                </div>
              </>
            )}
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <PostsList />
          </main>
          
          {/* Bottom Navigation */}
          <MobileNavbar onCreatePost={() => setCreatePostOpen(true)} />
          
          {/* Mobile Create Post Dialog */}
          <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-4">
                <div className="text-xl font-semibold">Create Post</div>
                <CreatePostBox />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
