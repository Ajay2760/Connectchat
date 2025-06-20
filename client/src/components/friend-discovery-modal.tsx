import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, Search, MessageCircle, UserCheck } from "lucide-react";
import type { User } from "@shared/schema";

interface FriendDiscoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: User;
  onStartChat: (user: User) => void;
}

export function FriendDiscoveryModal({ 
  open, 
  onOpenChange, 
  currentUser,
  onStartChat
}: FriendDiscoveryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: onlineUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/online"],
    enabled: open,
  });

  const availableFriends = onlineUsers.filter(user => 
    user.id !== currentUser.id &&
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = (user: User) => {
    onStartChat(user);
    onOpenChange(false);
    toast({
      title: "Chat Started",
      description: `Starting conversation with ${user.username}`,
    });
  };

  const handleClose = () => {
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Discover Friends</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search Friends</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label>Online Friends ({availableFriends.length})</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-2">
              {availableFriends.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? "No friends found matching your search" : "No other friends online right now"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Friends will appear here when they're online
                  </p>
                </div>
              ) : (
                availableFriends.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <div className="flex items-center space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            Online
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartChat(user)}
                      className="flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}