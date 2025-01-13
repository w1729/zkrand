'use client';

import {
  AlertCircle,
  AlertTriangle,
  DicesIcon,
  Loader2,
  UserIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useIsClient, useLocalStorage } from 'usehooks-ts';
import { Hex } from 'viem';
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { zkvrfABI } from '~/abis/ZKRANDOM';
import { Container } from '~/components/Container';
import { RequestsTable } from '~/components/RequestsTable';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Separator } from '~/components/ui/separator';
import { ToastAction } from '~/components/ui/toast';
import { useToast } from '~/components/ui/use-toast';
import { useChain } from '~/hooks/useChain';
import { useOperatorRequests } from '~/hooks/useRequests';
import { formatOperator } from '~/lib/address';
import { ZKVRF_ADDRESS } from '~/lib/constants';
import { P, poseidon } from '~/lib/poseidon';

export default function OperatorPage() {
  const isClient = useIsClient();
  const [operator, setOperator] = useLocalStorage<Hex | null>('operator', null);

  const { data: operatorPublicKey, isLoading } = useSWR(
    operator,
    (privateKey) => poseidon([BigInt(privateKey)])
  );

  if (!isClient) {
    return null;
  }

  if (!operator) {
    return (
      <Container className="space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-serif text-3xl font-medium tracking-tight">
            Operator
          </h2>
        </div>
        <OperatorSignup onSuccess={setOperator} />
      </Container>
    );
  }

  return (
    <Container className="space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-3xl font-medium tracking-tight">
          Operator{' '}
          <span
            title={operatorPublicKey}
            className="font-mono text-xl tabular-nums"
          >
            {isLoading ? '…' : formatOperator(operatorPublicKey)}
          </span>
        </h2>
        <Button
          variant="destructive"
          onClick={() => {
            if (
              confirm('You will need to connect again with your operator key')
            ) {
              return setOperator(null);
            }
          }}
        >
          Forget Key
        </Button>
      </div>
      <OperatorRequests operator={operator} />
    </Container>
  );
}

function OperatorRequests({ operator }: { operator: Hex }) {
  const { data: operatorPublicKey } = useSWR(operator, (privateKey) =>
    poseidon([BigInt(privateKey)])
  );

  const { data, mutate: refresh } = useOperatorRequests({
    operator: operatorPublicKey,
  });

  const { data: isRegistered, isLoading } = useContractRead({
    abi: zkvrfABI,
    address: ZKVRF_ADDRESS,
    functionName: 'isOperator',
    args: [operatorPublicKey!],
    enabled: !!operatorPublicKey,
  });

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <UserIcon size="1rem" className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '…' : isRegistered ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Total Requests
            </CardTitle>
            <DicesIcon size="1rem" className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.requests.length.toLocaleString('en-US')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Open Requests
            </CardTitle>
            <AlertTriangle size="1rem" className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.requests
                .filter((request) => !request.fulfillment)
                .length.toLocaleString('en-US')}
            </div>
          </CardContent>
        </Card>
      </div>
      <Separator />
      <RequestsTable
        requests={data.requests.sort((r1, r2) =>
          BigInt(r1.request.requestId) > BigInt(r2.request.requestId) ? -1 : 1
        )}
        onRefresh={() => refresh()}
      />
    </>
  );
}

function OperatorSignup({ onSuccess }: { onSuccess: (operator: Hex) => void }) {
  return (
    <>
      <p className="text-muted-foreground">
        You need to configure an operator key
      </p>
      <div className="flex items-center gap-2">
        <OperatorSignupFlow onSuccess={onSuccess} />
        or
        <OperatorImportFlow onSuccess={onSuccess} />
      </div>
    </>
  );
}

function OperatorImportFlow({
  onSuccess,
}: {
  onSuccess: (operator: Hex) => void;
}) {
  const [operatorKey, setOperatorKey] = useState<string>();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Import an existing operator key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import an existing operator key</DialogTitle>
          <DialogDescription>
            Enter the private key of your operator here
          </DialogDescription>
        </DialogHeader>

        <Input
          type="text"
          value={operatorKey}
          onChange={(e) => setOperatorKey(e.target.value)}
        />
        <DialogFooter>
          <Button
            className="w-full"
            disabled={
              !operatorKey ||
              !operatorKey.startsWith('0x') ||
              operatorKey.length !== 66
            }
            onClick={
              operatorKey ? () => onSuccess?.(operatorKey as Hex) : undefined
            }
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OperatorSignupFlow({
  onSuccess,
}: {
  onSuccess: (operator: Hex) => void;
}) {
  return (
    <Dialog modal>
      <DialogTrigger asChild>
        <Button>Register a new operator key</Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Register a new operator key</DialogTitle>
          <DialogDescription>
            We generated a new random operator key for you. Keep it safe!
          </DialogDescription>
        </DialogHeader>
        <OperatorSignupFlowContent onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}

function OperatorSignupFlowContent({
  onSuccess,
}: {
  onSuccess: (operator: Hex) => void;
}) {
  const chain = useChain();
  const { toast } = useToast();
  const operatorPrivateKey = useMemo(() => {
    for (;;) {
      const candidate = BigInt(
        `0x${Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
          'hex'
        )}`
      );
      if (candidate < P) {
        return candidate;
      }
    }
  }, []);

  const { data: operatorPublicKey } = useSWR(
    operatorPrivateKey.toString(),
    (privateKey) => poseidon([BigInt(privateKey)])
  );

  const { config, error: prepareError } = usePrepareContractWrite({
    abi: zkvrfABI,
    address: ZKVRF_ADDRESS,
    args: [operatorPublicKey!],
    functionName: 'registerOperator',
    enabled: !!operatorPublicKey,
  });

  const {
    isLoading,
    data,
    write,
    error: writeError,
  } = useContractWrite(config);

  const { isSuccess, isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      toast({
        title: 'Operator key registered successfully',
        action: (
          <ToastAction altText="Check transaction" asChild>
            <Link
              href={`${chain?.blockExplorers?.default.url}/tx/${data?.hash}`}
              target="_blank"
            >
              Check transaction
            </Link>
          </ToastAction>
        ),
      });
      onSuccess?.(`0x${operatorPrivateKey.toString(16)}`);
    },
  });

  if (isSuccess) {
    return (
      <>
        <p>Your operator key has been registered successfully!</p>
        <DialogFooter>
          <Button className="w-full">Close</Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <Input value={`0x${operatorPrivateKey.toString(16)}`} readOnly />
      <p className="text-muted-foreground text-sm">
        This private key corresponds to the following public key which will
        publicly identify your operator:
      </p>
      <code className="block break-all">{operatorPublicKey}</code>
      {(!!prepareError?.message || !!writeError?.message) && (
        <Alert className="max-h-40 overflow-auto" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="break-all">
            {prepareError?.message ?? writeError?.message}
          </AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button
          className="w-full"
          disabled={!write || isLoading || isConfirming}
          onClick={write}
        >
          {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register with this key
        </Button>
      </DialogFooter>
    </>
  );
}
