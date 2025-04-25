import { Request, Response, NextFunction } from "express";

// Middleware to check if the user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if the user is an admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user && (req.user as any).isAdmin) {
    return next();
  }
  
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

// Middleware to check for API access
export const hasApiAccess = (req: Request, res: Response, next: NextFunction) => {
  // In a real app, check for API key in header or other auth method
  // For our implementation, we'll just check if authenticated
  if (req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ message: "API access denied" });
};
