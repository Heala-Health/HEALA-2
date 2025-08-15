import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WalletService } from '@/services/walletService';
import { supabase } from '@/integrations/supabase/client';

export const PaymentVerification: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    
    if (reference) {
      verifyPayment(reference);
    } else {
      setStatus('failed');
      setMessage('No payment reference found');
    }
  }, []);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference }
      });

      if (error) throw error;

      if (data.status === 'success') {
        // Get pending funding details
        const pendingFunding = sessionStorage.getItem('pending_wallet_funding');
        if (pendingFunding) {
          const { amount, wallet_id } = JSON.parse(pendingFunding);
          
          // Credit wallet
          await WalletService.creditWallet(
            wallet_id,
            amount,
            'Wallet funding via Paystack',
            reference
          );
          
          sessionStorage.removeItem('pending_wallet_funding');
        }

        setStatus('success');
        setMessage(`Payment successful! ₦${data.amount / 100} has been added to your wallet.`);
      } else {
        setStatus('failed');
        setMessage('Payment verification failed');
      }
    } catch (error) {
      setStatus('failed');
      setMessage('Payment verification error');
    }
  };

  const goToWallet = () => {
    window.location.href = '/patient-dashboard?tab=wallet';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-2">Verifying Payment</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <Button onClick={goToWallet} className="w-full">
                Go to Wallet
              </Button>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <Button onClick={goToWallet} variant="outline" className="w-full">
                Back to Wallet
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};