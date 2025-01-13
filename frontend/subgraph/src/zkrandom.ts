import {
  OperatorRegistered as OperatorRegisteredEvent,
  RandomnessFulfilled as RandomnessFulfilledEvent,
  RandomnessRequested as RandomnessRequestedEvent,
} from '../generated/ZKVRF/ZKVRF';

import {
  Operator,
  OperatorRegistered,
  RandomnessFulfilled,
  RandomnessRequested,
  Request,
} from '../generated/schema';

// Handle Operator Registered Event
export function handleOperatorRegistered(event: OperatorRegisteredEvent): void {
  const operatorRegistration = new OperatorRegistered(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  operatorRegistration.operatorPublicKey = event.params.operatorPublicKey;
  operatorRegistration.blockNumber = event.block.number;
  operatorRegistration.blockTimestamp = event.block.timestamp;
  operatorRegistration.transactionHash = event.transaction.hash;

  operatorRegistration.save();

  const operator = new Operator(event.params.operatorPublicKey);
  operator.registration = operatorRegistration.id;

  operator.save();
}

// Handle Randomness Fulfilled Event
export function handleRandomnessFulfilled(
  event: RandomnessFulfilledEvent
): void {
  const randomnessFulfillment = new RandomnessFulfilled(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  randomnessFulfillment.requestId = event.params.requestId;
  randomnessFulfillment.operatorPublicKey = event.params.operatorPublicKey;
  randomnessFulfillment.requester = event.params.requester;
  randomnessFulfillment.nonce = event.params.nonce;
  randomnessFulfillment.randomness = event.params.randomness;
  randomnessFulfillment.blockNumber = event.block.number;
  randomnessFulfillment.blockTimestamp = event.block.timestamp;
  randomnessFulfillment.transactionHash = event.transaction.hash;

  randomnessFulfillment.save();

  const request = Request.load(event.params.requestId.toString());

  if (!request) {
    throw new Error('Request not found');
  }

  request.fulfillment = randomnessFulfillment.id;
  request.save();
}

// Handle Randomness Requested Event
export function handleRandomnessRequested(
  event: RandomnessRequestedEvent
): void {
  const randomnessRequest = new RandomnessRequested(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  );

  randomnessRequest.requestId = event.params.requestId;
  randomnessRequest.operatorPublicKey = event.params.operatorPublicKey;
  randomnessRequest.requester = event.params.requester;
  randomnessRequest.minBlockConfirmations = event.params.minBlockConfirmations;
  randomnessRequest.callbackGasLimit = event.params.callbackGasLimit;
  randomnessRequest.nonce = event.params.nonce;
  randomnessRequest.blockNumber = event.block.number;
  randomnessRequest.blockTimestamp = event.block.timestamp;
  randomnessRequest.transactionHash = event.transaction.hash;

  randomnessRequest.save();

  const request = new Request(event.params.requestId.toString());
  request.request = randomnessRequest.id;
  request.operator = event.params.operatorPublicKey;

  request.save();
}
