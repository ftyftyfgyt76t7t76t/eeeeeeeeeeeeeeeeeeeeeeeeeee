import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PostWithUser } from "@shared/schema";
import { formatDistance } from "date-fns";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const { toast } = useToast();
  
  const handleLike = async () => {
    setIsLiking(true);
    
    try {
      await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      
      // Invalidate posts query to refresh like status
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch (error) {
      console.error("Failed to like post:", error);
      toast({
        title: "Error",
        description: "Failed to like post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };
  
  const handleComment = async () => {
    if (!comment.trim()) return;
    
    setIsCommenting(true);
    
    try {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, {
        content: comment,
      });
      
      setComment("");
      // Invalidate post query to refresh comments
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };
  
  const handleShare = () => {
    // In a real app, this would show sharing options
    toast({
      title: "Share feature",
      description: "Sharing functionality would be implemented here.",
    });
  };
  
  // Format the post date
  const formattedDate = formatDistance(
    new Date(post.createdAt),
    new Date(),
    { addSuffix: true }
  );
  
  return (
    <Card className="bg-white rounded-lg shadow-sm p-4 mb-4">
      {/* Post Header */}
      <CardContent className="p-0">
        <div className="flex items-start space-x-4">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{post.user.fullName}</h3>
                <p className="text-xs text-gray-500">
                  {formattedDate} · {post.user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-ellipsis-h"></i>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Post Content */}
        <div className="mt-3">
          <p className="text-gray-800 whitespace-pre-line">{post.content}</p>
        </div>
        
        {/* Post Media (if any) */}
        {post.mediaUrl && (
          <div className="mt-3 rounded-lg overflow-hidden">
            {post.mediaType === "image" ? (
              <img 
                src={post.mediaUrl} 
                alt="Post image" 
                className="w-full object-cover"
              />
            ) : post.mediaType === "video" ? (
              <div className="w-full aspect-w-16 aspect-h-9 flex items-center justify-center p-4 bg-gray-100">
                <div className="text-center">
                  <i className="fas fa-play-circle text-4xl text-primary-500 mb-2"></i>
                  <p className="text-sm text-gray-600">Click to play video</p>
                </div>
              </div>
            ) : (
              <div className="w-full p-4 bg-gray-100 rounded-lg flex items-center">
                <i className="fas fa-file-alt text-2xl text-primary-500 mr-3"></i>
                <div>
                  <p className="font-medium">Document</p>
                  <p className="text-sm text-gray-600">Click to view</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Post Stats */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex space-x-4">
            <span>
              <i className={`${post.liked ? 'fas' : 'far'} fa-thumbs-up text-primary-500`}></i> {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
            </span>
            <span>{post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}</span>
          </div>
          <span>{post.sharesCount} {post.sharesCount === 1 ? 'share' : 'shares'}</span>
        </div>
        
        {/* Post Actions */}
        <div className="mt-3 flex border-t border-gray-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleLike}
            disabled={isLiking}
            className={`flex-1 flex items-center justify-center py-2 rounded-lg ${
              post.liked ? 'text-primary-500' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <i className={`${post.liked ? 'fas' : 'far'} fa-thumbs-up mr-2`}></i>
            <span>Like</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsCommenting(!isCommenting)}
            className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <i className="far fa-comment-alt mr-2"></i>
            <span>Comment</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleShare}
            className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <i className="fas fa-share mr-2"></i>
            <span>Share</span>
          </Button>
        </div>
        
        {/* Comment Form (if commenting) */}
        {isCommenting && (
          <div className="mt-3 flex items-start space-x-2">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden flex-shrink-0">
              <i className="fas fa-user"></i>
            </div>
            <div className="flex-1 rounded-2xl bg-gray-100 p-2 flex">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-transparent border-none outline-none text-sm px-2"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleComment}
                disabled={!comment.trim() || isCommenting}
                className="text-primary-500"
              >
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
