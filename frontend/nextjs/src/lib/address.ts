import { Address, Hex, getAddress } from 'viem';

export function formatAddress(address?: Address) {
  if (!address) return null;

  const niceAddress = getAddress(address);

  return `${niceAddress.slice(0, 6)}…${niceAddress.slice(-4)}`;
}

export function formatOperator(operator?: Hex) {
  if (!operator) return null;

  return `${operator.slice(0, 12)}…${operator.slice(-10)}`;
}
