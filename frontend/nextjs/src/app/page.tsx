'use client';

import { AlertTriangle, DicesIcon, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Container } from '~/components/Container';
import { Randomness } from '~/components/Randomness';
import { RequestsTable } from '~/components/RequestsTable';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { useRequests } from '~/hooks/useRequests';

export default function DashboardPage() {
  const { data, mutate: refresh } = useRequests();
  console.log(data);
  return (
    <Container className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-3xl font-medium tracking-tight">
          Dashboard
        </h2>
        <Button size="sm" asChild>
          <Link href="/operator">Operator</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  <Card className="hover:shadow-lg transition-all duration-300 ease-in-out rounded-lg bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-lg font-semibold">Total Requests</CardTitle>
      <DicesIcon size="1.2rem" className="text-white opacity-80" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-extrabold">
        {data.requests.length.toLocaleString('en-US')}
      </div>
    </CardContent>
  </Card>

  <Card className="hover:shadow-lg transition-all duration-300 ease-in-out rounded-lg bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-lg font-semibold">Open Requests</CardTitle>
      <AlertTriangle size="1.2rem" className="text-white opacity-80" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-extrabold">
        {data.requests.filter((request) => !request.fulfillment).length.toLocaleString('en-US')}
      </div>
    </CardContent>
  </Card>

  <Card className="hover:shadow-lg transition-all duration-300 ease-in-out rounded-lg bg-gradient-to-r from-green-400 via-teal-500 to-blue-500 text-white">
    <CardHeader className="flex flex-row items-center justify-between pb-3">
      <CardTitle className="text-lg font-semibold">Registered Operators</CardTitle>
      <UserIcon size="1.2rem" className="text-white opacity-80" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-extrabold">
        {data.operators.length.toLocaleString('en-US')}
      </div>
    </CardContent>
  </Card>
</div>

      <Separator />
      <Randomness
        onSuccess={() => {
          setTimeout(() => {
            refresh();
          }, 2000);
        }}
      />
      <Separator />
      <RequestsTable
        requests={data.requests.sort((r1, r2) =>
          BigInt(r1.request.requestId) > BigInt(r2.request.requestId) ? -1 : 1
        )}
        onRefresh={() =>
          setTimeout(() => {
            refresh();
          }, 2000)
        }
      />
    </Container>
  );
}
