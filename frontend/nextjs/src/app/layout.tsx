import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { Layout } from '~/components/Layout';
import { Providers } from '~/components/Providers';
import { Toaster } from '~/components/ui/toaster';
import './globals.css';

export const metadata: Metadata = {
  title: 'AncientZKRand',
  description: 'decentralized verifiable randomness',
};

import { Domine } from 'next/font/google';

const domine = Domine({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-domine',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${domine.variable}`} suppressHydrationWarning>
      <head />
      <body>
        <Providers>
          <Layout>{children}</Layout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
