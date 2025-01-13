// SPDX-License-Identifier: MIT
pragma solidity >=0.8 <0.9;

library Sets {
    struct Set {
        mapping(bytes32 => bytes32) elements;
        uint256 count;
    }

    bytes32 private constant HEAD = bytes32(uint256(1));

    /// @notice Initialize the set to its default state.
    function initialize(Set storage set) internal {
        require(set.elements[HEAD] == bytes32(0), "Set already initialized");
        set.elements[HEAD] = HEAD;
    }

    /// @notice Get the most recent element in the set.
    /// @return The most recent element.
    function getTail(Set storage set) internal view returns (bytes32) {
        bytes32 tailElement = set.elements[HEAD];
        require(
            tailElement != bytes32(0) && tailElement != HEAD,
            "Set is uninitialized or empty"
        );
        return tailElement;
    }

    /// @notice Get the previous element linked to a specified element.
    /// @param element The element to find the predecessor for.
    /// @return The previous element.
    function getPrevious(Set storage set, bytes32 element) internal view returns (bytes32) {
        require(element != bytes32(0), "Element must not be zero");
        return set.elements[element];
    }

    /// @notice Add a new element to the set.
    /// @param element The element to add to the set.
    function insert(Set storage set, bytes32 element) internal {
        require(
            element != bytes32(0) && element != HEAD && set.elements[element] == bytes32(0),
            "Element is invalid or already exists"
        );
        set.elements[element] = set.elements[HEAD];
        set.elements[HEAD] = element;
        set.count++;
    }

    /// @notice Remove an element from the set.
    /// @param prevElement The element that links to the element being removed.
    /// @param element The element to remove from the set.
    function remove(Set storage set, bytes32 prevElement, bytes32 element) internal {
        require(
            element == set.elements[prevElement],
            "prevElement must link to the element"
        );
        require(
            element != bytes32(0) && element != HEAD,
            "Invalid element during deletion"
        );
        set.elements[prevElement] = set.elements[element];
        delete set.elements[element];
        set.count--;
    }

    /// @notice Check if an element exists in the set.
    /// @param element The element to check for existence.
    /// @return True if the element exists, false otherwise.
    function exists(Set storage set, bytes32 element) internal view returns (bool) {
        return set.elements[element] != bytes32(0);
    }

    /// @notice Convert the set to an array. 
    /// @return An array containing all elements in the set.
    function convertToArray(Set storage set) internal view returns (bytes32[] memory) {
        if (set.count == 0) {
            return new bytes32[](0);
        }

        bytes32[] memory array = new bytes32[](set.count);
        bytes32 currentElement = set.elements[HEAD];
        
        for (uint256 i = 0; i < set.count; i++) {
            array[i] = currentElement;
            currentElement = set.elements[currentElement];
        }
        return array;
    }
}