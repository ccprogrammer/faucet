// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/// @title Ownable pattern base contract
/// @notice Provides a simple ownership model with an `onlyOwner` modifier.
contract Owned {
  address public owner;

  /// @notice Set the deployer as the initial owner.
  constructor() {
    owner = msg.sender;
  }

  /// @notice Restrict function usage to the contract owner.
  modifier onlyOwner {
    require(
      msg.sender == owner,
      "Only owner can call this function"
    );
    _;
  }
}
