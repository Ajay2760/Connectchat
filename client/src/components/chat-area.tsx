import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePolling } from "@/hooks/use-polling";
import { Search, MoreVertical, Paperclip, Smile, Send, Users } from "lucide-react";
import type { User, ChatWithMembers, MessageWithSender } from "@shared/schema";

interface ChatAreaProps {
  currentUser: User;
  activeChat: ChatWithMembers;
}

export function ChatArea({ currentUser, activeChat }: ChatAreaProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/chats/" + activeChat.id + "/messages"],
    enabled: !!activeChat,
  });

  // Poll for new messages every 2.5 seconds
  usePolling(() => {
    queryClient.invalidateQueries({
      queryKey: ["/api/chats/" + activeChat.id + "/messages"]
    });
  }, 2500, !!activeChat);

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        chatId: activeChat.id,
        senderId: currentUser.id,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setMessageInput("");
      queryClient.invalidateQueries({
        queryKey: ["/api/chats/" + activeChat.id + "/messages"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/users/" + currentUser.id + "/chats"]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content) return;
    sendMessageMutation.mutate(content);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getChatName = () => {
    if (activeChat.type === "direct") {
      const otherMember = activeChat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.username || "Unknown User";
    }
    return activeChat.name || "Unnamed Group";
  };

  const getChatStatus = () => {
    if (activeChat.type === "direct") {
      const otherMember = activeChat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.isOnline ? "Online" : "Offline";
    }
    return `${activeChat.members.length} members`;
  };

  const getChatAvatar = () => {
    if (activeChat.type === "direct") {
      const otherMember = activeChat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.username.charAt(0).toUpperCase() || "?";
    }
    return <Users className="w-4 h-4" />;
  };

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageAvatar = (sender: User) => {
    return sender.username.charAt(0).toUpperCase();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
              {getChatAvatar()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{getChatName()}</h2>
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
              {activeChat.type === "direct" && (
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              )}
              {getChatStatus()}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUser.id;
            
            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 animate-slide-up ${
                  isOwn ? "justify-end" : ""
                }`}
              >
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-sm font-semibold">
                      {getMessageAvatar(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${isOwn ? "order-first" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? "bg-primary text-white rounded-tr-lg"
                        : "bg-white dark:bg-slate-800 rounded-tl-lg"
                    }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                  </div>
                  <p
                    className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                      isOwn ? "text-right mr-4" : "ml-4"
                    }`}
                  >
                    {formatMessageTime(new Date(message.sentAt))}
                  </p>
                </div>
                {isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-sm font-semibold">
                      {getMessageAvatar(currentUser)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <Paperclip className="w-4 h-4" />
          </Button>
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="rounded-full pr-12"
            />
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending || !messageInput.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
