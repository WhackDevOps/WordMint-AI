import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// For development, we'll provide a fallback value if the key is missing
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder';
const stripePromise = loadStripe(stripeKey);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Make sure to change this to your payment completion page
          return_url: window.location.origin,
        },
      });
  
      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // This point will only be reached if there is an immediate error when
        // confirming the payment. Otherwise, your customer will be redirected to
        // your `return_url`. For some payment methods like iDEAL, your customer will
        // be redirected to an intermediate site first to authorize the payment, then
        // redirected to the `return_url`.
        toast({
          title: "Payment Successful",
          description: "Thank you for your purchase!",
        });
        
        // Redirect to home page after success
        setLocation('/');
      }
    } catch (err) {
      console.error('Error during payment submission:', err);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button 
        disabled={!stripe || isSubmitting} 
        className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </span>
        ) : (
          'Pay Now'
        )}
      </button>
    </form>
  );
};

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Get the order ID from URL parameters
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order_id');

    if (!orderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    // Create PaymentIntent as soon as the page loads
    apiRequest("GET", `/api/checkout/${orderId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Could not create payment session");
        }
        // For most payment services, we'd parse a JSON response here
        // But our server redirects to Stripe hosted checkout directly
        return res.text();
      })
      .then((data) => {
        // If we get a URL back, it's a redirect to Stripe Checkout
        if (data.startsWith('http')) {
          window.location.href = data;
        } else {
          // If we get JSON instead, parse it to get client secret
          try {
            const jsonData = JSON.parse(data);
            if (jsonData.clientSecret) {
              setClientSecret(jsonData.clientSecret);
            } else {
              throw new Error("Invalid response format");
            }
          } catch (e) {
            throw new Error("Invalid response from server");
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching payment intent:", err);
        setError(err.message || "Error initializing payment");
        toast({
          title: "Payment Error",
          description: err.message || "Could not initialize payment session",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [toast, setLocation]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Preparing your checkout...</h2>
        <p className="text-muted-foreground">Please wait while we set up your payment</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-destructive mb-4">Payment Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => setLocation('/')}
            className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    // This is likely not needed as we'll redirect to Stripe, but kept as a fallback
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-card rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Unable to initialize checkout</h2>
          <p className="mb-4">Please try again later or contact support.</p>
          <button 
            onClick={() => setLocation('/')}
            className="w-full px-4 py-2 text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // If we have a client secret (for direct payment integration, not redirect)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
}