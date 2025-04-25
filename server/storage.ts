import { 
  type User, 
  type InsertUser, 
  type Order, 
  type InsertOrder, 
  type UpdateOrder,
  type OrderStatusType
} from "@shared/schema";
import { hashSync } from "bcrypt";
import mongoose from 'mongoose';
import { User as UserModel } from './models/User';
import { Order as OrderModel } from './models/Order';
import { Settings as SettingsModel } from './models/Settings';
import { log } from './vite';

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

  // Counter for ID generation
  getNextSequence(name: string): Promise<number>;
}

export class MongoStorage implements IStorage {
  private counters: {
    user: number;
    order: number;
  };

  constructor() {
    // Initialize counters with default values
    this.counters = {
      user: 1,
      order: 1
    };

    // Initialize the database
    this.initDatabase();
  }

  // Initialize database with default data if empty
  private async initDatabase() {
    try {
      // Initialize counters by finding the highest IDs
      const highestUserId = await UserModel.findOne().sort('-id').exec();
      if (highestUserId) {
        this.counters.user = highestUserId.id + 1;
      }

      const highestOrderId = await OrderModel.findOne().sort('-id').exec();
      if (highestOrderId) {
        this.counters.order = highestOrderId.id + 1;
      }

      log(`Initialized ID counters: user=${this.counters.user}, order=${this.counters.order}`, 'mongodb');

      // Create default admin user if no users exist
      const userCount = await UserModel.countDocuments();
      if (userCount === 0) {
        await this.createUser({
          username: "admin",
          password: hashSync("admin123", 10),
          email: "admin@contentcraft.com",
          isAdmin: true
        });
        log('Created default admin user', 'mongodb');
      }

      // Initialize default settings if they don't exist
      await this.initDefaultSettings();
    } catch (error: any) {
      log(`Error initializing database: ${error.message}`, 'mongodb');
    }
  }

  // Initialize default settings
  private async initDefaultSettings() {
    try {
      // Check if API keys settings exist
      const apiKeysSettings = await SettingsModel.findOne({ section: 'apiKeys' });
      if (!apiKeysSettings) {
        await SettingsModel.create({
          section: 'apiKeys',
          data: {
            openaiApiKey: "",
            stripeSecretKey: "",
            stripeWebhookSecret: ""
          }
        });
      }

      // Check if email settings exist
      const emailSettings = await SettingsModel.findOne({ section: 'email' });
      if (!emailSettings) {
        await SettingsModel.create({
          section: 'email',
          data: {
            smtpHost: "",
            smtpPort: "587",
            smtpUser: "",
            smtpPassword: "",
            senderEmail: "noreply@contentcraft.com"
          }
        });
      }

      // Check if pricing settings exist
      const pricingSettings = await SettingsModel.findOne({ section: 'pricing' });
      if (!pricingSettings) {
        await SettingsModel.create({
          section: 'pricing',
          data: {
            pricePerWord: 5 // 5 cents per word by default
          }
        });
      }

      log('Default settings initialized', 'mongodb');
    } catch (error: any) {
      log(`Error initializing default settings: ${error.message}`, 'mongodb');
    }
  }

  // Get next sequence for auto-incrementing IDs
  async getNextSequence(name: string): Promise<number> {
    if (name === 'user') {
      return this.counters.user++;
    } else if (name === 'order') {
      return this.counters.order++;
    }
    throw new Error(`Unknown sequence name: ${name}`);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ id }).lean();
      return user as User | undefined;
    } catch (error: any) {
      log(`Error getting user: ${error.message}`, 'mongodb');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username }).lean();
      return user as User | undefined;
    } catch (error: any) {
      log(`Error getting user by username: ${error.message}`, 'mongodb');
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const id = await this.getNextSequence('user');
      
      // Hash password if it's not already hashed
      const hashedPassword = insertUser.password.startsWith('$2') 
        ? insertUser.password 
        : hashSync(insertUser.password, 10);
        
      const user = new UserModel({
        ...insertUser,
        id,
        password: hashedPassword
      });
      
      await user.save();
      return user.toObject() as User;
    } catch (error: any) {
      log(`Error creating user: ${error.message}`, 'mongodb');
      throw error;
    }
  }

  // Order methods
  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const id = await this.getNextSequence('order');
      const now = new Date();
      
      const newOrder = new OrderModel({
        ...order,
        id,
        status: "pending",
        apiCost: 0,
        content: "",
        createdAt: now,
        updatedAt: now
      });
      
      await newOrder.save();
      return newOrder.toObject() as Order;
    } catch (error: any) {
      log(`Error creating order: ${error.message}`, 'mongodb');
      throw error;
    }
  }

  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const order = await OrderModel.findOne({ id }).lean();
      return order as Order | undefined;
    } catch (error: any) {
      log(`Error getting order: ${error.message}`, 'mongodb');
      return undefined;
    }
  }

  async getOrderByPaymentIntent(paymentIntentId: string): Promise<Order | undefined> {
    try {
      const order = await OrderModel.findOne({ stripePaymentIntentId: paymentIntentId }).lean();
      return order as Order | undefined;
    } catch (error: any) {
      log(`Error getting order by payment intent: ${error.message}`, 'mongodb');
      return undefined;
    }
  }

  async updateOrder(id: number, updateData: UpdateOrder): Promise<Order | undefined> {
    try {
      const order = await OrderModel.findOneAndUpdate(
        { id },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      return order as Order | undefined;
    } catch (error: any) {
      log(`Error updating order: ${error.message}`, 'mongodb');
      return undefined;
    }
  }

  async getAllOrders(options: {
    status?: OrderStatusType;
    page?: number;
    limit?: number;
    search?: string;
    dateFilter?: 'today' | 'week' | 'month' | 'all';
  } = {}): Promise<{ orders: Order[]; total: number }> {
    try {
      const {
        status,
        page = 1,
        limit = 10,
        search = '',
        dateFilter = 'all'
      } = options;
      
      // Build query
      let query: any = {};
      
      // Status filter
      if (status) {
        query.status = status;
      }
      
      // Search filter
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { customerEmail: searchRegex },
          { topic: searchRegex }
        ];
        
        // If search is a number, try to match order ID
        if (!isNaN(Number(search))) {
          query.$or.push({ id: Number(search) });
        }
      }
      
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (dateFilter) {
          case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
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
        
        query.createdAt = { $gte: startDate };
      }
      
      // Get total count
      const total = await OrderModel.countDocuments(query);
      
      // Get paginated results
      const skip = (page - 1) * limit;
      const orders = await OrderModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      
      return {
        orders: orders as Order[],
        total
      };
    } catch (error: any) {
      log(`Error getting all orders: ${error.message}`, 'mongodb');
      return { orders: [], total: 0 };
    }
  }

  async getRecentOrders(limit: number = 3): Promise<Order[]> {
    try {
      const orders = await OrderModel.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
      
      return orders as Order[];
    } catch (error: any) {
      log(`Error getting recent orders: ${error.message}`, 'mongodb');
      return [];
    }
  }

  // Stats
  async getStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
  }> {
    try {
      const totalOrders = await OrderModel.countDocuments();
      
      const pendingOrders = await OrderModel.countDocuments({
        status: { $in: ['pending', 'processing'] }
      });
      
      // Calculate total revenue - might be expensive with large datasets
      const allOrders = await OrderModel.find({}, { price: 1 }).lean();
      const totalRevenue = allOrders.reduce((sum, order) => sum + (order.price || 0), 0);
      
      return {
        totalOrders,
        pendingOrders,
        totalRevenue
      };
    } catch (error: any) {
      log(`Error getting stats: ${error.message}`, 'mongodb');
      return {
        totalOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
      };
    }
  }

  // Settings
  async getSettings(): Promise<any> {
    try {
      const allSettings = await SettingsModel.find().lean();
      
      // Convert to expected format
      return allSettings.reduce((result, setting) => {
        result[setting.section] = setting.data;
        return result;
      }, {} as any);
    } catch (error: any) {
      log(`Error getting settings: ${error.message}`, 'mongodb');
      return {};
    }
  }

  async updateSettings(section: string, newSettings: any): Promise<any> {
    try {
      await SettingsModel.findOneAndUpdate(
        { section },
        { 
          $set: { data: newSettings },
          $setOnInsert: { section }
        },
        { upsert: true }
      );
      
      return this.getSettings();
    } catch (error: any) {
      log(`Error updating settings: ${error.message}`, 'mongodb');
      return {};
    }
  }
}

// Create the MemStorage class for fallback
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
    
    log('Using in-memory storage as fallback', 'storage');
  }

  async getNextSequence(name: string): Promise<number> {
    if (name === 'user') {
      return this.userIdCounter++;
    } else if (name === 'order') {
      return this.orderIdCounter++;
    }
    throw new Error(`Unknown sequence name: ${name}`);
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
      id,
      username: insertUser.username,
      email: insertUser.email,
      password: hashedPassword,
      isAdmin: insertUser.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date()
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

/**
 * This section implements a storage factory that decides whether to use
 * MongoDB or in-memory storage depending on MongoDB connection status.
 */

// Initialize storage objects
const memStorage = new MemStorage();
let mongoStorage: MongoStorage | null = null;

// Simple function to check if MongoDB is connected
function isMongoConnected(): boolean {
  return mongoose.connection && mongoose.connection.readyState === 1;
}

// Get the appropriate storage implementation
function getStorage(): IStorage {
  if (isMongoConnected()) {
    // Lazy initialize MongoDB storage
    if (!mongoStorage) {
      mongoStorage = new MongoStorage();
      log('Using MongoDB Atlas storage', 'storage');
    }
    return mongoStorage;
  } else {
    if (mongoStorage) {
      log('Falling back to in-memory storage', 'storage');
      mongoStorage = null;
    }
    return memStorage;
  }
}

// Export the storage object that will delegate to the appropriate implementation
export const storage: IStorage = {
  getUser: (id) => getStorage().getUser(id),
  getUserByUsername: (username) => getStorage().getUserByUsername(username),
  createUser: (user) => getStorage().createUser(user),
  
  createOrder: (order) => getStorage().createOrder(order),
  getOrder: (id) => getStorage().getOrder(id),
  getOrderByPaymentIntent: (paymentIntentId) => getStorage().getOrderByPaymentIntent(paymentIntentId),
  updateOrder: (id, updateData) => getStorage().updateOrder(id, updateData),
  getAllOrders: (options) => getStorage().getAllOrders(options),
  getRecentOrders: (limit) => getStorage().getRecentOrders(limit),
  
  getStats: () => getStorage().getStats(),
  getSettings: () => getStorage().getSettings(),
  updateSettings: (section, settings) => getStorage().updateSettings(section, settings),
  
  getNextSequence: (name) => getStorage().getNextSequence(name)
};
