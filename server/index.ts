import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import mongoose from 'mongoose';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Connect to MongoDB directly
mongoose.connect(process.env.MONGODB_URI!, {
  dbName: 'contentbot', // Default database name
  serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
}).then(() => {
  log('✅ Connected to MongoDB Atlas', 'mongodb');
}).catch((err: Error) => {
  log(`❌ Failed to connect to MongoDB: ${err.message}`, 'mongodb');
  log('Continuing with in-memory storage as fallback', 'storage');
});

// Main application startup
(async () => {
  try {
    // MongoDB connection is now handled above

    // Register API routes
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error: ${err.message}`, 'error');
      res.status(status).json({ message });
      throw err;
    });

    // Set up Vite for development or serve static files in production
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the server
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error: any) {
    log(`Failed to start server: ${error.message}`, 'error');
    process.exit(1);
  }
})();
