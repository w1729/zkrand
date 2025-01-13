import { Container } from './Container';
import { ModeToggle } from './ModeToggle';
import { WalletButton } from './WalletButton';
import Link from 'next/link';
import { ReactNode } from 'react';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <header className="border-b">
        <Container className="flex min-h-[4rem] items-center">
          <div className="flex flex-grow items-center gap-8">
            <Link href="/" className="font-serif text-xl font-medium">
              <span className="mr-1">⚡</span> AncientZKRand
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <Link className="hover:underline" href="/">
              Dashboard
            </Link>
            <Link className="hover:underline" href="/request">
              Request
            </Link>
            <Link className="hover:underline" href="/operator">
              Operator
            </Link>
            <div className="flex items-center gap-4">
              <WalletButton />
              <ModeToggle />
            </div>
          </div>
        </Container>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
