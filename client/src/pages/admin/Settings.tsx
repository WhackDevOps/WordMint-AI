import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
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
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// API Keys form schema
const apiKeysSchema = z.object({
  openaiApiKey: z.string().min(1, { message: "OpenAI API Key is required" }),
  stripeSecretKey: z.string().min(1, { message: "Stripe Secret Key is required" }),
  stripeWebhookSecret: z.string().min(1, { message: "Stripe Webhook Secret is required" }),
});

// Email settings form schema
const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, { message: "SMTP Host is required" }),
  smtpPort: z.string().min(1, { message: "SMTP Port is required" }),
  smtpUser: z.string().min(1, { message: "SMTP Username is required" }),
  smtpPassword: z.string().min(1, { message: "SMTP Password is required" }),
  senderEmail: z.string().email({ message: "Please enter a valid sender email" }),
});

// Pricing form schema
const pricingSchema = z.object({
  pricePerWord: z.string().min(1, { message: "Price per word is required" }),
});

type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;
type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;
type PricingFormValues = z.infer<typeof pricingSchema>;

export default function Settings() {
  const [isSubmittingApiKeys, setIsSubmittingApiKeys] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isSubmittingPricing, setIsSubmittingPricing] = useState(false);
  const { toast } = useToast();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  // Forms
  const apiKeysForm = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      openaiApiKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
    },
    values: settings?.apiKeys as ApiKeysFormValues,
  });

  const emailSettingsForm = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPassword: '',
      senderEmail: '',
    },
    values: settings?.email as EmailSettingsFormValues,
  });

  const pricingForm = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      pricePerWord: '',
    },
    values: settings?.pricing ? {
      pricePerWord: (settings.pricing.pricePerWord / 100).toFixed(2),
    } : undefined,
  });

  // Handle form submissions
  const handleApiKeysSubmit = async (values: ApiKeysFormValues) => {
    setIsSubmittingApiKeys(true);
    
    try {
      await apiRequest('PATCH', '/api/settings/api-keys', values);
      
      toast({
        title: 'Success',
        description: 'API keys saved successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    } catch (error) {
      console.error('Error saving API keys:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save API keys',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingApiKeys(false);
    }
  };

  const handleEmailSettingsSubmit = async (values: EmailSettingsFormValues) => {
    setIsSubmittingEmail(true);
    
    try {
      await apiRequest('PATCH', '/api/settings/email', values);
      
      toast({
        title: 'Success',
        description: 'Email settings saved successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    } catch (error) {
      console.error('Error saving email settings:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save email settings',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handlePricingSubmit = async (values: PricingFormValues) => {
    setIsSubmittingPricing(true);
    
    try {
      // Convert dollars to cents for storage
      const priceInCents = Math.round(parseFloat(values.pricePerWord) * 100);
      
      await apiRequest('PATCH', '/api/settings/pricing', {
        pricePerWord: priceInCents,
      });
      
      toast({
        title: 'Success',
        description: 'Pricing settings saved successfully',
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    } catch (error) {
      console.error('Error saving pricing settings:', error);
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save pricing settings',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingPricing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Settings</h1>
          </div>
        </div>
        
        {/* API Keys Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">API Configuration</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure your API keys for external services.</p>
            
            <div className="mt-6">
              <Form {...apiKeysForm}>
                <form onSubmit={apiKeysForm.handleSubmit(handleApiKeysSubmit)} className="space-y-6">
                  <FormField
                    control={apiKeysForm.control}
                    name="openaiApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OpenAI API Key</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input
                              type="password"
                              className="font-mono text-sm flex-grow"
                              placeholder="sk-..."
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiKeysForm.control}
                    name="stripeSecretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Secret Key</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input
                              type="password"
                              className="font-mono text-sm flex-grow"
                              placeholder="sk_..."
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={apiKeysForm.control}
                    name="stripeWebhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stripe Webhook Secret</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input
                              type="password"
                              className="font-mono text-sm flex-grow"
                              placeholder="whsec_..."
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmittingApiKeys}>
                      {isSubmittingApiKeys ? 'Saving...' : 'Save API Keys'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Email Configuration</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure your email service settings.</p>
            
            <div className="mt-6">
              <Form {...emailSettingsForm}>
                <form onSubmit={emailSettingsForm.handleSubmit(handleEmailSettingsSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpHost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Host</FormLabel>
                            <FormControl>
                              <Input placeholder="smtp.example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpPort"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Port</FormLabel>
                            <FormControl>
                              <Input placeholder="587" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpUser"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Username</FormLabel>
                            <FormControl>
                              <Input placeholder="username@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <FormField
                        control={emailSettingsForm.control}
                        name="smtpPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SMTP Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <FormField
                        control={emailSettingsForm.control}
                        name="senderEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sender Email</FormLabel>
                            <FormControl>
                              <Input placeholder="noreply@contentcraft.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => emailSettingsForm.reset()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingEmail}>
                      {isSubmittingEmail ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Settings */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">Pricing Configuration</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Configure your content generation pricing.</p>
            
            <div className="mt-6">
              <Form {...pricingForm}>
                <form onSubmit={pricingForm.handleSubmit(handlePricingSubmit)} className="space-y-6">
                  <FormField
                    control={pricingForm.control}
                    name="pricePerWord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Per Word (in dollars)</FormLabel>
                        <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              className="pl-7 pr-12"
                              placeholder="0.05"
                            />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">per word</span>
                          </div>
                        </div>
                        <FormDescription>
                          Enter the price in dollars (e.g., 0.05 for 5 cents per word)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="mr-2"
                      onClick={() => pricingForm.reset()}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmittingPricing}>
                      {isSubmittingPricing ? 'Saving...' : 'Save Pricing'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
