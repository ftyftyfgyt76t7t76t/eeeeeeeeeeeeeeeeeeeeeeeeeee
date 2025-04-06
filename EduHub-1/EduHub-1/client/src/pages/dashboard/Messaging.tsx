import { useState } from "react";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import MobileNavbar from "@/components/layout/MobileNavbar";
import { useMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { formatDistance } from "date-fns";

interface Conversation {
  partnerId: number;
  partner: {
    id: number;
    fullName: string;
    profilePicture?: string;
    role: string;
  };
  unreadCount: number;
  lastMessage: {
    id: number;
    content: string;
    createdAt: string;
  };
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function Messaging() {
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const { user } = useAuth();
  const isMobile = useMobile();
  
  // Fetch conversations
  const { data: conversations, isLoading: isLoadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages"],
  });
  
  // Fetch selected conversation messages
  const { data: messages, isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });
  
  // Send message mutation
  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) return;
      
      return apiRequest("POST", `/api/messages/${selectedConversation}`, { content });
    },
    onSuccess: () => {
      // Clear input and refetch conversation
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversation] });
    },
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConversation) return;
    
    sendMessage(messageText);
  };
  
  // Render conversation list
  const renderConversationList = () => {
    if (isLoadingConversations) {
      return (
        <div className="space-y-4 p-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    if (!conversations || conversations.length === 0) {
      return (
        <div className="p-6 text-center">
          <div className="text-4xl mb-2">📬</div>
          <h3 className="font-medium text-lg">No messages yet</h3>
          <p className="text-sm text-gray-500 mt-1">
            Connect with students and teachers to start messaging
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-1">
        {conversations.map((conversation) => (
          <div 
            key={conversation.partnerId}
            onClick={() => setSelectedConversation(conversation.partnerId)}
            className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 rounded-lg ${
              selectedConversation === conversation.partnerId ? "bg-gray-50" : ""
            }`}
          >
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-3 flex-shrink-0">
              {conversation.partner.profilePicture ? (
                <img 
                  src={conversation.partner.profilePicture} 
                  alt={`${conversation.partner.fullName}'s profile`} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 truncate">
                  {conversation.partner.fullName}
                </h3>
                <span className="text-xs text-gray-500">
                  {formatDistance(new Date(conversation.lastMessage.createdAt), new Date(), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <p className="text-sm text-gray-600 truncate flex-1">
                  {conversation.lastMessage.content}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge className="ml-2 bg-primary-500">{conversation.unreadCount}</Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render message thread
  const renderMessageThread = () => {
    if (!selectedConversation) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <div className="text-5xl mb-3">💬</div>
            <h3 className="font-medium text-lg">Select a conversation</h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose a conversation from the list to start messaging
            </p>
          </div>
        </div>
      );
    }
    
    if (isLoadingMessages) {
      return (
        <div className="h-full flex flex-col p-4">
          <div className="space-y-4 flex-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <Skeleton className={`h-10 w-48 rounded-2xl ${i % 2 === 0 ? "rounded-tl-sm" : "rounded-tr-sm"}`} />
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    const selectedPartner = conversations?.find(c => c.partnerId === selectedConversation)?.partner;
    
    return (
      <div className="h-full flex flex-col">
        {/* Conversation Header */}
        <div className="p-3 border-b border-gray-200 flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden mr-3">
            {selectedPartner?.profilePicture ? (
              <img 
                src={selectedPartner.profilePicture} 
                alt={`${selectedPartner.fullName}'s profile`} 
                className="h-full w-full object-cover"
              />
            ) : (
              <i className="fas fa-user"></i>
            )}
          </div>
          <div>
            <h3 className="font-medium">{selectedPartner?.fullName}</h3>
            <p className="text-xs text-gray-500 capitalize">{selectedPartner?.role}</p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              
              return (
                <div 
                  key={message.id}
                  className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                >
                  <div 
                    className={`max-w-[70%] p-3 rounded-2xl ${
                      isOwnMessage 
                        ? "bg-primary-500 text-white rounded-tr-sm"
                        : "bg-gray-100 text-gray-800 rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs text-right block mt-1 opacity-70">
                      {formatDistance(new Date(message.createdAt), new Date(), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-200">
          <div className="flex items-center">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full"
            />
            <Button 
              type="submit"
              size="icon"
              className="ml-2 rounded-full"
              disabled={!messageText.trim() || isSending}
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
        </form>
      </div>
    );
  };
  
  return (
    <>
      <Helmet>
        <title>Messaging | EduHub</title>
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Layout */}
        <div className="hidden md:flex h-screen">
          <Sidebar />
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header title="Messaging" />
            
            {/* Main Content */}
            <main className="flex-1 overflow-hidden p-4 bg-gray-50">
              <div className="h-full flex rounded-lg overflow-hidden shadow-sm">
                {/* Conversations List */}
                <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                  <div className="p-3 border-b border-gray-200">
                    <Input placeholder="Search messages..." />
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {renderConversationList()}
                  </div>
                </div>
                
                {/* Message Thread */}
                <div className="w-2/3 bg-white flex flex-col">
                  {renderMessageThread()}
                </div>
              </div>
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
          <main className="flex-1 overflow-y-auto bg-white">
            {selectedConversation ? (
              renderMessageThread()
            ) : (
              <>
                <div className="p-3 border-b border-gray-200">
                  <Input placeholder="Search messages..." />
                </div>
                {renderConversationList()}
              </>
            )}
          </main>
          
          {/* Bottom Navigation */}
          <MobileNavbar onCreatePost={() => {}} />
        </div>
      </div>
    </>
  );
}
