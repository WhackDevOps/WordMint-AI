import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@shared/schema';

export default function OrderSuccess() {
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Extract order ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    
    if (id) {
      setOrderId(parseInt(id, 10));
    }
  }, []);
  
  // Fetch order details based on ID
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: orderId !== null,
  });
  
  if (isLoading || orderId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold">Loading your order details...</h2>
        </div>
      </div>
    );
  }
  
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2 h-5 w-5" />
              Error Loading Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>We couldn't retrieve your order details. The order may have been canceled or there was an error processing your payment.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setLocation('/')} className="w-full">
              Return to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white">
      <Card className="max-w-lg w-full shadow-lg border-0">
        <CardHeader className="bg-green-50 border-b pb-10">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Order Successful!</CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Order Details</h3>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <p className="text-muted-foreground">Order ID:</p>
              <p className="font-medium">{order.id}</p>
              
              <p className="text-muted-foreground">Topic:</p>
              <p className="font-medium">{order.topic}</p>
              
              <p className="text-muted-foreground">Word Count:</p>
              <p className="font-medium">{order.wordCount.toLocaleString()} words</p>
              
              <p className="text-muted-foreground">Amount Paid:</p>
              <p className="font-medium">${(order.price / 100).toFixed(2)}</p>
              
              <p className="text-muted-foreground">Status:</p>
              <p className="font-medium capitalize">
                {order.status === 'pending' ? 'Processing' : order.status}
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">What happens next?</h3>
            <p className="text-blue-700 text-sm">
              Our AI is now generating your content. This typically takes 5-10 minutes to complete. 
              We'll send an email to <span className="font-medium">{order.customerEmail}</span> once 
              your content is ready.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => setLocation('/')} variant="outline" className="w-full sm:w-auto">
            Return to Homepage
          </Button>
          <Button onClick={() => window.location.href=`mailto:support@contentcraft.com?subject=Question about order #${order.id}`} className="w-full sm:w-auto">
            Contact Support
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}