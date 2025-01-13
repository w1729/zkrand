'use client';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ToastAction } from './ui/toast';
import { useToast } from './ui/use-toast';
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertCircle,
  CheckIcon,
  ChevronDown,
  ClockIcon,
  LinkIcon,
  Loader2,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import useSWR from 'swr';
import { useLocalStorage } from 'usehooks-ts';
import { Hex, zeroAddress } from 'viem';
import {
  useBlockNumber,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { BlockHashHistorianABI } from '~/abis/BlockHistorian';
import { zkvrfABI } from '~/abis/ZKRANDOM';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { Input } from '~/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { useChain } from '~/hooks/useChain';
import { Request } from '~/hooks/useRequests';
import { formatAddress, formatOperator } from '~/lib/address';
import { ZKVRF_ADDRESS } from '~/lib/constants';
import { poseidon } from '~/lib/poseidon';

const Prove = dynamic(
  () => import('~/components/Prove').then((module) => module.Prove),
  { ssr: false }
);

const columnHelper = createColumnHelper<Request>();

export const columns = [
  columnHelper.accessor((row) => row.request.requestId, {
    id: 'ID',
    header: 'ID',
    cell: (info) => info.getValue().toString(),
  }),
  columnHelper.accessor((row) => row.request.requester, {
    id: 'requester',
    header: 'Requester',
    cell: (info) => formatAddress(info.getValue()),
  }),
  columnHelper.accessor((row) => row.operator.id, {
    id: 'operator',
    header: 'Operator',
    cell: (info) => formatOperator(info.getValue()),
  }),
  columnHelper.accessor((row) => row.fulfillment, {
    id: 'status',
    header: 'Status',
    cell: (info) => (
      <Badge variant="outline">
        {info.getValue() ? (
          <>
            <CheckIcon size="1em" className="mr-1" /> Fulfilled
          </>
        ) : (
          <>
            <ClockIcon size="1em" className="mr-1" /> Open
          </>
        )}
      </Badge>
    ),
  }),
  columnHelper.accessor((row) => row.request.blockTimestamp, {
    id: 'Requested At',
    header: 'Requested At',
    cell: (info) => <RequestLink request={info.row.original} />,
  }),
  columnHelper.accessor((row) => row.fulfillment?.blockTimestamp, {
    id: 'Fulfilled At',
    header: 'Fulfilled At',
    cell: (info) => <FulfillmentLink request={info.row.original} />,
  }),
  columnHelper.accessor((row) => row, {
    id: 'Fulfill Request',
    header: () => null,
    cell: (info) => (
      <Fulfill
        request={info.getValue()}
        // eslint-disable-next-line
        // @ts-ignore
        onSuccess={info.table.options.meta?.refresh}
      />
    ),
  }),
];

export function RequestsTable({
  requests,
  onRefresh,
}: {
  requests: Request[];
  onRefresh?: () => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const [operator] = useLocalStorage<Hex | null>('operator', null);

  const { data: operatorPublicKey } = useSWR(operator, (privateKey) =>
    poseidon([BigInt(privateKey)])
  );

  const table = useReactTable({
    data: requests,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      operatorPublicKey,
      refresh: onRefresh,
    },
  });

  return (
    <div className="w-full space-y-6">
  <div className="flex items-center gap-4 bg-[rgb(210,187,187)] backdrop-blur-sm p-4 rounded-xl shadow-sm">
    <Input
      placeholder="Filter IDs..."
      value={(table.getColumn('ID')?.getFilterValue() as string) ?? ''}
      onChange={(event) =>
        table.getColumn('ID')?.setFilterValue(event.target.value)
      }
      className="max-w-sm bg-transparent border-gray-200 focus:border-gray-300"
    />
    <Button variant="outline" onClick={() => onRefresh?.()} className="hover:bg-gray-50">
      Refresh
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto hover:bg-gray-50">
          Columns <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="shadow-lg">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize hover:bg-gray-50"
                checked={column.getIsVisible()}
                onCheckedChange={(value) =>
                  column.toggleVisibility(!!value)
                }
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <div className="rounded-xl border shadow-sm bg-black">
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id} className="bg-gray-50/50">
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id} className="font-medium text-gray-700">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              className="hover:bg-gray-50/50 transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className="h-24 text-center text-gray-500"
            >
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>

  <div className="flex items-center justify-end space-x-2 bg-black/50 backdrop-blur-sm p-4 rounded-xl shadow-sm">
    <div className="text-gray-500 flex-1 text-sm">
      {table.getFilteredSelectedRowModel().rows.length} of{' '}
      {table.getFilteredRowModel().rows.length} row(s) selected.
    </div>
    <div className="space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="hover:bg-gray-50"
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="hover:bg-gray-50"
      >
        Next
      </Button>
    </div>
  </div>
</div>
  );
}

function FullfillRandomnessFlow({
  request,
  onSuccess,
}: {
  request: Request;
  onSuccess?: () => void;
}) {
  const [operator] = useLocalStorage<Hex | null>('operator', null);

  if (!operator) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Fulfill</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fulfill randomness request</DialogTitle>
          <DialogDescription>
            Generate a verifiable random number and post it to the blockchain
          </DialogDescription>
        </DialogHeader>
        <FullfillRandomnessFlowContent
          request={request}
          operator={operator}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}

function Fulfill({
  request,
  onSuccess,
}: {
  request: Request;
  onSuccess?: () => void;
}) {
  const { data: blockHeight } = useBlockNumber({ watch: true });
  const [operator] = useLocalStorage<Hex | null>('operator', null);

  const { data: operatorPublicKey } = useSWR(operator, (privateKey) =>
    poseidon([BigInt(privateKey)])
  );

  const difference = blockHeight
    ? BigInt(request.request.blockNumber) +
      BigInt(request.request.minBlockConfirmations) -
      blockHeight
    : 0n;

  if (difference > 0n) {
    return <Button disabled>Waiting for {difference.toString()} blocks</Button>;
  }

  if (
    operatorPublicKey &&
    request.operator.id.toLowerCase() === operatorPublicKey.toLowerCase() &&
    !request.fulfillment
  ) {
    return <FullfillRandomnessFlow request={request} onSuccess={onSuccess} />;
  }

  return null;
}

function FulfillmentLink({ request }: { request: Request }) {
  const chain = useChain();
  if (!request.fulfillment) return '–';
  return (
    <Link
      className="flex items-center gap-2 decoration-dotted hover:underline"
      href={`${chain?.blockExplorers?.default.url}/tx/${request.fulfillment.transactionHash}`}
      target="_blank"
    >
      <span>
        {new Date(
          Number(request.fulfillment.blockTimestamp) * 1000
        ).toLocaleString('en-US')}
      </span>

      <LinkIcon className="h-3 w-3" />
    </Link>
  );
}

function RequestLink({ request }: { request: Request }) {
  const chain = useChain();
  return (
    <Link
      className="flex items-center gap-2 decoration-dotted hover:underline"
      href={`${chain?.blockExplorers?.default.url}/tx/${request.request.transactionHash}`}
      target="_blank"
    >
      <span>
        {new Date(Number(request.request.blockTimestamp) * 1000).toLocaleString(
          'en-US'
        )}
      </span>

      <LinkIcon className="h-3 w-3" />
    </Link>
  );
}

function FullfillRandomnessFlowContent({
  request,
  operator,
  onSuccess,
}: {
  request: Request;
  operator: Hex;
  onSuccess?: () => void;
}) {
  const chain = useChain();
  const { toast } = useToast();
  const [proof, setProof] = useState<Uint8Array>();

  const { data: operatorPublicKey, isLoading } = useSWR(
    operator,
    (privateKey) => poseidon([BigInt(privateKey)])
  );

  const { data: blockHashHistorianAddress } = useContractRead({
    abi: zkvrfABI,
    address: ZKVRF_ADDRESS,
    functionName: 'blockHashHistorian',
  });

  const { data: blockHash, error: blockHashError } = useContractRead({
    abi: BlockHashHistorianABI,
    address: blockHashHistorianAddress,
    functionName: 'getBlockHash',
    args: [request.request.blockNumber],
  });

  const { data: messageHash } = useContractRead({
    abi: zkvrfABI,
    address: ZKVRF_ADDRESS,
    functionName: 'hashSeedToField',
    args: [request.request.requester, blockHash!, request.request.nonce],
    enabled: !!blockHash,
  });

  const { data: signature } = useSWR([messageHash], async () => {
    if (!operator || !messageHash) return null;

    return [
      await poseidon([operator, await poseidon([operator, messageHash, 0])]),
      await poseidon([operator, await poseidon([operator, messageHash, 1])]),
    ] as const;
  });

  const { config, error: prepareError } = usePrepareContractWrite({
    abi: zkvrfABI,
    address: ZKVRF_ADDRESS,
    functionName: 'fulfillRandomness',
    args: [
      request.request.requestId,
      {
        operatorPublicKey: request.operator.id,
        blockNumber: request.request.blockNumber,
        minBlockConfirmations: request.request.minBlockConfirmations,
        callbackGasLimit: request.request.callbackGasLimit,
        requester: request.request.requester,
        nonce: request.request.nonce,
      },
      signature!,
      proof ? `0x${Buffer.from(proof).toString('hex')}` : zeroAddress,
    ],
    enabled: !!proof && !!messageHash && !!signature,
  });

  const {
    write,
    data,
    isLoading: isWriting,
    error: writeError,
  } = useContractWrite(config);

  const { isSuccess, isLoading: isConfirming } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess() {
      toast({
        title: 'Fulfillment complete',
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
      onSuccess?.();
    },
  });

  if (blockHashError) {
    return (
      <Alert className="max-h-40 overflow-auto" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="break-all">
          {blockHashError.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (isSuccess) {
    return (
      <>
        <p>Success! You may now close this dialog</p>
      </>
    );
  }

  if (!!proof && !!messageHash && !!signature) {
    return (
      <>
        <p>
          Your proof has been generated. You can now post it to the blockchain.
        </p>
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
            disabled={isWriting || isConfirming}
            onClick={write}
          >
            {isConfirming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{' '}
            Send transaction
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <p>Generating the proof will take a few seconds</p>
      <DialogFooter>
        {isLoading || !messageHash ? (
          <Button className="w-full" disabled>
            Loading…
          </Button>
        ) : (
          <Suspense
            fallback={
              <Button className="w-full" disabled>
                Loading…
              </Button>
            }
          >
            <Prove
              publicKey={operatorPublicKey!}
              privateKey={operator}
              messageHash={messageHash}
              onSuccess={setProof}
            />
          </Suspense>
        )}
      </DialogFooter>
    </>
  );
}
