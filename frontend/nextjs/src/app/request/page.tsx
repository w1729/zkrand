'use client';

import { Container } from '~/components/Container';
import { Randomness } from '~/components/Randomness';

export default function OperatorPage() {
  return (
    <Container className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-3xl font-medium tracking-tight">
          Request randomness
        </h2>
      </div>
      <Randomness />
    </Container>
  );
}
