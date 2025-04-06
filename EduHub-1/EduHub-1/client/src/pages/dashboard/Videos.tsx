import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Resource } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

interface ResourceWithUser extends Resource {
  user: {
    fullName: string;
    role: string;
  };
}

export default function Videos() {
  const isMobile = useMobile();
  
  const { data: videos, isLoading, error } = useQuery<ResourceWithUser[]>({
    queryKey: ["/api/resources?type=video"],
  });
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-200">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load videos. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!videos || videos.length === 0) {
      return (
        <Alert>
          <AlertTitle>No videos yet</AlertTitle>
          <AlertDescription>
            There are no educational videos available yet. Check back later!
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <Card key={video.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-video bg-gray-100 flex items-center justify-center cursor-pointer">
                <div className="text-center">
                  <i className="fas fa-play-circle text-5xl text-primary-500 mb-2"></i>
                  <p className="text-sm text-gray-600">Click to play</p>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg mb-1">{video.title}</h3>
                <p className="text-sm text-gray-500">
                  By {video.user.fullName} • {video.user.role}
                </p>
                {video.description && (
                  <p className="mt-2 text-sm text-gray-700">{video.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Videos | EduHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Educational Videos" />
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 mb-2">Educational Videos</h1>
                <p className="text-gray-600">
                  Browse educational videos shared by teachers and students
                </p>
              </div>
              
              {renderContent()}
            </main>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-screen">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="text-xl font-bold font-['Poppins'] bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-primary-900">
              EduHub
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            <div className="mb-4">
              <h1 className="text-xl font-semibold text-gray-800 mb-1">Educational Videos</h1>
              <p className="text-sm text-gray-600">
                Browse videos shared by teachers and students
              </p>
            </div>
            
            {renderContent()}
          </main>
          
          {/* Bottom Navigation */}
          <MobileNavbar onCreatePost={() => {}} />
        </div>
      </div>
    </>
  );
}
