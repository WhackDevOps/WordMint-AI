import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function OrderStatus() {
  const [orderId, setOrderId] = useState('');
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const { toast } = useToast();
  
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: trackingId ? [`/api/orders/${trackingId}`] : null,
    enabled: !!trackingId,
    staleTime: 10000, // 10 seconds
  });

  const handleCheck = async () => {
    if (!orderId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an order ID',
        variant: 'destructive',
      });
      return;
    }
    
    setTrackingId(orderId);
    refetch();
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500';
      case 'processing':
        return 'text-blue-500';
      case 'complete':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="mt-10">
      <h2 className="text-lg font-medium text-gray-900">Check Order Status</h2>
      <p className="mt-1 text-sm text-gray-500">Enter your order ID to check the status of your content</p>
      
      <div className="mt-4 flex space-x-4">
        <div className="flex-grow">
          <Input 
            type="text" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID"
          />
        </div>
        <Button 
          onClick={handleCheck} 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Track Order
        </Button>
      </div>
      
      {error && (
        <div className="mt-4 text-sm text-red-500">
          Order not found or error occurred. Please check your order ID and try again.
        </div>
      )}
      
      {order && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {order.topic}
            </h3>
            
            <div className="mt-2 sm:flex sm:items-start sm:justify-between">
              <div className="max-w-xl text-sm text-gray-500">
                <p>
                  Status: <span className={`font-semibold ${getStatusClass(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </p>
                <p>Word Count: <span className="font-semibold">{order.wordCount}</span></p>
              </div>
            </div>
            
            {order.content && (
              <div className="mt-5 border-t border-gray-200 pt-5">
                <h3 className="text-sm font-medium text-gray-500">Content</h3>
                <div className="mt-3 prose prose-sm max-w-none text-gray-900">
                  {order.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {(order.status === 'pending' || order.status === 'processing') && (
              <div className="mt-5 text-center text-gray-500 italic">
                Your content will appear here once generation is complete.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
