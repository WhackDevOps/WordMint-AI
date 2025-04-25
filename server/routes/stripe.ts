import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import { OrderStatus } from "@shared/schema";
import { config } from "../config";
import { sendEmail } from "../services/email";

// Initialize Stripe
const stripe = new Stripe(config.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil", // Update to latest API version
});

export function registerStripeRoutes(app: Express): void {
  // Create a checkout session for an order
  app.get("/api/checkout/:orderId", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Create a Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `SEO Content: ${order.topic}`,
                description: `${order.wordCount} words of SEO optimized content`,
              },
              unit_amount: order.price, // Already in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${config.STRIPE_SUCCESS_URL}?order_id=${order.id}`,
        cancel_url: config.STRIPE_CANCEL_URL,
        customer_email: order.customerEmail,
        metadata: {
          orderId: order.id.toString(),
        },
      });
      
      // Redirect to Stripe Checkout
      res.redirect(303, session.url || "");
    } catch (error) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: "Error creating checkout session" });
    }
  });
  
  // Handle Stripe webhook events
  app.post("/api/webhook", async (req: Request, res: Response) => {
    let event;
    
    try {
      // Verify the webhook signature
      const signature = req.headers["stripe-signature"] as string;
      
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        config.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      return res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
    
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get the order ID from metadata
        const orderId = parseInt(session.metadata?.orderId || "", 10);
        
        if (isNaN(orderId)) {
          console.error("Invalid order ID in webhook:", session.metadata);
          return res.status(400).json({ message: "Invalid order ID" });
        }
        
        const order = await storage.getOrder(orderId);
        
        if (!order) {
          console.error("Order not found in webhook:", orderId);
          return res.status(404).json({ message: "Order not found" });
        }
        
        // Update the order with the payment intent ID
        await storage.updateOrder(orderId, {
          stripePaymentIntentId: session.payment_intent as string,
        });
        
        // Send initial email
        sendEmail({
          to: order.customerEmail,
          subject: "Order Received - Your Content is Being Generated",
          template: "received",
          data: {
            orderId: order.id,
            topic: order.topic,
            wordCount: order.wordCount,
            amount: (order.price / 100).toFixed(2),
          },
        });
        
        // Trigger content generation
        try {
          // We'll make this async so we don't block the webhook response
          fetch(`${config.BASE_URL}/api/orders/${orderId}/process`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }).catch(error => {
            console.error("Error triggering content generation:", error);
          });
        } catch (error) {
          console.error("Error queuing content generation:", error);
        }
        
        break;
      }
      
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find order by payment intent ID
        const order = await storage.getOrderByPaymentIntent(paymentIntent.id);
        
        if (order) {
          // Update order status to failed
          await storage.updateOrder(order.id, { status: OrderStatus.FAILED });
          
          // Send failure email
          sendEmail({
            to: order.customerEmail,
            subject: "Payment Failed for Your Content Order",
            template: "payment-failed",
            data: {
              orderId: order.id,
              topic: order.topic,
              errorMessage: "Your payment could not be processed. Please try again or contact support.",
            },
          });
        }
        
        break;
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  });
  
  // Order success page
  app.get("/order/success", async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.query.order_id as string, 10);
      
      if (isNaN(orderId)) {
        return res.redirect("/?error=invalid_order");
      }
      
      const order = await storage.getOrder(orderId);
      
      if (!order) {
        return res.redirect("/?error=order_not_found");
      }
      
      // Redirect to our order success page
      res.redirect(`/order-success?order_id=${orderId}`);
    } catch (error) {
      console.error("Error handling success:", error);
      res.redirect("/?error=unknown");
    }
  });
}
