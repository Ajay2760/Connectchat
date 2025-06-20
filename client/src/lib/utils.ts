import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAvatarColor(userId: number): string {
  const colors = [
    "from-pink-400 to-purple-500",
    "from-blue-400 to-cyan-500", 
    "from-green-400 to-emerald-500",
    "from-orange-400 to-red-500",
    "from-purple-400 to-pink-500",
    "from-indigo-400 to-blue-500",
    "from-teal-400 to-green-500",
    "from-yellow-400 to-orange-500",
  ];
  return colors[userId % colors.length];
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function generateChatName(members: { user: { username: string } }[], currentUserId: number): string {
  const otherMembers = members.filter(m => m.user && m.user.username);
  
  if (otherMembers.length === 0) return "Unknown";
  if (otherMembers.length === 1) return otherMembers[0].user.username;
  
  return otherMembers
    .slice(0, 3)
    .map(m => m.user.username)
    .join(", ") + (otherMembers.length > 3 ? "..." : "");
}
