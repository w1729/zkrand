'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import Confetti from 'react-confetti';
import { useForm } from 'react-hook-form';
import { useWindowSize } from 'usehooks-ts';
import { Hex, decodeEventLog } from 'viem';
import {
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { z } from 'zod';
import { zkvrfABI } from '~/abis/ZKRANDOM';
import { ZKVRFGlobalConsumerABI } from '~/abis/ZKVRFGlobalConsumer';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { ToastAction } from '~/components/ui/toast';
import { useToast } from '~/components/ui/use-toast';
import { useChain } from '~/hooks/useChain';
import { useRequests } from '~/hooks/useRequests';
import { formatOperator } from '~/lib/address';
import { ZKVRF_CONSUMER_ADDRESS } from '~/lib/constants';

const formSchema = z.object({
  operatorPublicKey: z
    .string()
    .refine(
      (arg): arg is Hex => /^0x[0-9A-Fa-f]{64}$/.test(arg),
      'Not a valid operator key'
    ),
  minBlockConfirmations: z.number().int().positive().min(4),
  callbackGasLimit: z.number().int().positive().min(100000),
});

export function Randomness({ onSuccess }: { onSuccess?: () => void }) {
  const chain = useChain();
  const { data: requestsData, mutate: refresh } = useRequests();

  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minBlockConfirmations: 4,
      callbackGasLimit: 100000,
    },
  });
  const operatorPublicKey = form.watch('operatorPublicKey');
  const minBlockConfirmations = form.watch('minBlockConfirmations');
  const callbackGasLimit = form.watch('callbackGasLimit');

  const { config, error: prepareError } = usePrepareContractWrite({
    abi: ZKVRFGlobalConsumerABI,
    address: ZKVRF_CONSUMER_ADDRESS,
    functionName: 'requestRandomness',
    args: [operatorPublicKey, minBlockConfirmations, callbackGasLimit],
    enabled: form.formState.isValid,
  });

  const { writeAsync, data, error: writeError } = useContractWrite(config);

  const {
    data: receipt,
    isSuccess,
    isLoading: isConfirming,
  } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      toast({
        title: 'Random number requested successfully',
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
      form.reset();
      refresh();
      onSuccess?.();
    },
  });

  const requestId = useMemo(() => {
    if (!receipt?.logs[0]) return null;
    const event = decodeEventLog({
      abi: zkvrfABI,
      eventName: 'RandomnessRequested',
      data: receipt.logs[0].data,
      topics: receipt.logs[0].topics,
    });

    return event.args.requestId;
  }, [receipt]);

  const { width, height } = useWindowSize();
  const [party, setParty] = useState(false);

  const { data: randomNumber } = useContractRead({
    address: ZKVRF_CONSUMER_ADDRESS,
    abi: ZKVRFGlobalConsumerABI,
    functionName: 'fulfilments',
    args: [requestId!],
    enabled: !!requestId,
    watch: true,
  });

  useEffect(() => {
    if (randomNumber) {
      setParty(true);
    }
  }, [randomNumber]);

  async function onSubmit() {
    await writeAsync?.();
  }

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50">
  <CardHeader className="pb-2">
    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
      Shuffle the Odds
    </CardTitle>
    <CardDescription className="text-lg">🔮 Generate a New Random Number!</CardDescription>
  </CardHeader>
  <Form {...form}>
    <form className="contents" onSubmit={form.handleSubmit(onSubmit)}>
      <CardContent className="space-y-6">
        <fieldset
          disabled={form.formState.isSubmitting || isConfirming}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <FormField
            control={form.control}
            name="operatorPublicKey"
            render={({ field }) => (
              <FormItem className="backdrop-blur-sm bg-white/50 p-4 rounded-lg shadow-sm">
                <FormLabel className="font-medium text-gray-700">Operator</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="mt-1.5 border-gray-200 hover:border-gray-300">
                      <SelectValue placeholder="Select an operator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {requestsData.operators.map((operator) => (
                      <SelectItem
                        key={operator.id}
                        value={operator.id}
                        className="tabular-nums hover:bg-gray-50"
                      >
                        {formatOperator(operator.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-sm text-gray-500 mt-1.5">
                  The Operator who should fulfill the request
                </FormDescription>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minBlockConfirmations"
            render={({ field }) => (
              <FormItem className="backdrop-blur-sm bg-white/50 p-4 rounded-lg shadow-sm">
                <FormLabel className="font-medium text-gray-700">Minimum Block Confirmations</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className="mt-1.5 border-gray-200 hover:border-gray-300"
                    onChange={(e) => field.onChange(+e.target.value)}
                  />
                </FormControl>
                <FormDescription className="text-sm text-gray-500 mt-1.5">
                  How long to wait for randomness. Longer is better.
                </FormDescription>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="callbackGasLimit"
            render={({ field }) => (
              <FormItem className="backdrop-blur-sm bg-white/50 p-4 rounded-lg shadow-sm">
                <FormLabel className="font-medium text-gray-700">Callback gas limit</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    className="mt-1.5 border-gray-200 hover:border-gray-300"
                    onChange={(e) => field.onChange(+e.target.value)}
                  />
                </FormControl>
                <FormDescription className="text-sm text-gray-500 mt-1.5">
                  How much gas to send to the callback.
                </FormDescription>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />
        </fieldset>
        {(!!prepareError?.message || !!writeError?.message) && (
          <Alert className="max-h-40 overflow-auto bg-red-50" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="break-all">
              {prepareError?.message ?? writeError?.message}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4">
        <Button 
          disabled={form.formState.isSubmitting || isConfirming}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{' '}
          🎰 Take a Chance! 🎲
        </Button>
        {isSuccess && (
          <Button variant="outline" asChild className="hover:bg-gray-50">
            <Link href="/" target="_blank">
              Check your request on the dashboard
            </Link>
          </Button>
        )}
      </CardFooter>
      {isSuccess && (
        <CardContent className="text-lg font-medium">
          {!randomNumber ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for random number from request {requestId?.toString()}...
            </div>
          ) : (
            <div className="text-center py-4 bg-green-50 rounded-lg text-black">
  🎉 Your random number is{' '}
  <code className="bg-white px-3 py-1 rounded border border-green-200">{randomNumber.toString()}</code>
</div>

          )}
        </CardContent>
      )}
    </form>
  </Form>
  <Confetti
    className="pointer-events-none !fixed z-[100]"
    width={width}
    height={height}
    numberOfPieces={party ? 500 : 0}
    recycle={false}
    onConfettiComplete={(confetti) => {
      setParty(false);
      confetti?.reset();
    }}
  />
</Card>
  );
}
