import { Fragment } from 'react';
import { Order } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface OrderDetailsProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetails({ order, isOpen, onClose }: OrderDetailsProps) {
  if (!order) return null;
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'complete':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Complete</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Order Details</span>
            {getStatusBadge(order.status)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Order ID</h4>
            <p className="mt-1 text-sm text-gray-900">#{order.id}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Date</h4>
            <p className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Customer</h4>
            <p className="mt-1 text-sm text-gray-900">{order.customerEmail}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Amount</h4>
            <p className="mt-1 text-sm text-gray-900">{formatPrice(order.price)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Payment ID</h4>
            <p className="mt-1 text-sm font-mono text-gray-900">{order.stripePaymentIntentId || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">API Cost</h4>
            <p className="mt-1 text-sm text-gray-900">{order.apiCost ? formatPrice(order.apiCost) : 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-500">Topic</h4>
            <p className="mt-1 text-sm text-gray-900">{order.topic}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Content</h4>
          <ScrollArea className="h-60 w-full rounded border border-gray-200 bg-gray-50 p-4">
            <div className="prose prose-sm max-w-none text-gray-900">
              {order.content ? (
                order.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))
              ) : (
                <p className="text-center text-gray-500 italic">
                  {order.status === 'pending' || order.status === 'processing' 
                    ? 'Content generation in progress...' 
                    : 'No content available'}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
