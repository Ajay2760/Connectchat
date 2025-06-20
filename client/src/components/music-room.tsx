import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { usePolling } from "@/hooks/use-polling";
import { Play, Pause, SkipForward, Volume2, Users, Music, Send } from "lucide-react";
import type { User, ChatWithMembers, MessageWithSender } from "@shared/schema";

interface MusicRoomProps {
  currentUser: User;
  activeChat: ChatWithMembers;
}

export function MusicRoom({ currentUser, activeChat }: MusicRoomProps) {
  const [messageInput, setMessageInput] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/chats/" + activeChat.id + "/messages"],
    enabled: !!activeChat,
  });

  // Poll for new messages and music updates
  usePolling(() => {
    queryClient.invalidateQueries({
      queryKey: ["/api/chats/" + activeChat.id + "/messages"]
    });
    queryClient.invalidateQueries({
      queryKey: ["/api/chats/" + activeChat.id]
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

  const handleShareSong = () => {
    if (!songUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song URL",
        variant: "destructive",
      });
      return;
    }

    // Extract song name from URL or use URL as fallback
    const songName = songUrl.includes("youtube.com") || songUrl.includes("youtu.be") 
      ? "YouTube Song" 
      : songUrl.includes("spotify.com") 
      ? "Spotify Track"
      : "Song";

    sendMessageMutation.mutate(`🎵 Shared: ${songName} - ${songUrl}`);
    setSongUrl("");
  };

  const getChatName = () => {
    return activeChat.name || "Music Room";
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
      {/* Header */}
      <div className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white font-semibold">
              <Music className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{getChatName()}</h2>
            <p className="text-sm text-purple-600 dark:text-purple-400 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {activeChat.members.length} listeners
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          Music Room
        </Badge>
      </div>

      {/* Music Player Area */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Now Playing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {activeChat.currentSong || "No song selected"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" disabled>
                  <Play className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" disabled>
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" disabled>
                  <Volume2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Song Sharing */}
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Share a song URL (YouTube, Spotify, etc.)"
                value={songUrl}
                onChange={(e) => setSongUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleShareSong} disabled={!songUrl.trim()}>
                <Music className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Share song links to listen together with friends!
            </p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <Music className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <p>Welcome to the music room!</p>
            <p className="text-sm">Share songs and chat with friends while listening together</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentUser.id;
            const isSongShare = message.content.includes("🎵 Shared:");
            
            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 animate-slide-up ${
                  isOwn ? "justify-end" : ""
                }`}
              >
                {!isOwn && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-500 text-white text-sm font-semibold">
                      {getMessageAvatar(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[70%] ${isOwn ? "order-first" : ""}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-sm ${
                      isOwn
                        ? "bg-primary text-white rounded-tr-lg"
                        : isSongShare
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-tl-lg"
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
      </div>
      
      {/* Message Input */}
      <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Chat about the music..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              className="rounded-full"
            />
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