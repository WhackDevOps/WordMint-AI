import { Express, Request, Response } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth";
import { storage } from "../storage";
import { createOrderRequestSchema, OrderStatus } from "@shared/schema";
import { generateContent } from "../services/openai";
import { sendEmail } from "../services/email";
import { config } from "../config";

export function registerOrderRoutes(app: Express): void {
  // Create a new order
  app.post("/api/orders/create", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validation = createOrderRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.format() 
        });
      }
      
      const { topic, wordCount, customerEmail } = req.body;
      
      // Calculate price
      const settings = await storage.getSettings();
      const pricePerWord = settings.pricing?.pricePerWord || config.PRICE_PER_WORD_CENTS;
      const price = wordCount * pricePerWord;
      
      // Create order in pending state (we'll update it after payment)
      const order = await storage.createOrder({
        topic,
        wordCount,
        price,
        customerEmail,
        stripePaymentIntentId: "",
      });
      
      // Return URL to the Stripe checkout for this order
      res.json({
        message: "Order created successfully",
        orderId: order.id,
        checkoutUrl: `/api/checkout/${order.id}`,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get a specific order by ID (public, but requires the order ID)
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      console.error("Error getting order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get all orders (admin only)
  app.get("/api/orders", isAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string || "1", 10);
      const limit = parseInt(req.query.limit as string || "10", 10);
      const status = req.query.status as string;
      const search = req.query.search as string;
      const dateFilter = req.query.date as any;
      
      const result = await storage.getAllOrders({
        page,
        limit,
        status: status !== "all" ? status as any : undefined,
        search,
        dateFilter: dateFilter !== "all" ? dateFilter : undefined,
      });
      
      const totalPages = Math.ceil(result.total / limit);
      
      res.json({
        orders: result.orders,
        totalOrders: result.total,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.error("Error getting orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get recent orders for dashboard (admin only)
  app.get("/api/orders/recent", isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || "5", 10);
      const recentOrders = await storage.getRecentOrders(limit);
      
      res.json(recentOrders);
    } catch (error) {
      console.error("Error getting recent orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Export orders as CSV (admin only)
  app.get("/api/orders/export", isAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.getAllOrders({ limit: 1000 });
      const orders = result.orders;
      
      // Create CSV header
      let csv = "ID,Customer Email,Topic,Word Count,Status,Price,API Cost,Created At\n";
      
      // Add each order as a row
      orders.forEach((order) => {
        csv += `${order.id},${order.customerEmail},"${order.topic.replace(/"/g, '""')}",${order.wordCount},${order.status},${order.price / 100},${(order.apiCost || 0) / 100},${new Date(order.createdAt).toISOString()}\n`;
      });
      
      // Set headers for CSV download
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=orders-${new Date().toISOString().split("T")[0]}.csv`);
      
      res.send(csv);
    } catch (error) {
      console.error("Error exporting orders:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get dashboard stats (admin only)
  app.get("/api/stats", isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStats();
      
      res.json(stats);
    } catch (error) {
      console.error("Error getting stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get settings (admin only)
  app.get("/api/settings", isAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSettings();
      
      // Mask sensitive info
      if (settings.apiKeys) {
        settings.apiKeys = {
          openaiApiKey: settings.apiKeys.openaiApiKey ? "•••••••••••••••••••••••••••••••" : "",
          stripeSecretKey: settings.apiKeys.stripeSecretKey ? "•••••••••••••••••••••••••••••••" : "",
          stripeWebhookSecret: settings.apiKeys.stripeWebhookSecret ? "•••••••••••••••••••••••••••••••" : "",
        };
      }
      
      if (settings.email && settings.email.smtpPassword) {
        settings.email.smtpPassword = "•••••••••••••";
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error getting settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update API keys (admin only)
  app.patch("/api/settings/api-keys", isAdmin, async (req: Request, res: Response) => {
    try {
      const { openaiApiKey, stripeSecretKey, stripeWebhookSecret } = req.body;
      
      const updatedSettings = await storage.updateSettings("apiKeys", {
        openaiApiKey,
        stripeSecretKey,
        stripeWebhookSecret,
      });
      
      res.json({ message: "API keys updated successfully" });
    } catch (error) {
      console.error("Error updating API keys:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update email settings (admin only)
  app.patch("/api/settings/email", isAdmin, async (req: Request, res: Response) => {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPassword, senderEmail } = req.body;
      
      const updatedSettings = await storage.updateSettings("email", {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        senderEmail,
      });
      
      res.json({ message: "Email settings updated successfully" });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update pricing settings (admin only)
  app.patch("/api/settings/pricing", isAdmin, async (req: Request, res: Response) => {
    try {
      const { pricePerWord } = req.body;
      
      const updatedSettings = await storage.updateSettings("pricing", {
        pricePerWord,
      });
      
      res.json({ message: "Pricing settings updated successfully" });
    } catch (error) {
      console.error("Error updating pricing settings:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Process content generation after payment (webhook will call this)
  app.post("/api/orders/:id/process", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id, 10);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      if (order.status !== OrderStatus.PENDING) {
        return res.status(400).json({ message: `Order is already ${order.status}` });
      }
      
      // Update status to processing
      await storage.updateOrder(orderId, { status: OrderStatus.PROCESSING });
      
      // Send in-progress email
      sendEmail({
        to: order.customerEmail,
        subject: "Your content order is being processed",
        template: "in-progress",
        data: {
          orderId: order.id,
          topic: order.topic,
        },
      });
      
      // Generate content
      try {
        const result = await generateContent(order.topic, order.wordCount);
        
        // Update order with content and cost
        await storage.updateOrder(orderId, {
          status: OrderStatus.COMPLETE,
          content: result.content,
          apiCost: result.cost,
        });
        
        // Send completed email
        sendEmail({
          to: order.customerEmail,
          subject: "Your content is ready",
          template: "completed",
          data: {
            orderId: order.id,
            topic: order.topic,
            contentPreview: result.content.substring(0, 100) + "...",
            viewUrl: `${config.BASE_URL}/order/${order.id}`,
          },
        });
        
        res.json({ message: "Order processed successfully" });
      } catch (error) {
        console.error("Error generating content:", error);
        
        // Update order status to failed
        await storage.updateOrder(orderId, { status: OrderStatus.FAILED });
        
        // Send failure email
        sendEmail({
          to: order.customerEmail,
          subject: "There was an issue with your content order",
          template: "failed",
          data: {
            orderId: order.id,
            topic: order.topic,
            errorMessage: "We couldn't generate your content due to a technical issue. Please contact support.",
          },
        });
        
        res.status(500).json({ message: "Content generation failed" });
      }
    } catch (error) {
      console.error("Error processing order:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
