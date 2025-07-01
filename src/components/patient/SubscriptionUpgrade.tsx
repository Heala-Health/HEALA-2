
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

interface UserSubscription {
  id: string;
  plan_name: string;
  status: string;
  next_payment_date?: string;
  amount: number;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 2000,
    currency: 'NGN',
    icon: <Star className="w-6 h-6" />,
    features: [
      'Basic health consultations',
      'Appointment booking',
      'Emergency contacts',
      'Basic transport booking'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    currency: 'NGN',
    icon: <Crown className="w-6 h-6" />,
    popular: true,
    features: [
      'All Basic features',
      'Priority consultations',
      'Advanced health monitoring',
      'Premium transport options',
      'Specialist referrals',
      '24/7 support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 10000,
    currency: 'NGN',
    icon: <Zap className="w-6 h-6" />,
    features: [
      'All Premium features',
      'Family health management',
      'Corporate health plans',
      'Custom health reports',
      'Dedicated account manager',
      'API access'
    ]
  }
];

export const SubscriptionUpgrade: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // You'll need to set these from your environment or settings
  const PAYSTACK_PUBLIC_KEY = "pk_live_c76c7a3791ff85134ea0478b00dc544aafb99738"; // Replace with your actual public key

  useEffect(() => {
    if (user) {
      fetchCurrentSubscription();
    }
  }, [user]);

  const fetchCurrentSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = (plan: SubscriptionPlan) => {
    if (!user) return;

    setProcessingPlan(plan.id);

    // Initialize Paystack payment
    const handler = (window as any).PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: plan.price * 100, // Paystack expects amount in kobo
      currency: plan.currency,
      plan: plan.id, // If you have plan codes in Paystack
      callback: async (response: any) => {
        console.log('Payment successful:', response);
        
        try {
          // Save subscription to database
          const { error } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              plan_name: plan.name,
              amount: plan.price,
              currency: plan.currency,
              status: 'active',
              paystack_subscription_code: response.reference,
              next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
            });

          if (error) throw error;

          toast({
            title: "Subscription Successful!",
            description: `You have successfully subscribed to the ${plan.name} plan.`,
          });

          fetchCurrentSubscription();
        } catch (error) {
          console.error('Error saving subscription:', error);
          toast({
            title: "Error",
            description: "Payment successful but failed to activate subscription. Please contact support.",
            variant: "destructive"
          });
        } finally {
          setProcessingPlan(null);
        }
      },
      onClose: () => {
        setProcessingPlan(null);
        toast({
          title: "Payment Cancelled",
          description: "Your payment was cancelled.",
          variant: "destructive"
        });
      }
    });

    handler.openIframe();
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan_name.toLowerCase() === planName.toLowerCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading subscription details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">{currentSubscription.plan_name}</h3>
                <p className="text-green-600">₦{currentSubscription.amount.toLocaleString()}/month</p>
                {currentSubscription.next_payment_date && (
                  <p className="text-sm text-green-600">
                    Next payment: {new Date(currentSubscription.next_payment_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-2">
                {plan.icon}
              </div>
              <CardTitle>{plan.name}</CardTitle>
              <div className="text-3xl font-bold">
                ₦{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-600">/month</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                className="w-full"
                variant={isCurrentPlan(plan.name) ? "outline" : "default"}
                disabled={isCurrentPlan(plan.name) || processingPlan === plan.id}
                onClick={() => handlePaystackPayment(plan)}
              >
                {processingPlan === plan.id 
                  ? 'Processing...' 
                  : isCurrentPlan(plan.name) 
                    ? 'Current Plan' 
                    : `Subscribe to ${plan.name}`
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paystack Script */}
      <script src="https://js.paystack.co/v1/inline.js"></script>
    </div>
  );
};
