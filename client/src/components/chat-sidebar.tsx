import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { CreateGroupModal } from "@/components/create-group-modal";
import { MessageCircle, Users, UserPlus, Search, Plus, Moon, Sun } from "lucide-react";
import type { User, ChatWithMembers } from "@shared/schema";

interface ChatSidebarProps {
  currentUser: User;
  activeTab: "direct" | "groups";
  onTabChange: (tab: "direct" | "groups") => void;
  onChatSelect: (chat: ChatWithMembers) => void;
  activeChatId?: number;
}

export function ChatSidebar({ 
  currentUser, 
  activeTab, 
  onTabChange, 
  onChatSelect, 
  activeChatId 
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: chats = [] } = useQuery<ChatWithMembers[]>({
    queryKey: ["/api/users/" + currentUser.id + "/chats"],
  });

  const { data: onlineUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/online"],
  });

  const directChats = chats.filter(chat => chat.type === "direct");
  const groupChats = chats.filter(chat => chat.type === "group");

  const filteredChats = (activeTab === "direct" ? directChats : groupChats).filter(chat => {
    if (!searchQuery) return true;
    
    if (chat.type === "direct") {
      const otherMember = chat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.username.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return chat.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
  });

  const getAvatarContent = (chat: ChatWithMembers) => {
    if (chat.type === "direct") {
      const otherMember = chat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.username.charAt(0).toUpperCase() || "?";
    }
    return <Users className="w-4 h-4" />;
  };

  const getChatName = (chat: ChatWithMembers) => {
    if (chat.type === "direct") {
      const otherMember = chat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.username || "Unknown User";
    }
    return chat.name || "Unnamed Group";
  };

  const getChatPreview = (chat: ChatWithMembers) => {
    if (chat.lastMessage) {
      const isOwn = chat.lastMessage.senderId === currentUser.id;
      const prefix = isOwn ? "You: " : `${chat.lastMessage.sender.username}: `;
      return prefix + chat.lastMessage.content;
    }
    return "No messages yet";
  };

  const getOnlineStatus = (chat: ChatWithMembers) => {
    if (chat.type === "direct") {
      const otherMember = chat.members.find(m => m.userId !== currentUser.id);
      return otherMember?.user.isOnline;
    }
    return false; // Groups don't have online status
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Connect</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {currentUser.username}!</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>
      </div>
      
      {/* Chat Tabs */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        <Button
          variant="ghost"
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 rounded-none ${
            activeTab === "direct"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          onClick={() => onTabChange("direct")}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Direct
        </Button>
        <Button
          variant="ghost"
          className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 rounded-none ${
            activeTab === "groups"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
          onClick={() => onTabChange("groups")}
        >
          <Users className="w-4 h-4 mr-2" />
          Groups
        </Button>
      </div>
      
      {/* Create Group Button */}
      {activeTab === "groups" && (
        <div className="p-3 border-b border-gray-200 dark:border-slate-700">
          <Button 
            onClick={() => setShowCreateGroup(true)}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      )}
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {activeTab === "direct" ? "No direct chats yet" : "No groups yet"}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-l-4 transition-all ${
                activeChatId === chat.id
                  ? "border-primary bg-gray-50 dark:bg-slate-700"
                  : "border-transparent hover:border-primary"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
                      {getAvatarContent(chat)}
                    </AvatarFallback>
                  </Avatar>
                  {getOnlineStatus(chat) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate">{getChatName(chat)}</p>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(new Date(chat.lastMessage.sentAt))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {getChatPreview(chat)}
                  </p>
                </div>
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <Badge variant="default" className="ml-2">
                    {chat.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <CreateGroupModal
        open={showCreateGroup}
        onOpenChange={setShowCreateGroup}
        currentUser={currentUser}
        onlineUsers={onlineUsers}
      />
    </div>
  );
}
