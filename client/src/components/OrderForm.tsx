import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

const orderFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters long" }),
  wordCount: z.enum(['500', '1000', '1500', '2000'], { 
    required_error: "Please select a word count" 
  })
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

export default function OrderForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      email: '',
      topic: '',
      wordCount: '500'
    }
  });

  const handleSubmit = async (values: OrderFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create the order request
      const res = await apiRequest('POST', '/api/orders/create', {
        customerEmail: values.email,
        topic: values.topic,
        wordCount: parseInt(values.wordCount)
      });
      
      const data = await res.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrice = (wordCount: string) => {
    const pricePerWord = 0.05; // $0.05 per word
    return (parseInt(wordCount) * pricePerWord).toFixed(2);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="your@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sustainable Gardening Tips" {...field} />
                  </FormControl>
                  <FormDescription>
                    Be specific to get the best results.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="wordCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Word Count</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select word count" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="500">500 words (${getPrice('500')})</SelectItem>
                      <SelectItem value="1000">1000 words (${getPrice('1000')})</SelectItem>
                      <SelectItem value="1500">1500 words (${getPrice('1500')})</SelectItem>
                      <SelectItem value="2000">2000 words (${getPrice('2000')})</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-primary-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-primary-800">Pricing Information</h3>
                  <div className="mt-2 text-sm text-primary-700">
                    <p>Our content is priced at $0.05 per word. You'll only be charged after you proceed to checkout.</p>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
