
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getWallet, getWalletTransactions, type WalletTransaction } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';

export const FixedWalletManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    account_name: '',
    account_number: '',
    bank_name: '',
    bank_code: ''
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [fundingAmount, setFundingAmount] = useState('');
  const [funding, setFunding] = useState(false);

  const fetchWalletData = async () => {
    if (!user?.id) return;

    try {
      const wallet = await getWallet(user.id);
      setBalance(wallet.balance);
      
      const walletTransactions = await getWalletTransactions(wallet.id);
      setTransactions(walletTransactions);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      toast({
        title: "Error",
        description: "Failed to load wallet data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWalletData();
    }
  }, [user?.id]);

  const requestWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive"
      });
      return;
    }

    if (parseFloat(withdrawalAmount) > balance) {
      toast({
        title: "Error",
        description: "Insufficient balance for withdrawal.",
        variant: "destructive"
      });
      return;
    }

    if (!bankDetails.account_name || !bankDetails.account_number || !bankDetails.bank_name) {
      toast({
        title: "Error",
        description: "Please fill in all bank details.",
        variant: "destructive"
      });
      return;
    }

    setWithdrawing(true);
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: user?.id,
          amount: parseFloat(withdrawalAmount),
          bank_details: bankDetails
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully. It will be processed within 24-48 hours.",
      });

      setWithdrawalAmount('');
      setBankDetails({
        account_name: '',
        account_number: '',
        bank_name: '',
        bank_code: ''
      });
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      toast({
        title: "Error",
        description: "Failed to process withdrawal request.",
        variant: "destructive"
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const fundWallet = async () => {
    if (!fundingAmount || parseFloat(fundingAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount to fund.",
        variant: "destructive"
      });
      return;
    }

    setFunding(true);
    try {
      // Convert Naira to Kobo (multiply by 100 for Paystack)
      const amountInKobo = Math.round(parseFloat(fundingAmount) * 100);
      
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amountInKobo, // Amount in kobo
          email: user?.email,
          currency: 'NGN'
        }
      });

      if (error) throw error;

      if (data?.authorization_url) {
        // Open Paystack checkout in a new tab
        window.open(data.authorization_url, '_blank');
        
        toast({
          title: "Payment Initiated",
          description: "Paystack payment window opened. Complete the payment to fund your wallet.",
        });
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: "Error",
        description: "Failed to initiate payment.",
        variant: "destructive"
      });
    } finally {
      setFunding(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading wallet...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            ₦{balance.toLocaleString()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Fund Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Amount (₦)</label>
            <Input
              type="number"
              value={fundingAmount}
              onChange={(e) => setFundingAmount(e.target.value)}
              placeholder="Enter amount to fund"
              min="1"
              step="1"
            />
          </div>

          <Button onClick={fundWallet} disabled={funding} className="w-full">
            <CreditCard className="w-4 h-4 mr-2" />
            {funding ? 'Processing...' : 'Fund Wallet'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Request Withdrawal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Withdrawal Amount (₦)</label>
            <Input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Account Name</label>
              <Input
                value={bankDetails.account_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="Full name on account"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Account Number</label>
              <Input
                value={bankDetails.account_number}
                onChange={(e) => setBankDetails(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="10-digit account number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Bank Name</label>
              <Input
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="e.g. Access Bank"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bank Code (Optional)</label>
              <Input
                value={bankDetails.bank_code}
                onChange={(e) => setBankDetails(prev => ({ ...prev, bank_code: e.target.value }))}
                placeholder="e.g. 044"
              />
            </div>
          </div>

          <Button onClick={requestWithdrawal} disabled={withdrawing} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            {withdrawing ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    {transaction.transaction_type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'credit' ? '+' : '-'}₦{transaction.amount.toLocaleString()}
                    </p>
                    <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
