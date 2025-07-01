
import React from 'react';
import { DigitalWallet } from '@/components/wallet/DigitalWallet';

export const WalletTab: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Digital Wallet
      </h2>
      <DigitalWallet />
    </div>
  );
};
