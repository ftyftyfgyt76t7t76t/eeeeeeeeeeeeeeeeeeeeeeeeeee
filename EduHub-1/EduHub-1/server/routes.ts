import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertCommentSchema, insertMessageSchema, insertResourceSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import express from "express";
import session from "express-session";

export async function registerRoutes(app: Express): Promise<Server> {
  // Use sessions
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "eduhub-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 24 * 7 }, // 1 week
    })
  );
  
  // Auth middleware to ensure user is logged in
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.userId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      req.session!.userId = user.id;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session!.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session!.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/current-user", async (req, res) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  });
  
  // Create demo user with 10-minute expiry
  app.post("/api/auth/demo", async (req, res) => {
    try {
      const { role } = req.body;
      
      if (!role || !["student", "teacher", "school"].includes(role)) {
        return res.status(400).json({ message: "Valid role is required" });
      }
      
      // Create a demo user with the specified role
      const demoUser = await storage.createUser({
        email: `demo_${role}_${Date.now()}@eduhub.com`,
        password: "demo123",
        fullName: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        phone: "555-555-5555",
        role: role as any,
        schoolName: role === "student" || role === "teacher" ? "Demo School" : undefined,
        age: role === "student" ? 16 : undefined,
        grade: role === "student" ? "10th" : undefined,
        address: "123 Demo St",
        teachingGrades: role === "teacher" ? "9th, 10th, 11th" : undefined,
        ceoName: role === "school" ? "Demo Principal" : undefined,
      });
      
      req.session!.userId = demoUser.id;
      req.session!.isDemo = true;
      
      // Set session to expire in 10 minutes
      req.session!.cookie.maxAge = 1000 * 60 * 10; // 10 minutes
      
      const { password, ...userWithoutPassword } = demoUser;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      return res.status(500).json({ message: "Failed to create demo account" });
    }
  });
  
  // Post routes
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await storage.getPosts();
      
      // If user is logged in, check if they've liked each post
      if (req.session && req.session.userId) {
        const userId = req.session.userId;
        
        const postsWithLikeStatus = await Promise.all(
          posts.map(async (post) => {
            const like = await storage.getLike(post.id, userId);
            return {
              ...post,
              liked: !!like,
            };
          })
        );
        
        return res.json(postsWithLikeStatus);
      }
      
      return res.json(posts);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch posts" });
    }
  });
  
  app.post("/api/posts", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const postData = insertPostSchema.parse({ ...req.body, userId });
      
      const post = await storage.createPost(postData);
      return res.status(201).json(post);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to create post" });
    }
  });
  
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(post.userId);
      const comments = await storage.getPostComments(postId);
      const likes = await storage.getPostLikes(postId);
      
      let liked = false;
      if (req.session && req.session.userId) {
        const like = await storage.getLike(postId, req.session.userId);
        liked = !!like;
      }
      
      return res.json({
        ...post,
        user,
        comments,
        likesCount: likes.length,
        commentsCount: comments.length,
        sharesCount: 0,
        liked,
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch post" });
    }
  });
  
  // Comments routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const comments = await storage.getPostComments(postId);
      
      // Fetch user details for each comment
      const commentsWithUser = await Promise.all(
        comments.map(async (comment) => {
          const user = await storage.getUser(comment.userId);
          return {
            ...comment,
            user,
          };
        })
      );
      
      return res.json(commentsWithUser);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  app.post("/api/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.session!.userId;
      
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId,
        userId,
      });
      
      const comment = await storage.createComment(commentData);
      const user = await storage.getUser(userId);
      
      return res.status(201).json({
        ...comment,
        user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  // Like routes
  app.post("/api/posts/:id/like", requireAuth, async (req, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.session!.userId;
      
      // Check if user already liked the post
      const existingLike = await storage.getLike(postId, userId);
      
      if (existingLike) {
        await storage.deleteLike(existingLike.id);
        return res.json({ liked: false });
      } else {
        await storage.createLike({ postId, userId });
        return res.json({ liked: true });
      }
    } catch (error) {
      return res.status(500).json({ message: "Failed to process like" });
    }
  });
  
  // Messages routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const messages = await storage.getUserMessages(userId);
      
      // Group messages by conversation partner
      const userIds = new Set<number>();
      messages.forEach(message => {
        if (message.senderId !== userId) userIds.add(message.senderId);
        if (message.receiverId !== userId) userIds.add(message.receiverId);
      });
      
      // Fetch user details for each conversation partner
      const conversations = await Promise.all(
        Array.from(userIds).map(async (partnerId) => {
          const partner = await storage.getUser(partnerId);
          const conversation = await storage.getConversation(userId, partnerId);
          const unreadCount = conversation.filter(msg => msg.receiverId === userId && !msg.isRead).length;
          
          return {
            partnerId,
            partner,
            unreadCount,
            lastMessage: conversation[conversation.length - 1],
          };
        })
      );
      
      return res.json(conversations);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  
  app.get("/api/messages/:partnerId", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      const partnerId = parseInt(req.params.partnerId);
      
      const conversation = await storage.getConversation(userId, partnerId);
      
      // Mark received messages as read
      for (const message of conversation) {
        if (message.receiverId === userId && !message.isRead) {
          await storage.markMessageAsRead(message.id);
        }
      }
      
      return res.json(conversation);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });
  
  app.post("/api/messages/:receiverId", requireAuth, async (req, res) => {
    try {
      const senderId = req.session!.userId;
      const receiverId = parseInt(req.params.receiverId);
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId,
        receiverId,
      });
      
      const message = await storage.createMessage(messageData);
      return res.status(201).json(message);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  // Resources routes
  app.get("/api/resources", async (req, res) => {
    try {
      const type = req.query.type as string;
      
      let resources;
      if (type) {
        resources = await storage.getResourcesByType(type);
      } else {
        resources = await storage.getResources();
      }
      
      // Fetch user details for each resource
      const resourcesWithUser = await Promise.all(
        resources.map(async (resource) => {
          const user = await storage.getUser(resource.userId);
          return {
            ...resource,
            user,
          };
        })
      );
      
      return res.json(resourcesWithUser);
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch resources" });
    }
  });
  
  app.post("/api/resources", requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId;
      
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        userId,
      });
      
      const resource = await storage.createResource(resourceData);
      const user = await storage.getUser(userId);
      
      return res.status(201).json({
        ...resource,
        user,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ message: "Failed to create resource" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
