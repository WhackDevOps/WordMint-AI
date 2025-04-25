import { Express, Request, Response } from "express";
import passport from "passport";
import { loginSchema } from "@shared/schema";
import { isAuthenticated } from "../middleware/auth";
import { storage } from "../storage";
import { hashSync } from "bcrypt";

export function registerAuthRoutes(app: Express): void {
  // Login route
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    try {
      // Validate request body
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.format() 
        });
      }
      
      passport.authenticate("local", (err: Error, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        
        if (!user) {
          return res.status(401).json({ message: info.message || "Invalid credentials" });
        }
        
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            return next(loginErr);
          }
          
          // Return user info without sensitive data
          return res.json({
            message: "Login successful",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              isAdmin: user.isAdmin
            }
          });
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });
  
  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout(() => {
      res.json({ message: "Logout successful" });
    });
  });
  
  // Check authentication status
  app.get("/api/auth/status", (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      const user = req.user as any;
      return res.json({
        isAuthenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isAdmin: user.isAdmin
        }
      });
    }
    
    res.json({
      isAuthenticated: false,
      user: null
    });
  });
  
  // Change password (protected)
  app.post("/api/auth/change-password", isAuthenticated, async (req: Request, res: Response, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      
      const userId = (req.user as any).id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      if (!require("bcrypt").compareSync(currentPassword, user.password)) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const hashedNewPassword = hashSync(newPassword, 10);
      await storage.updateUser(userId, { password: hashedNewPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });
}
