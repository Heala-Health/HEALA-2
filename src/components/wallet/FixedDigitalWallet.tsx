
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
  user_id: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
  status: string;
  balance_after: number;
}

export const FixedDigitalWallet: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWalletData();
      checkPaymentSuccess();
    }
  }, [user]);

  useEffect(() => {
    if (wallet) {
      fetchTransactions();
      setupRealtimeSubscription();
    }
  }, [wallet]);

  const checkPaymentSuccess = () => {
    // Check if we're returning from a successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const status = urlParams.get('status');
    
    if (reference && status === 'success') {
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Your wallet has been funded successfully.",
        duration: 5000,
      });
      
      // Refresh wallet data
      setTimeout(() => {
        fetchWalletData();
      }, 2000);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user || !wallet) return;

    const channel = supabase
      .channel(`wallet_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Wallet update received:', payload);
          if (payload.new) {
            setWallet(payload.new as WalletData);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions'
        },
        (payload) => {
          console.log('New transaction received:', payload);
          fetchTransactions();
          fetchWalletData(); // Refresh wallet balance
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchWalletData = async () => {
    if (!user) return;
    
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Wallet fetch error:', error);
        if (error.code === 'PGRST116') {
          // No wallet found, create one
          await createWallet();
          return;
        }
        throw error;
      }
      
      setWallet(data);
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setError('Failed to load wallet data');
      
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchWalletData();
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user.id,
          balance: 0,
          currency: 'NGN'
        })
        .select()
        .single();

      if (error) {
        console.error('Wallet creation error:', error);
        throw error;
      }
      
      setWallet(data);
      toast({
        title: "Wallet Created",
        description: "Your digital wallet has been created successfully!",
      });
    } catch (error) {
      console.error('Error creating wallet:', error);
      setError('Failed to create wallet');
    }
  };

  const fetchTransactions = async () => {
    if (!wallet) return;

    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Transactions fetch error:', error);
        throw error;
      }
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const validateFundAmount = (amount: string): string | null => {
    const numAmount = parseFloat(amount);
    
    if (!amount || isNaN(numAmount)) {
      return 'Please enter a valid amount';
    }
    
    if (numAmount < 100) {
      return 'Minimum funding amount is ₦100';
    }
    
    if (numAmount > 1000000) {
      return 'Maximum funding amount is ₦1,000,000';
    }
    
    return null;
  };

  const handleFundWallet = async () => {
    const validationError = validateFundAmount(fundAmount);
    if (validationError) {
      toast({
        title: 'Invalid Amount',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    setFunding(true);
    
    try {
      console.log('Initializing Paystack payment for wallet funding');
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user?.email,
          amount: amount * 100, // Convert to kobo
          callback_url: `${window.location.origin}${window.location.pathname}?tab=wallet`,
          metadata: {
            user_id: user?.id,
            wallet_id: wallet?.id,
            purpose: 'wallet_funding',
            original_amount: amount
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Paystack payment initialization response:', data);

      if (data.status && data.data && data.data.authorization_url) {
        // Store the funding attempt for verification
        sessionStorage.setItem('pending_wallet_funding', JSON.stringify({
          amount: amount,
          wallet_id: wallet?.id,
          user_id: user?.id,
          timestamp: new Date().toISOString()
        }));
        
        // Redirect to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }

    } catch (error) {
      console.error('Error funding wallet:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFunding(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    return type === 'credit' ? (
      <ArrowDownLeft className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setRetryCount(0);
              setError(null);
              setLoading(true);
              fetchWalletData();
            }}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Digital Wallet
            {wallet && (
              <Badge variant="outline" className="ml-auto">
                {wallet.currency}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
            </div>
            <p className="text-muted-foreground">Available Balance</p>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter amount (min ₦100)"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  min="100"
                  max="1000000"
                  step="100"
                  disabled={funding}
                />
              </div>
              <Button 
                onClick={handleFundWallet}
                disabled={funding || !fundAmount || !wallet}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {funding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Fund Wallet
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Secure payment powered by Paystack • Protected by SSL encryption
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Transactions
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTransactions}
              disabled={!wallet}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Fund your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleDateString('en-NG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${
                      transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Bal: {formatCurrency(transaction.balance_after)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
