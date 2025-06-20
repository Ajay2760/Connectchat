import { 
  users, chats, chatMembers, messages,
  type User, type InsertUser, 
  type Chat, type InsertChat, type ChatWithMembers,
  type ChatMember, type Message, type InsertMessage, type MessageWithSender
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  getOnlineUsers(): Promise<User[]>;

  // Chats
  getChat(id: number): Promise<Chat | undefined>;
  getChatWithMembers(id: number): Promise<ChatWithMembers | undefined>;
  getUserChats(userId: number): Promise<ChatWithMembers[]>;
  createChat(chat: InsertChat & { createdBy: number }): Promise<Chat>;
  addChatMember(chatId: number, userId: number): Promise<void>;
  getChatMembers(chatId: number): Promise<(ChatMember & { user: User })[]>;

  // Messages
  getMessage(id: number): Promise<Message | undefined>;
  getChatMessages(chatId: number, limit?: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  getUnreadMessageCount(chatId: number, userId: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private chats: Map<number, Chat> = new Map();
  private chatMembers: Map<number, ChatMember> = new Map();
  private messages: Map<number, Message> = new Map();
  
  private currentUserId = 1;
  private currentChatId = 1;
  private currentChatMemberId = 1;
  private currentMessageId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isOnline: true, 
      lastSeen: now 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.isOnline = isOnline;
      user.lastSeen = new Date();
      this.users.set(userId, user);
    }
  }

  async getOnlineUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.isOnline);
  }

  async getChat(id: number): Promise<Chat | undefined> {
    return this.chats.get(id);
  }

  async getChatWithMembers(id: number): Promise<ChatWithMembers | undefined> {
    const chat = this.chats.get(id);
    if (!chat) return undefined;

    const members = await this.getChatMembers(id);
    const messages = await this.getChatMessages(id, 1);
    const lastMessage = messages[0];

    return {
      ...chat,
      members,
      lastMessage,
      unreadCount: 0
    };
  }

  async getUserChats(userId: number): Promise<ChatWithMembers[]> {
    const userChatMembers = Array.from(this.chatMembers.values())
      .filter(member => member.userId === userId);
    
    const chats = await Promise.all(
      userChatMembers.map(member => this.getChatWithMembers(member.chatId))
    );

    return chats.filter(chat => chat !== undefined) as ChatWithMembers[];
  }

  async createChat(chat: InsertChat & { createdBy: number }): Promise<Chat> {
    const id = this.currentChatId++;
    const now = new Date();
    const newChat: Chat = { 
      ...chat, 
      id, 
      createdAt: now 
    };
    this.chats.set(id, newChat);
    
    // Add creator as member
    await this.addChatMember(id, chat.createdBy);
    
    return newChat;
  }

  async addChatMember(chatId: number, userId: number): Promise<void> {
    const id = this.currentChatMemberId++;
    const member: ChatMember = {
      id,
      chatId,
      userId,
      joinedAt: new Date()
    };
    this.chatMembers.set(id, member);
  }

  async getChatMembers(chatId: number): Promise<(ChatMember & { user: User })[]> {
    const members = Array.from(this.chatMembers.values())
      .filter(member => member.chatId === chatId);
    
    return members.map(member => ({
      ...member,
      user: this.users.get(member.userId)!
    })).filter(member => member.user);
  }

  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getChatMessages(chatId: number, limit = 50): Promise<MessageWithSender[]> {
    const chatMessages = Array.from(this.messages.values())
      .filter(message => message.chatId === chatId)
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit)
      .reverse();

    return chatMessages.map(message => ({
      ...message,
      sender: this.users.get(message.senderId)!
    })).filter(message => message.sender);
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const newMessage: Message = { 
      ...message, 
      id, 
      sentAt: now 
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  async getUnreadMessageCount(chatId: number, userId: number): Promise<number> {
    // For simplicity, return 0. In a real app, you'd track read status
    return 0;
  }
}

export const storage = new MemStorage();
