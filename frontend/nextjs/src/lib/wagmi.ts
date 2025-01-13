import { EIP6963Connector, walletConnectProvider } from '@web3modal/wagmi';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { configureChains, createConfig } from 'wagmi';
import { Chain } from 'wagmi/chains';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';
import { createClient } from 'viem';
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

// Project ID for Web3Modal
const projectId = '2a727e4cc02f0ba45c3d429027b2fad2';

// Ancient8 Testnet - Celestia chain configuration
const ancient8CelestiaTestnet: Chain = {
  id: 28122024,  // Chain ID for Ancient8 Testnet - Celestia
  name: "Ancient8 Testnet - Celestia",
  network: "ancient8",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",  // Currency symbol
  },
  rpcUrls: {
    default: {
      http: ["https://rpcv2-testnet.ancient8.gg"],  // The RPC endpoint for the testnet
    },
    public: {
      http: ["https://rpcv2-testnet.ancient8.gg"],  // You can add other public URLs if available
    },
  },
  blockExplorers: {
    default: {
      name: "Routescan",
      url: "https://ancient8.testnet.routescan.io",  // Block explorer URL
    },
    etherscan: {
      name: "Ancient8 Scan",
      url: "https://scanv2-testnet.ancient8.gg",  // Alternative explorer URL
    },
  },
  testnet: true,  // Indicating that this is a testnet
};

// Configure chains and RPC providers for Ancient8 Testnet - Celestia
const { chains, publicClient } = configureChains(
  [ancient8CelestiaTestnet],
  [
    walletConnectProvider({ projectId }), 
    jsonRpcProvider({
      rpc: (chain) => ({ http: chain.rpcUrls.default.http[0] }),
    }),
  ]
);

// Metadata for the application
const metadata = {
  name: 'zkVRF',
  description: 'Decentralized Verifiable Randomness',
  url: 'https://zkvrf.com',
  icons: [],
};

// Create WAGMI config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new WalletConnectConnector({
      chains,
      options: { projectId, showQrModal: false, metadata },
    }),
    new EIP6963Connector({ chains }),
    new InjectedConnector({ chains, options: { shimDisconnect: true } }),
    new CoinbaseWalletConnector({
      chains,
      options: { appName: metadata.name },
    }),
  ],
  publicClient,
});

// Create Web3 modal with the above config
createWeb3Modal({ wagmiConfig, projectId, chains, defaultChain: chains[0] });
