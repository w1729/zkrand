'use client';

import { circuit } from './circuit';
import { Button } from './ui/button';
import { BarretenbergBackend } from '@noir-lang/backend_barretenberg';
import { Noir } from '@noir-lang/noir_js';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import useSWR from 'swr';

export function Prove({
  publicKey,
  privateKey,
  messageHash,
  onSuccess,
}: {
  publicKey: string;
  privateKey: string;
  messageHash: string;
  onSuccess?: (proof: Uint8Array) => void;
}) {
  const { isLoading, mutate: calculateProof } = useProver({
    publicKey,
    privateKey,
    messageHash,
    onSuccess,
  });

  return (
    <Button
      className="w-full"
      disabled={isLoading}
      onClick={() => calculateProof()}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Calculate
      Proof
    </Button>
  );
}

export function useProver({
  publicKey,
  privateKey,
  messageHash,
  onSuccess,
}: {
  publicKey: string;
  privateKey: string;
  messageHash: string;
  onSuccess?: (proof: Uint8Array) => void;
}) {
  const noir = useMemo(() => {
    const backend = new BarretenbergBackend(circuit);
    return new Noir(circuit, backend);
  }, []);

  return useSWR(
    [publicKey, messageHash],
    async ([publicKey, messageHash]) => {
      const data = await noir.generateFinalProof({
        private_key: privateKey,
        public_key: publicKey,
        message_hash: messageHash,
      });

      return data.proof;
    },
    {
      revalidateOnMount: false,
      onSuccess,
      onError(error) {
        console.error(error);
      },
    }
  );
}
