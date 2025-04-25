// Load environment variables
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Determine the current directory and load .env file
const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(currentDir, "..");

dotenv.config({ path: join(rootDir, ".env") });

// Configuration object with all required environment variables
export const config = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || "contentcraft-dev-secret",
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",
  
  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  PRICE_PER_WORD_CENTS: parseInt(process.env.PRICE_PER_WORD_CENTS || "5", 10),
  STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || "http://localhost:5000/order/success",
  STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || "http://localhost:5000/checkout",
  
  // Email
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  SMTP_SENDER: process.env.SMTP_SENDER || "noreply@contentcraft.com",
  
  // App Settings
  BASE_URL: process.env.BASE_URL || "http://localhost:5000",
  
  // Default admin user credentials for seeding
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME || "admin",
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL || "admin@contentcraft.com",
};

// Validate configuration
const requiredEnvVars = [
  "NODE_ENV",
  "SESSION_SECRET",
  "DATABASE_URL"
];

if (process.env.NODE_ENV === "production") {
  requiredEnvVars.push(
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASSWORD"
  );
}

// Log a warning for missing env vars in development, throw error in production
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    const message = `Missing required environment variable: ${envVar}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(`WARNING: ${message}`);
    }
  }
}

// Export configuration
export default config;
