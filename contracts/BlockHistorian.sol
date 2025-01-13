// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

contract BlockHistorian {
    mapping(uint256 => bytes32) private blockHashes;

    error BlockHashUnavailable(uint256 blockNumber);
    error BlockNumberOutOfRange(uint256 blockNumber);
    error BlockHashMismatch(bytes32 blockHash);
    error ArrayLengthMismatch();

    /// @notice Retrieve the block hash for a given block number.
    /// If the block number is within the last 256 blocks, the on-chain blockhash is returned.
    /// Otherwise, it fetches from the historical records.
    /// @param blockNumber The block number to query.
    /// @return The block hash.
    function fetchBlockHash(uint256 blockNumber) external view returns (bytes32) {
        if (isRecentBlock(blockNumber)) {
            return blockhash(blockNumber);
        }
        bytes32 storedHash = blockHashes[blockNumber];
        if (storedHash == 0) {
            revert BlockHashUnavailable(blockNumber);
        }
        return storedHash;
    }

    /// @notice Store the block hash for the recent block.
    /// This function will revert if the block number is more than 256 blocks behind the latest block.
    /// @param blockNumber The block number to be recorded.
    function storeRecentBlockHash(uint256 blockNumber) external {
        if (isOutOfRange(blockNumber)) {
            revert BlockNumberOutOfRange(blockNumber);
        }
        blockHashes[blockNumber] = blockhash(blockNumber);
    }

    /// @notice Record the block hash for specified blocks using the RLP encoded header of the subsequent block.
    /// The hash of the next block must be already known.
    /// @param blockNumbers An array of block numbers to record.
    /// @param blockHeaderRLPs An array of RLP serialized block headers for the next blocks.
    function storeOldBlockHashes(
        uint256[] calldata blockNumbers,
        bytes[] calldata blockHeaderRLPs
    ) external {
        validateInputLengths(blockNumbers.length, blockHeaderRLPs.length);

        for (uint256 i = 0; i < blockNumbers.length; i++) {
            verifyBlockHash(blockNumbers[i], blockHeaderRLPs[i]);
            storeHash(blockNumbers[i], blockHeaderRLPs[i]);
        }
    }

    /// @notice Check if a block number is considered recent (within the last 256 blocks).
    /// @param blockNumber The block number to check.
    /// @return True if the block number is recent, false otherwise.
    function isRecentBlock(uint256 blockNumber) internal view returns (bool) {
        return blockNumber >= block.number - 256 && blockNumber <= block.number;
    }

    /// @notice Check if a block number is out of the valid range.
    /// @param blockNumber The block number to check.
    /// @return True if out of range, false otherwise.
    function isOutOfRange(uint256 blockNumber) internal view returns (bool) {
        return blockNumber < block.number - 256 || blockNumber >= block.number;
    }

    /// @notice Validate that two input arrays have the same length.
    /// @param expected The expected length of the arrays.
    /// @param actual The actual length of the arrays.
    function validateInputLengths(uint256 expected, uint256 actual) internal pure {
        if (expected != actual) {
            revert ArrayLengthMismatch();
        }
    }

    /// @notice Verify that the provided block header matches the expected block hash.
    /// @param blockNumber The current block number.
    /// @param blockHeaderRLP The RLP serialized header of the next block.
    function verifyBlockHash(uint256 blockNumber, bytes memory blockHeaderRLP) internal view {
        bytes32 expectedHash = keccak256(blockHeaderRLP);
        bytes32 actualHash = blockHashes[blockNumber + 1];
        
        if (actualHash != expectedHash) {
            revert BlockHashMismatch(expectedHash);
        }
    }

    /// @notice Store the block hash for a specified block.
    /// @param blockNumber The block number to store the hash.
    /// @param blockHeaderRLP The RLP serialized header from which to extract the block hash.
    function storeHash(uint256 blockNumber, bytes memory blockHeaderRLP) internal {
        // Block hash is located at the slice [0x24:0x44] in the RLP serialized header
        bytes32 blockHash = bytes32(blockHeaderRLP[0x24:0x44]);
        blockHashes[blockNumber] = blockHash;
    }
}