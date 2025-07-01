
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

export const DigitalWallet: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundAmount, setFundAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  useEffect(() => {
    if (wallet) {
      fetchTransactions();
    }
  }, [wallet]);

  const fetchWalletData = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching wallet:', error);
        // If no wallet exists, create one
        if (error.code === 'PGRST116') {
          await createWallet();
          return;
        }
        throw error;
      }
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data.",
        variant: "destructive"
      });
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
    } catch (error) {
      console.error('Error creating wallet:', error);
      toast({
        title: "Error",
        description: "Failed to create wallet.",
        variant: "destructive"
      });
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
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleFundWallet = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to fund your wallet.",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(fundAmount);
    if (amount < 100) {
      toast({
        title: "Minimum Amount",
        description: "Minimum funding amount is ₦100.",
        variant: "destructive"
      });
      return;
    }

    setFunding(true);
    try {
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
        // Store the funding amount temporarily for verification
        sessionStorage.setItem('pending_wallet_funding', JSON.stringify({
          amount: amount,
          wallet_id: wallet?.id,
          user_id: user?.id
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
        description: error.message || "Failed to initialize payment. Please try again.",
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading wallet...</span>
          </div>
        </CardContent>
      </Card>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
            </div>
            <p className="text-gray-600">Available Balance</p>
          </div>
          
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="Enter amount (min ₦100)"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="100"
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

          <p className="text-sm text-gray-500 mt-2">
            Secure payment powered by Paystack
          </p>
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
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400">Fund your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    {transaction.transaction_type === 'credit' ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
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
                    <div className="flex items-center gap-2">
                      <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
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
