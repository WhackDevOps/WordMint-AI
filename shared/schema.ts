import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  isAdmin: true,
});

// Order status enum
export const OrderStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETE: "complete",
  FAILED: "failed",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  status: text("status").$type<OrderStatusType>().notNull().default("pending"),
  topic: text("topic").notNull(),
  wordCount: integer("word_count").notNull(),
  price: integer("price").notNull(), // in cents
  apiCost: integer("api_cost"), // in cents
  content: text("content"),
  customerEmail: text("customer_email").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  topic: true,
  wordCount: true,
  price: true,
  customerEmail: true,
  stripePaymentIntentId: true,
});

export const updateOrderSchema = createInsertSchema(orders).pick({
  status: true,
  content: true,
  apiCost: true,
  stripePaymentIntentId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type UpdateOrder = z.infer<typeof updateOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Create an order request validation
export const createOrderRequestSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters"),
  wordCount: z.number().min(100).max(5000),
  customerEmail: z.string().email("Please provide a valid email address"),
});

// Admin login validation
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});
