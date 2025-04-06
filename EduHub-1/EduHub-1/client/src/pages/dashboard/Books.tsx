import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { useMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CreatePostBox from "@/components/dashboard/CreatePostBox";
import { Card, CardContent } from "@/components/ui/card";
import { PostWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Books() {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const isMobile = useMobile();
  const { user } = useAuth();
  
  // Fetch book/worksheet posts
  const { data: bookPosts, isLoading } = useQuery<PostWithUser[]>({
    queryKey: ['/api/posts'],
    select: (posts) => posts.filter(post => post.postType === 'book_worksheet')
  });
  
  const renderBookPost = (post: PostWithUser) => {
    return (
      <Card key={post.id} className="mb-4 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-3">
              {post.user.profilePicture ? (
                <img 
                  src={post.user.profilePicture} 
                  alt={`${post.user.fullName}'s profile`} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-800">{post.user.fullName}</h3>
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {post.user.role} • {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>
                
                {post.mediaUrl && (
                  <div className="mt-3">
                    {post.mediaType === 'image' && (
                      <img 
                        src={post.mediaUrl} 
                        alt="Attached media" 
                        className="rounded-lg w-full max-h-96 object-cover"
                      />
                    )}
                    {post.mediaType === 'document' && (
                      <div className="flex items-center p-3 bg-gray-100 rounded-lg">
                        <i className="fas fa-file-alt text-primary-500 text-2xl mr-2"></i>
                        <div>
                          <div className="text-sm font-medium">Document</div>
                          <a 
                            href={post.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-primary-500 text-xs hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <div className="flex space-x-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 flex items-center"
                  >
                    <i className="fas fa-download mr-1.5"></i>
                    <span>Download</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500 flex items-center"
                  >
                    <i className="fas fa-share-alt mr-1.5"></i>
                    <span>Share</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>Books & Worksheets | EduHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Books & Worksheets" />
            
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <Button 
                onClick={() => setCreatePostOpen(true)}
                className="w-full mb-6 py-6 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 flex justify-center items-center rounded-lg shadow-sm transition-colors"
              >
                <i className="fas fa-plus mr-2 text-primary-500"></i>
                <span>Add New Book or Worksheet</span>
              </Button>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
                </div>
              ) : bookPosts && bookPosts.length > 0 ? (
                bookPosts.map(renderBookPost)
              ) : (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3 text-gray-300">
                    <i className="fas fa-book"></i>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-1">No books or worksheets yet</h3>
                  <p className="text-gray-500">
                    Be the first to share educational materials with your classmates!
                  </p>
                </div>
              )}
            </main>
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col h-screen">
          {/* Top Header */}
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <div className="text-xl font-bold text-gray-800">Books & Worksheets</div>
          </header>
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
              </div>
            ) : bookPosts && bookPosts.length > 0 ? (
              bookPosts.map(renderBookPost)
            ) : (
              <div className="text-center py-10">
                <div className="text-4xl mb-3 text-gray-300">
                  <i className="fas fa-book"></i>
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-1">No books or worksheets yet</h3>
                <p className="text-gray-500">
                  Be the first to share educational materials with your classmates!
                </p>
              </div>
            )}
          </main>
          
          {/* Bottom Navigation */}
          <MobileNavbar onCreatePost={() => setCreatePostOpen(true)} />
        </div>
      </div>
      
      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onOpenChange={setCreatePostOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4">
            <div className="text-xl font-semibold">Add Book or Worksheet</div>
            <CreatePostBox />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}