import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2, CreditCard, Banknote } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WalletService } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';

export const EnhancedDigitalWallet: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fundAmount, setFundAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', bankName: '', accountName: '' });
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      const walletData = await WalletService.getWallet(user!.id);
      setWallet(walletData);
      
      const { data: txns } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', walletData.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      setTransactions(txns || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load wallet", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFundWallet = async () => {
    const amount = parseFloat(fundAmount);
    if (amount < 100) {
      toast({ title: "Invalid Amount", description: "Minimum funding is ₦100", variant: "destructive" });
      return;
    }

    setFunding(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          email: user?.email,
          amount: amount * 100, // Paystack expects kobo
          metadata: {
            user_id: user?.id,
            wallet_id: wallet?.id,
            purpose: 'wallet_funding'
          }
        }
      });

      if (error) throw error;

      if (data.status && data.data?.authorization_url) {
        sessionStorage.setItem('pending_wallet_funding', JSON.stringify({
          amount,
          wallet_id: wallet?.id,
          user_id: user?.id
        }));
        
        window.location.href = data.data.authorization_url;
      }
    } catch (error) {
      toast({ title: "Payment Error", description: "Failed to initialize payment", variant: "destructive" });
    } finally {
      setFunding(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (amount < 500 || amount > wallet.balance) {
      toast({ title: "Invalid Amount", description: "Check withdrawal amount and balance", variant: "destructive" });
      return;
    }

    if (!bankDetails.accountNumber || !bankDetails.bankName || !bankDetails.accountName) {
      toast({ title: "Missing Details", description: "Please fill all bank details", variant: "destructive" });
      return;
    }

    setWithdrawing(true);
    try {
      await WalletService.initiateWithdrawal(wallet.id, amount, bankDetails);
      toast({ title: "Withdrawal Requested", description: "Your withdrawal will be processed within 24 hours" });
      setWithdrawAmount('');
      setBankDetails({ accountNumber: '', bankName: '', accountName: '' });
      loadWalletData();
    } catch (error) {
      toast({ title: "Withdrawal Error", description: "Failed to process withdrawal", variant: "destructive" });
    } finally {
      setWithdrawing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading wallet...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Virtual Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(wallet?.balance || 0)}
            </div>
            <p className="text-gray-600">Available Balance</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="fund" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fund">Fund Wallet</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="fund">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Fund Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount (min ₦100)"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                min="100"
              />
              <Button onClick={handleFundWallet} disabled={funding} className="w-full">
                {funding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                {funding ? 'Processing...' : 'Fund with Paystack'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                Withdraw Funds
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="number"
                placeholder="Enter amount (min ₦500)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                min="500"
                max={wallet?.balance}
              />
              <Input
                placeholder="Account Number"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
              />
              <Input
                placeholder="Bank Name"
                value={bankDetails.bankName}
                onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
              />
              <Input
                placeholder="Account Name"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails({...bankDetails, accountName: e.target.value})}
              />
              <Button onClick={handleWithdraw} disabled={withdrawing} className="w-full">
                {withdrawing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUpRight className="w-4 h-4 mr-2" />}
                {withdrawing ? 'Processing...' : 'Request Withdrawal'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {txn.transaction_type === 'credit' ? (
                          <ArrowDownLeft className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{txn.description}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${txn.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.transaction_type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </p>
                        <Badge variant={txn.status === 'completed' ? 'default' : 'secondary'}>
                          {txn.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};