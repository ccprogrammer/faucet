// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// they cannot inherit from other smart contracts
// they can only inherit from other interfaces

// They cannot declare a constructor
// They cannot declare state variables
// all declared functions have to be external

/// @title Faucet interface
/// @notice Defines the public faucet interactions used by clients.
interface IFaucet {
  /// @notice Deposit funds into the faucet.
  function addFunds() external payable;
  /// @notice Withdraw a specified amount from the faucet.
  /// @param withdrawAmount The amount in wei to withdraw.
  function withdraw(uint withdrawAmount) external;
}
