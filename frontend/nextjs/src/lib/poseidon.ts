import { buildPoseidonReference } from 'circomlibjs';
import { Hex } from 'viem';

export const P =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PoseidonHashFn = (inputs: any[]) => Uint8Array;
export type Poseidon = PoseidonHashFn & {
  F: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: (hex: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toString: (input: any, radix: number) => string;
  };
};

let _poseidon: Poseidon;
export async function getPoseidon(): Promise<Poseidon> {
  if (!_poseidon) {
    _poseidon = await buildPoseidonReference();
  }
  return _poseidon;
}

export async function poseidon(
  values: (string | number | bigint)[]
): Promise<Hex> {
  if (!values.every((value) => BigInt(value) < P)) {
    throw new Error('Invalid field value');
  }
  const p = await getPoseidon();
  return `0x${p.F.toString(p(values), 16).padStart(64, '0')}`;
}
