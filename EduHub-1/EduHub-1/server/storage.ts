import {
  users,
  posts,
  comments,
  likes,
  messages,
  resources,
  type User,
  type InsertUser,
  type Post,
  type InsertPost,
  type Comment,
  type InsertComment,
  type Like,
  type InsertLike,
  type Message,
  type InsertMessage,
  type Resource,
  type InsertResource,
  type PostWithUser,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Post methods
  getPost(id: number): Promise<Post | undefined>;
  getPosts(): Promise<PostWithUser[]>;
  getUserPosts(userId: number): Promise<PostWithUser[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Comment methods
  getPostComments(postId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;
  
  // Like methods
  getPostLikes(postId: number): Promise<Like[]>;
  getLike(postId: number, userId: number): Promise<Like | undefined>;
  createLike(like: InsertLike): Promise<Like>;
  deleteLike(id: number): Promise<boolean>;
  
  // Message methods
  getUserMessages(userId: number): Promise<Message[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<Message | undefined>;
  
  // Resource methods
  getResources(): Promise<Resource[]>;
  getResourcesByType(type: string): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  deleteResource(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private comments: Map<number, Comment>;
  private likes: Map<number, Like>;
  private messages: Map<number, Message>;
  private resources: Map<number, Resource>;
  
  private userIdCounter: number;
  private postIdCounter: number;
  private commentIdCounter: number;
  private likeIdCounter: number;
  private messageIdCounter: number;
  private resourceIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.comments = new Map();
    this.likes = new Map();
    this.messages = new Map();
    this.resources = new Map();
    
    this.userIdCounter = 1;
    this.postIdCounter = 1;
    this.commentIdCounter = 1;
    this.likeIdCounter = 1;
    this.messageIdCounter = 1;
    this.resourceIdCounter = 1;
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date(),
      profilePicture: null,
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Post methods
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async getPosts(): Promise<PostWithUser[]> {
    const allPosts = Array.from(this.posts.values());
    const allPostsWithUser = await Promise.all(
      allPosts.map(async (post) => {
        const user = await this.getUser(post.userId);
        const likes = await this.getPostLikes(post.id);
        const comments = await this.getPostComments(post.id);
        
        return {
          ...post,
          user: user!,
          likesCount: likes.length,
          commentsCount: comments.length,
          sharesCount: 0, // We're not tracking shares for now
        };
      })
    );
    
    return allPostsWithUser.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getUserPosts(userId: number): Promise<PostWithUser[]> {
    const posts = Array.from(this.posts.values()).filter(
      (post) => post.userId === userId
    );
    
    const postsWithUser = await Promise.all(
      posts.map(async (post) => {
        const user = await this.getUser(post.userId);
        const likes = await this.getPostLikes(post.id);
        const comments = await this.getPostComments(post.id);
        
        return {
          ...post,
          user: user!,
          likesCount: likes.length,
          commentsCount: comments.length,
          sharesCount: 0,
        };
      })
    );
    
    return postsWithUser.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.postIdCounter++;
    const newPost: Post = {
      ...post,
      id,
      createdAt: new Date(),
    };
    this.posts.set(id, newPost);
    return newPost;
  }
  
  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const post = await this.getPost(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }
  
  // Comment methods
  async getPostComments(postId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.postId === postId
    );
  }
  
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: new Date(),
    };
    this.comments.set(id, newComment);
    return newComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    return this.comments.delete(id);
  }
  
  // Like methods
  async getPostLikes(postId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      (like) => like.postId === postId
    );
  }
  
  async getLike(postId: number, userId: number): Promise<Like | undefined> {
    return Array.from(this.likes.values()).find(
      (like) => like.postId === postId && like.userId === userId
    );
  }
  
  async createLike(like: InsertLike): Promise<Like> {
    const existingLike = await this.getLike(like.postId, like.userId);
    if (existingLike) return existingLike;
    
    const id = this.likeIdCounter++;
    const newLike: Like = {
      ...like,
      id,
      createdAt: new Date(),
    };
    this.likes.set(id, newLike);
    return newLike;
  }
  
  async deleteLike(id: number): Promise<boolean> {
    return this.likes.delete(id);
  }
  
  // Message methods
  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.senderId === userId || message.receiverId === userId
    );
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => 
        (message.senderId === user1Id && message.receiverId === user2Id) ||
        (message.senderId === user2Id && message.receiverId === user1Id)
    ).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  
  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = {
      ...message,
      id,
      isRead: false,
      createdAt: new Date(),
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }
  
  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;
    
    const updatedMessage = { ...message, isRead: true };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  // Resource methods
  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }
  
  async getResourcesByType(type: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.type === type
    );
  }
  
  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.resourceIdCounter++;
    const newResource: Resource = {
      ...resource,
      id,
      createdAt: new Date(),
    };
    this.resources.set(id, newResource);
    return newResource;
  }
  
  async deleteResource(id: number): Promise<boolean> {
    return this.resources.delete(id);
  }
}

export const storage = new MemStorage();
