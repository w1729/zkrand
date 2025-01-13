'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode } from 'react';
import { WagmiConfig } from 'wagmi';
import { wagmiConfig } from '~/lib/wagmi';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
    </NextThemesProvider>
  );
}
