// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// It's a way for designer to say that
// "any child of the abstract contract has to implmenet speicifed methods"

/// @title Abstract logger utility
/// @notice Provides a common interface and helpers for logging demos.
abstract contract Logger {

  uint public testNum;

  constructor() {
    testNum = 1000;
  }

  /// @notice Must be implemented by children to emit a log value.
  /// @return bytes32 A log payload.
  function emitLog() public pure virtual returns(bytes32);

  /// @notice Internal demo function.
  /// @return uint A constant internal value.
  function test3() internal pure returns(uint) {
    return 100;
  }

  /// @notice External demo function calling an internal helper.
  /// @return uint A constant value.
  function test5() external pure returns(uint) {
    test3();
    return 10;
  }
}
