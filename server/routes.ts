import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { compareSync } from "bcrypt";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { registerAuthRoutes } from "./routes/auth";
import { registerOrderRoutes } from "./routes/orders";
import { registerStripeRoutes } from "./routes/stripe";
import { config } from "./config";

// Configure passport with local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }
      
      if (!compareSync(password, user.password)) {
        return done(null, false, { message: "Invalid username or password" });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

// Configure passport serialization
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: config.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Register API routes
  registerAuthRoutes(app);
  registerOrderRoutes(app);
  registerStripeRoutes(app);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
