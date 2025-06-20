import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertChatSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users/online", async (req, res) => {
    try {
      const users = await storage.getOnlineUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch online users" });
    }
  });

  app.put("/api/users/:id/status", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isOnline } = req.body;
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Chats
  app.get("/api/users/:userId/chats", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const chats = await storage.getUserChats(userId);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", async (req, res) => {
    try {
      const chatData = insertChatSchema.extend({
        createdBy: z.number(),
        memberIds: z.array(z.number()).optional()
      }).parse(req.body);

      const chat = await storage.createChat(chatData);

      // Add additional members for group chats
      if (chatData.memberIds) {
        for (const memberId of chatData.memberIds) {
          if (memberId !== chatData.createdBy) {
            await storage.addChatMember(chat.id, memberId);
          }
        }
      }

      const chatWithMembers = await storage.getChatWithMembers(chat.id);
      res.json(chatWithMembers);
    } catch (error) {
      res.status(400).json({ message: "Invalid chat data" });
    }
  });

  app.get("/api/chats/:chatId", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const chat = await storage.getChatWithMembers(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }

      res.json(chat);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch chat" });
    }
  });

  // Messages
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      const messages = await storage.getChatMessages(chatId, limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.extend({
        senderId: z.number()
      }).parse(req.body);

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // Find or create direct chat between two users
  app.post("/api/chats/direct", async (req, res) => {
    try {
      const { userId1, userId2 } = req.body;
      
      // Check if direct chat already exists
      const user1Chats = await storage.getUserChats(userId1);
      const existingChat = user1Chats.find(chat => 
        chat.type === 'direct' && 
        chat.members.length === 2 &&
        chat.members.some(member => member.userId === userId2)
      );

      if (existingChat) {
        return res.json(existingChat);
      }

      // Create new direct chat
      const chat = await storage.createChat({
        type: 'direct',
        createdBy: userId1,
        name: null
      });

      await storage.addChatMember(chat.id, userId2);
      
      const chatWithMembers = await storage.getChatWithMembers(chat.id);
      res.json(chatWithMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to create direct chat" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
