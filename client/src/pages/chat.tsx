import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ChatArea } from "@/components/chat-area";
import { usePolling } from "@/hooks/use-polling";
import { apiRequest } from "@/lib/queryClient";
import type { User, ChatWithMembers } from "@shared/schema";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"direct" | "groups">("direct");
  const [activeChat, setActiveChat] = useState<ChatWithMembers | null>(null);
  const queryClient = useQueryClient();

  // Initialize current user from localStorage or redirect to welcome
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      setLocation("/");
      return;
    }
    
    try {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      queryClient.setQueryData(["currentUser"], user);
    } catch (error) {
      localStorage.removeItem("currentUser");
      setLocation("/");
    }
  }, [setLocation, queryClient]);

  // Update user online status periodically
  usePolling(() => {
    if (currentUser) {
      apiRequest("PUT", `/api/users/${currentUser.id}/status`, { isOnline: true })
        .catch(() => {
          // Silently fail - user might be offline
        });
      
      // Refresh online users and chats
      queryClient.invalidateQueries({ queryKey: ["/api/users/online"] });
    }
  }, 30000, !!currentUser); // Every 30 seconds

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUser) {
        apiRequest("PUT", `/api/users/${currentUser.id}/status`, { isOnline: false })
          .catch(() => {
            // Silently fail
          });
      }
    };
  }, [currentUser]);

  const handleChatSelect = async (chat: ChatWithMembers) => {
    setActiveChat(chat);
  };

  const handleStartDirectChat = async (otherUser: User) => {
    if (!currentUser) return;
    
    try {
      const response = await apiRequest("POST", "/api/chats/direct", {
        userId1: currentUser.id,
        userId2: otherUser.id,
      });
      const chat = await response.json();
      setActiveChat(chat);
      setActiveTab("direct");
      
      queryClient.invalidateQueries({
        queryKey: ["/api/users/" + currentUser.id + "/chats"]
      });
    } catch (error) {
      console.error("Failed to create direct chat:", error);
    }
  };

  if (!currentUser) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="flex h-screen">
        <ChatSidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onChatSelect={handleChatSelect}
          activeChatId={activeChat?.id}
        />
        {activeChat ? (
          <ChatArea
            currentUser={currentUser}
            activeChat={activeChat}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-slate-900">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h2 className="text-2xl font-semibold mb-2">Welcome to Connect</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
