import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, Clock, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, OrderStatus as Status } from '@shared/schema';

export default function OrderStatus() {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [searchId, setSearchId] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Extract order ID from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    
    if (id) {
      const parsedId = parseInt(id, 10);
      if (!isNaN(parsedId)) {
        setOrderId(parsedId);
        setSearchId(parsedId.toString());
      }
    }
  }, []);

  // Query for order data
  const { 
    data: order, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: orderId !== null,
    refetchInterval: (data) => {
      // Auto refresh every 10 seconds if the order is pending or processing
      if (!data) return false;
      return (data.status === Status.PENDING || data.status === Status.PROCESSING) ? 10000 : false;
    }
  });

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsed = parseInt(searchId, 10);
    if (isNaN(parsed)) {
      toast({
        title: "Invalid Order ID",
        description: "Please enter a valid numeric order ID",
        variant: "destructive",
      });
      return;
    }
    
    setOrderId(parsed);
    // Update URL without full page reload
    const url = new URL(window.location.href);
    url.searchParams.set('order_id', parsed.toString());
    window.history.pushState({}, '', url);
  };

  // Status icon based on order status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case Status.COMPLETE:
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case Status.PROCESSING:
        return <Clock className="h-8 w-8 text-blue-500" />;
      case Status.PENDING:
        return <Clock className="h-8 w-8 text-yellow-500" />;
      case Status.FAILED:
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <QuestionMark className="h-8 w-8 text-gray-500" />;
    }
  };

  // Status color based on order status
  const getStatusClass = (status: string) => {
    switch (status) {
      case Status.COMPLETE:
        return "bg-green-50 text-green-700 border-green-200";
      case Status.PROCESSING:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case Status.PENDING:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case Status.FAILED:
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Order Status</h1>
          <p className="mt-2 text-lg text-gray-600">
            Track the status of your SEO content order
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Find Your Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Enter your order ID"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || isFetching}>
                {(isLoading || isFetching) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  'Find Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-gray-600">Loading order details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                Error Loading Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                We couldn't find an order with ID #{orderId}. Please check the order ID and try again.
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setLocation('/')} variant="outline" className="w-full">
                Return to Homepage
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Order Details */}
        {order && !isLoading && (
          <Card className="shadow-lg border-0">
            <CardHeader className={`border-b ${getStatusClass(order.status)}`}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => refetch()} 
                  disabled={isFetching}
                  className="h-8 px-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  {getStatusIcon(order.status)}
                  <div className="ml-3">
                    <h3 className="font-medium">Status</h3>
                    <p className="capitalize font-semibold">
                      {order.status === Status.PENDING ? 'Awaiting Processing' : order.status}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <h3 className="font-medium">Created</h3>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Topic</h3>
                  <p className="text-lg">{order.topic}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Word Count</h3>
                    <p>{order.wordCount.toLocaleString()} words</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Amount</h3>
                    <p>${(order.price / 100).toFixed(2)}</p>
                  </div>
                </div>
                
                {order.status === Status.COMPLETE && order.content && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-500 mt-1 mr-2" />
                      <div>
                        <h3 className="font-medium">Your Content</h3>
                        <div className="mt-2 prose prose-sm max-h-60 overflow-y-auto border rounded-md p-4 bg-white">
                          {order.content.split('\n\n').map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                          ))}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">Your complete content has been delivered to your email.</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {order.status === Status.PROCESSING && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md text-blue-700">
                    <div className="flex">
                      <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p>
                        Your content is currently being generated. This typically takes 5-10 minutes.
                        We'll send you an email when it's ready.
                      </p>
                    </div>
                  </div>
                )}
                
                {order.status === Status.FAILED && (
                  <div className="mt-4 p-4 bg-red-50 rounded-md text-red-700">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                      <p>
                        We encountered an issue while generating your content.
                        Please contact our support team for assistance.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button onClick={() => setLocation('/')} variant="outline" className="w-full sm:w-auto">
                Return to Homepage
              </Button>
              <Button 
                onClick={() => window.location.href=`mailto:support@contentcraft.com?subject=Question about order #${order.id}`} 
                className="w-full sm:w-auto"
              >
                Contact Support
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

// Helper component for unknown status
function QuestionMark(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}