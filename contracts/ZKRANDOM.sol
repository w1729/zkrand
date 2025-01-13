// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {Sets} from "./lib/Sets.sol";
import {UltraVerifier} from "../circuits/contract/zkvrf_pkc_scheme/verifier.sol";
import {BlockHashHistorian} from "./BlockHashHistorian.sol";
import {IZKVRFCallback} from "./interfaces/IZKVRFCallback.sol";


contract ZKRANDOM {
    using Sets for Sets.Set;

    struct VRFRequest {
        bytes32 operatorPublicKey;
        uint256 blockNumber;
        uint16 minBlockConfirmations;
        uint32 callbackGasLimit;
        // Seed components:
        address requester;
        uint256 nonce;
    }

    // BN254 field prime
    uint256 public constant P = 
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    address public immutable verifier;
    address public immutable blockHashHistorian;
    Sets.Set private operators;
    uint256 public nextRequestId;

    mapping(uint256 => bytes32) public requests; // VRF request commitments
    mapping(uint256 => uint256) public randomness; // Fulfilled randomnesses
    mapping(address => uint256) public requestNonces; // Nonces used for randomness seeds

    event RandomnessRequested(
        uint256 indexed requestId,
        bytes32 indexed operatorPublicKey,
        address indexed requester,
        uint16 minBlockConfirmations,
        uint32 callbackGasLimit,
        uint256 nonce
    );

    event RandomnessFulfilled(
        uint256 indexed requestId,
        bytes32 indexed operatorPublicKey,
        address indexed requester,
        uint256 nonce,
        uint256 randomness
    );

    event OperatorRegistered(bytes32 indexed operatorPublicKey);

    constructor(address verifier_, address blockHashHistorian_) {
        verifier = verifier_;
        blockHashHistorian = blockHashHistorian_;
        operators.init();
    }

    /// @notice Register an operator public key (permissionless)
    function registerOperator(bytes32 publicKey) external {
        operators.add(publicKey);
        emit OperatorRegistered(publicKey);
    }

    /// @notice Get the total number of registered operators
    function getOperatorsCount() external view returns (uint256) {
        return operators.size;
    }

    /// @notice Check if a public key is registered as an operator
    function isOperator(bytes32 operatorPublicKey) public view returns (bool) {
        return operators.has(operatorPublicKey);
    }

    /// @notice Get a paginated list of operators
    function getOperators(
        bytes32 lastOperator,
        uint256 maxPageSize
    ) external view returns (bytes32[] memory out) {
        Sets.Set storage set = operators;
        out = new bytes32[](maxPageSize);
        bytes32 element = lastOperator == bytes32(0) ? set.tail() : set.prev(lastOperator);
        uint256 i;

        for (; i < maxPageSize; ++i) {
            if (element == bytes32(uint256(1))) {
                break;
            }
            out[i] = element;
            element = set.prev(element);
        }
        assembly {
            mstore(out, i)
        }
    }

    /// @notice Request randomness from an operator
    function requestRandomness(
        bytes32 operatorPublicKey,
        uint16 minBlockConfirmations,
        uint32 callbackGasLimit
    ) external returns (uint256 requestId) {
        require(isOperator(operatorPublicKey), "Unknown operator");

        requestId = nextRequestId++;
        uint256 nonce = requestNonces[msg.sender]++;

        requests[requestId] = keccak256(
            abi.encode(
                operatorPublicKey,
                block.number,
                minBlockConfirmations,
                callbackGasLimit,
                msg.sender,
                nonce
            )
        );

        emit RandomnessRequested(
            requestId,
            operatorPublicKey,
            msg.sender,
            minBlockConfirmations,
            callbackGasLimit,
            nonce
        );
    }

    /// @notice Hash the seed to fit within the BN254 field prime
    function hashSeedToField(
        address requester,
        bytes32 blockHash,
        uint256 nonce
    ) public pure returns (bytes32 hash) {
        hash = keccak256(abi.encode(requester, blockHash, nonce));
        while (uint256(hash) >= P) {
            hash = keccak256(abi.encode(hash));
        }
    }

    /// @notice Operator function to provide verifiable random numbers
    function fulfillRandomness(
        uint256 requestId,
        VRFRequest calldata request,
        bytes32[2] calldata signature,
        bytes calldata snarkProof
    ) external {
        require(randomness[requestId] == 0, "Already fulfilled");
        require(block.number >= request.blockNumber + request.minBlockConfirmations, "Too early!");

        bytes32 requestCommitment = keccak256(
            abi.encode(
                request.operatorPublicKey,
                request.blockNumber,
                request.minBlockConfirmations,
                request.callbackGasLimit,
                request.requester,
                request.nonce
            )
        );
        require(requests[requestId] == requestCommitment, "Invalid request commitment");

        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = request.operatorPublicKey;
        publicInputs[1] = hashSeedToField(
            request.requester,
            BlockHashHistorian(blockHashHistorian).getBlockHash(request.blockNumber),
            request.nonce
        );
        publicInputs[2] = signature[0];
        publicInputs[3] = signature[1];

        require(UltraVerifier(verifier).verify(snarkProof, publicInputs), "Invalid SNARK proof");

        uint256 entropy = (uint256(signature[0]) << 128) | (uint256(signature[1]) & (type(uint128).max - 1));
        uint256 derivedRandomness = uint256(keccak256(abi.encode(entropy)));
        randomness[requestId] = derivedRandomness;

        IZKVRFCallback(request.requester).receiveRandomness{
            gas: request.callbackGasLimit
        }(requestId, derivedRandomness);

        emit RandomnessFulfilled(
            requestId,
            request.operatorPublicKey,
            request.requester,
            request.nonce,
            derivedRandomness
        );
    }
}