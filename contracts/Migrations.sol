// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

/// @title Truffle Migrations contract
/// @notice Tracks the last completed migration during deployments.
contract Migrations {
  address public owner = msg.sender;
  uint public last_completed_migration;

  /// @notice Restricts the function to the current owner.
  modifier restricted() {
    require(
      msg.sender == owner,
      "This function is restricted to the contract's owner"
    );
    _;
  }

  /// @notice Mark a migration step as completed.
  /// @param completed The migration number that has been executed.
  function setCompleted(uint completed) public restricted {
    last_completed_migration = completed;
  }
}
