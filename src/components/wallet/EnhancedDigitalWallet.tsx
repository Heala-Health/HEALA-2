
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useRetry } from '@/hooks/useRetry';
import { handleError, showSuccess } from '@/lib/errorHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';

interface WalletData {
  id: string;
  balance: number;
  currency: string;
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

export const EnhancedDigitalWallet: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const { executeWithRetry, isRetrying } = useRetry(
    async (fn: () => Promise<void>) => await fn(),
    { maxRetries: 3, initialDelay: 1000 }
  );

  useEffect(() => {
    if (user) {
      fetchWalletData();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    if (wallet) {
      fetchTransactions();
    }
  }, [wallet]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    setConnectionStatus('connecting');
    
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
          table: 'wallet_transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New transaction received:', payload);
          if (payload.new) {
            setTransactions(prev => [payload.new as Transaction, ...prev]);
          }
        }
      )
      .subscribe((status) => {
        setConnectionStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchWalletData = async () => {
    try {
      setError(null);
      
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            await createWallet();
            return;
          }
          throw error;
        }
        
        setWallet(data);
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setError('Failed to load wallet data');
      handleError(error, toast);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert({
          user_id: user?.id,
          balance: 0,
          currency: 'NGN'
        })
        .select()
        .single();

      if (error) throw error;
      setWallet(data);
      showSuccess('Wallet created successfully!', toast);
    } catch (error) {
      console.error('Error creating wallet:', error);
      handleError(error, toast);
    }
  };

  const fetchTransactions = async () => {
    if (!wallet) return;

    try {
      await executeWithRetry(async () => {
        const { data, error } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        setTransactions(data || []);
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      handleError(error, toast);
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
      await executeWithRetry(async () => {
        console.log('Initializing Paystack payment for wallet funding');
        
        const { data, error } = await supabase.functions.invoke('paystack-payment', {
          body: {
            email: user?.email,
            amount: amount,
            metadata: {
              user_id: user?.id,
              wallet_id: wallet?.id,
              purpose: 'wallet_funding'
            }
          }
        });

        if (error) {
          console.error('Supabase function error:', error);
          throw error;
        }

        console.log('Paystack payment initialization response:', data);

        if (data.status && data.data && data.data.authorization_url) {
          sessionStorage.setItem('pending_wallet_funding', JSON.stringify({
            amount: amount,
            wallet_id: wallet?.id,
            user_id: user?.id
          }));
          
          window.location.href = data.data.authorization_url;
        } else {
          throw new Error(data.message || 'Failed to initialize payment');
        }
      });
    } catch (error) {
      console.error('Error funding wallet:', error);
      handleError(error, toast);
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
      <div className="space-y-6">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="list" count={3} />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
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
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-muted-foreground">
            {connectionStatus === 'connected' ? 'Real-time updates enabled' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
        </div>
        
        {isRetrying && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Retrying...</span>
          </div>
        )}
      </div>

      {/* Wallet Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Digital Wallet
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
                disabled={funding || !fundAmount}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {funding ? (
                  <LoadingSpinner size="sm" text="Processing..." />
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
          <CardTitle>Recent Transactions</CardTitle>
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
