import { useNetwork } from 'wagmi';

export function useChain() {
  const { chain, chains } = useNetwork();

  return chain ?? chains.at(0);
}
