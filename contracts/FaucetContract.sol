// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Owned.sol";
import "./Logger.sol";
import "./IFaucet.sol";

/**
 * @title Faucet
 * @notice Simple faucet contract allowing anyone to deposit funds and
 *         accounts to withdraw a limited amount per transaction.
 * @dev Inherits ownership control and logging interface.
 */
contract Faucet is Owned, Logger, IFaucet {
  uint public numOfFunders;

  mapping(address => bool) private funders;
  mapping(uint => address) private lutFunders;

  /**
   * @notice Enforces a maximum withdrawal amount of 0.1 ether.
   * @param withdrawAmount The amount requested for withdrawal in wei.
   */
  modifier limitWithdraw(uint withdrawAmount) {
    require(
      withdrawAmount <= 100000000000000000,
      "Cannot withdraw more than 0.1 ether"
    );
    _;
  }

  /// @notice Receive ether sent directly to the contract.
  receive() external payable {}

  /**
   * @notice Example logger implementation.
   * @return bytes32 Static "Hello World" value.
   */
  function emitLog() public override pure returns(bytes32) {
    return "Hello World";
  }

  /**
   * @notice Deposit funds into the faucet. First-time funders are tracked.
   * @dev Increments `numOfFunders` on first funding from an address.
   */
  function addFunds() override external payable {
    address funder = msg.sender;
    test3();

    if (!funders[funder]) {
      uint index = numOfFunders++;
      funders[funder] = true;
      lutFunders[index] = funder;
    }
  }

  /// @notice Owner-only test function for administrative actions.
  function test1() external onlyOwner {
    // some managing stuff that only admin should have access to
  }

  /// @notice Owner-only test function for administrative actions.
  function test2() external onlyOwner {
    // some managing stuff that only admin should have access to
  }

  /**
   * @notice Withdraw funds from the faucet up to the limit.
   * @param withdrawAmount Amount to withdraw in wei (must be <= 0.1 ether).
   */
  function withdraw(uint withdrawAmount) override external limitWithdraw(withdrawAmount) {
    payable(msg.sender).transfer(withdrawAmount);
  }

  /**
   * @notice Get a list of all unique funder addresses.
   * @return address[] Array containing all funder addresses.
   */
  function getAllFunders() external view returns (address[] memory) {
    address[] memory _funders = new address[](numOfFunders);

    for (uint i = 0; i < numOfFunders; i++) {
      _funders[i] = lutFunders[i];
    }

    return _funders;
  }

  /**
   * @notice Get the funder address at a specific index.
   * @param index Index into the internal funders list.
   * @return address The funder address at the given index.
   */
  function getFunderAtIndex(uint8 index) external view returns(address) {
    return lutFunders[index];
  }
}


// const instance = await Faucet.deployed();

// instance.addFunds({from: accounts[0], value: "2000000000000000000"})
// instance.addFunds({from: accounts[1], value: "2000000000000000000"})

// instance.withdraw("500000000000000000", {from: accounts[1]})

// instance.getFunderAtIndex(0)
// instance.getAllFunders()
