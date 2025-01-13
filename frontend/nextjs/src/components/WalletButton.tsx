'use client';

import { Button } from './ui/button';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import Avatar from 'boring-avatars';
import { Suspense } from 'react';
import { useAccount } from 'wagmi';

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { open } = useWeb3Modal();

  if (isConnected && !!address) {
    return (
      <button onClick={() => open()}>
        <Suspense>
          <Avatar size={32} name={address} />
        </Suspense>
      </button>
    );
  }

  return (
    <Button variant="outline" onClick={() => open()}>
      Connect Wallet
    </Button>
  );
}
