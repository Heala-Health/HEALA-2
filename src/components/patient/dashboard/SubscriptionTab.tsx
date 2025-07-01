
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UserSubscription {
  id: string;
  plan_name: string;
  status: string;
  next_payment_date?: string;
  amount: number;
}

export const SubscriptionTab: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [userPlan, setUserPlan] = useState<string>('basic');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Get user's current subscription plan from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_plan')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserPlan(profile?.subscription_plan || 'basic');

      // Check for active subscription record
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError && subError.code !== 'PGRST116') throw subError;
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = async () => {
    if (!user) return;

    setUpgrading(true);
    try {
      console.log('Initializing premium upgrade payment for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user.email,
          amount: 5000,
          metadata: {
            user_id: user.id,
            purpose: 'subscription_upgrade',
            plan: 'premium'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Payment initialization response:', data);

      if (data.status && data.data && data.data.authorization_url) {
        // Store pending upgrade info
        sessionStorage.setItem('pending_subscription_upgrade', JSON.stringify({
          plan: 'premium',
          amount: 5000,
          user_id: user.id
        }));
        
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpgrading(false);
    }
  };

  const isPremium = userPlan === 'premium' || currentSubscription?.plan_name.toLowerCase() === 'premium';

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Manage Subscription
        </h1>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading subscription details...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Manage Subscription
        </h1>
      </div>

      {/* Current Subscription Status */}
      {isPremium && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800">Premium Plan</h3>
                <p className="text-green-600">₦5,000/month</p>
                {currentSubscription?.next_payment_date && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-2">
              <Star className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Free</CardTitle>
            <div className="text-4xl font-bold">
              ₦0
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>2 free in-person bookings</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Limited chat bot use</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              variant="outline"
              disabled={!isPremium}
            >
              {!isPremium ? 'Current Plan' : 'Downgrade to Free'}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-blue-500 shadow-lg">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-blue-500 text-white px-3 py-1">Most Popular</Badge>
          </div>
          
          <CardHeader className="text-center pb-4 pt-6">
            <div className="flex justify-center mb-2">
              <Crown className="w-8 h-8 text-blue-500" />
            </div>
            <CardTitle className="text-2xl font-bold">Premium</CardTitle>
            <div className="text-4xl font-bold">
              ₦5,000
              <span className="text-lg font-normal text-gray-600">/month</span>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Priority booking</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Unlimited in-person booking</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Unlimited chat bot use</span>
              </li>
            </ul>
            
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isPremium || upgrading}
              onClick={handleUpgradeToPremium}
            >
              {upgrading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : isPremium ? (
                'Current Plan'
              ) : (
                'Upgrade to Premium'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
