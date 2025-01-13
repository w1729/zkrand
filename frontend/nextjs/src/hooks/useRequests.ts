import request, { type RequestDocument, Variables } from 'graphql-request';
import useSWR from 'swr';
import { Address, Hex } from 'viem';

export interface Request {
  operator: Operator;
  request: {
    requestId: bigint;
    requester: Address;
    minBlockConfirmations: number;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: string;
    nonce: bigint;
    callbackGasLimit: number;
  };
  fulfillment: {
    randomness: bigint;
    blockNumber: bigint;
    blockTimestamp: bigint;
    transactionHash: Hex;
    nonce: bigint;
  } | null;
}

export interface Operator {
  id: Hex;
}

const fetcher = ([query, variables]: [RequestDocument, Variables]) => {
  return request<{ requests: Request[]; operators: Operator[] }>(
    ' http://localhost:8000/subgraphs/name/zkvrf-scroll-mainnet',
    query,
    variables
  );
};

export function useRequests() {
  return useSWR(
    [
      `{
        requests(first: 1000, orderBy: id, orderDirection: desc) {
          operator {
            id
          }
          request {
            requestId
            requester
            minBlockConfirmations
            blockNumber
            blockTimestamp
            transactionHash
            nonce
            callbackGasLimit
          }
          fulfillment {
            randomness
            blockNumber
            blockTimestamp
            transactionHash
            nonce
          }
        }
        operators(first: 1000) {
          id
        }
      }`,
    ],
    fetcher,
    {
      fallbackData: { requests: [], operators: [] },
    }
  );
}

export function useOperatorRequests({
  operator,
}: {
  operator: string | undefined;
}) {
  return useSWR(
    () =>
      operator
        ? [
            `query Requests($operator: String) {
        requests(where: {operator: $operator}, first: 1000, orderBy: id, orderDirection: desc) {
          operator {
            id
          }
          request {
            requestId
            requester
            minBlockConfirmations
            blockNumber
            blockTimestamp
            transactionHash
            nonce
            callbackGasLimit
          }
          fulfillment {
            randomness
            blockNumber
            blockTimestamp
            transactionHash
            nonce
          }
        }
        operators(first: 1000) {
          id
        }
      }`,
            { operator },
          ]
        : null,
    fetcher,
    {
      fallbackData: { requests: [], operators: [] },
    }
  );
}
