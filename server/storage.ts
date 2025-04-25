import { 
  users, 
  orders, 
  type User, 
  type InsertUser, 
  type Order, 
  type InsertOrder, 
  type UpdateOrder,
  type OrderStatusType
} from "@shared/schema";
import { hashSync } from "bcrypt";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | undefined>;
  updateOrder(id: number, updateData: UpdateOrder): Promise<Order | undefined>;
  getAllOrders(options?: {
    status?: OrderStatusType;
    page?: number;
    limit?: number;
    search?: string;
    dateFilter?: 'today' | 'week' | 'month' | 'all';
  }): Promise<{ orders: Order[]; total: number }>;
  getRecentOrders(limit?: number): Promise<Order[]>;
  
  // Stats
  getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }>;
  
  // Settings
  getSettings(): Promise<any>;
  updateSettings(section: string, settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private orders: Map<number, Order>;
  private settings: any;
  private userIdCounter: number;
  private orderIdCounter: number;

  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.userIdCounter = 1;
    this.orderIdCounter = 1;
    
    // Initialize with default settings
    this.settings = {
      apiKeys: {
        openaiApiKey: "",
        stripeSecretKey: "",
        stripeWebhookSecret: ""
      },
      email: {
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPassword: "",
        senderEmail: "noreply@contentcraft.com"
      },
      pricing: {
        pricePerWord: 5 // 5 cents per word by default
      }
    };
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: hashSync("admin123", 10),
      email: "admin@contentcraft.com",
      isAdmin: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    // Hash password if it's not already hashed
    const hashedPassword = insertUser.password.startsWith('$2') 
      ? insertUser.password 
      : hashSync(insertUser.password, 10);
      
    const user: User = { 
      ...insertUser, 
      id,
      password: hashedPassword 
    };
    
    this.users.set(id, user);
    return user;
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderIdCounter++;
    const now = new Date();
    
    const newOrder: Order = {
      ...order,
      id,
      status: "pending",
      apiCost: 0,
      content: "",
      createdAt: now,
      updatedAt: now
    };
    
    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(
      (order) => order.stripePaymentIntentId === paymentIntentId
    );
  }

  async updateOrder(id: number, updateData: UpdateOrder): Promise<Order | undefined> {
    const order = this.orders.get(id);
    
    if (!order) return undefined;
    
    const updatedOrder: Order = {
      ...order,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getAllOrders(options: {
    status?: OrderStatusType;
    page?: number;
    limit?: number;
    search?: string;
    dateFilter?: 'today' | 'week' | 'month' | 'all';
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const {
      status,
      page = 1,
      limit = 10,
      search = '',
      dateFilter = 'all'
    } = options;
    
    // Apply filters
    let filteredOrders = Array.from(this.orders.values());
    
    // Status filter
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.customerEmail.toLowerCase().includes(searchLower) ||
        order.id.toString().includes(search) ||
        order.topic.toLowerCase().includes(searchLower)
      );
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(0);
      }
      
      filteredOrders = filteredOrders.filter(order => 
        new Date(order.createdAt) >= startDate
      );
    }
    
    // Sort by newest first
    filteredOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
    
    return {
      orders: paginatedOrders,
      total: filteredOrders.length
    };
  }

  async getRecentOrders(limit: number = 3): Promise<Order[]> {
    const allOrders = Array.from(this.orders.values());
    
    // Sort by newest first
    allOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return allOrders.slice(0, limit);
  }

  // Stats
  async getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    const allOrders = Array.from(this.orders.values());
    const pendingOrders = allOrders.filter(order => 
      order.status === 'pending' || order.status === 'processing'
    );
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.price, 0);
    
    return {
      totalOrders: allOrders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue
    };
  }

  // Settings
  async getSettings(): Promise<any> {
    return this.settings;
  }

  async updateSettings(section: string, newSettings: any): Promise<any> {
    if (!this.settings[section]) {
      this.settings[section] = {};
    }
    
    this.settings[section] = {
      ...this.settings[section],
      ...newSettings
    };
    
    return this.settings;
  }
}

export const storage = new MemStorage();
