# Faucet dApp UI — `src/App.js` Documentation

This document describes the application logic implemented in `src/App.js`. It covers state, effects, user actions, and UI behavior for the faucet dApp UI that interacts with an Ethereum smart contract.

## Overview

`App` is a React component that:

- Detects an Ethereum provider (MetaMask) and initializes Web3.
- Loads the deployed `Faucet` contract artifact and instance.
- Tracks the connected account and the contract’s ETH balance.
- Exposes two actions: donate 1 ETH and withdraw 0.1 ETH.

### External Dependencies

- `web3`: Ethereum RPC client used to query balances and send transactions.
- `@metamask/detect-provider`: Detects an injected EIP-1193 provider (MetaMask).
- `./utils/load-contract`: Fetches `public/contracts/Faucet.json` and returns the deployed Truffle contract instance.

## Component State

- `web3Api`: `{ provider, isProviderLoaded, web3, contract }`
  - `provider`: EIP-1193 provider (e.g., `window.ethereum`).
  - `isProviderLoaded`: `true` once provider detection completes (found or not).
  - `web3`: Initialized `Web3` instance.
  - `contract`: Deployed `Faucet` contract instance.
- `balance`: Current ETH balance of the `Faucet` contract (string in ETH).
- `account`: Currently selected wallet address.
- `shouldReload`: Boolean toggle to trigger reactive balance reloads.

### Derived Values

- `canConnectToContract`: Truthy when both `account` and `web3Api.contract` are available; controls button enabled states.
- `reloadEffect`: A memoized callback that toggles `shouldReload` to refresh the balance.

## Lifecycle Effects

1) Provider/Contract initialization (runs once on mount)

- Detects provider via `detectEthereumProvider()`.
- If found: loads `Faucet` via `loadContract("Faucet", provider)`, sets provider listeners, and initializes Web3.
- If not found: marks provider as loaded and logs a hint to install MetaMask.

2) Balance loader (runs when `web3Api` or `shouldReload` changes)

- When `contract` is set, queries `web3.eth.getBalance(contract.address)`.
- Converts balance from wei to ETH (`web3.utils.fromWei`) and stores it in `balance`.

3) Account resolver (runs when `web3Api.web3` changes)

- Retrieves accounts via `web3.eth.getAccounts()` and stores the first as `account`.

## Provider Event Listeners

- `accountsChanged`: Triggers a full page reload to reflect the new account.
- `chainChanged`: Triggers a full page reload to reflect the new network.

## User Actions

- `addFunds` (async): Sends exactly 1 ETH to the faucet contract.
  - Transaction: `contract.addFunds({ from: account, value: toWei("1", "ether") })`
  - On success: toggles `reloadEffect()` to refresh displayed balance.

- `withdraw` (async): Withdraws exactly 0.1 ETH from the faucet contract.
  - Transaction: `contract.withdraw(toWei("0.1", "ether"), { from: account })`
  - On success: toggles `reloadEffect()` to refresh displayed balance.

## UI Behavior

- If provider detection is pending: shows “Looking for Web3…”.
- If no provider: shows an inline notice with a link to install MetaMask.
- If provider present but no account: shows a "Connect Wallet" button which calls `provider.request({ method: "eth_requestAccounts" })`.
- Displays the connected `account` when available.
- Displays faucet `balance` in ETH.
- Shows a hint to “Connect to Ganache” when a contract/account connection isn’t possible.
- Disables action buttons when `canConnectToContract` is falsy.

## Error Handling & Edge Cases

- Missing provider: UI surfaces guidance to install MetaMask; state marks provider as loaded to stop the spinner.
- Wrong network: `loadContract` logs a descriptive error if `deployed()` lookup fails due to network mismatch.
- Network/account changes: full reload ensures fresh state and connections.

## Extensibility Hints

- Change donation/withdrawal amounts: adjust values used in `addFunds`/`withdraw`.
- Add notifications: wrap transactions with UI toasts and error surfaces.
- Improve reload strategy: replace full page reloads with stateful re-initialization on provider events.
- Support multiple networks: add explicit chain checks and messages before enabling actions.

## Minimal Flow (Pseudo-code)

```js
const provider = await detectEthereumProvider();
const web3 = new Web3(provider);
const faucet = await loadContract("Faucet", provider);
const [account] = await web3.eth.getAccounts();
const balanceWei = await web3.eth.getBalance(faucet.address);

await faucet.addFunds({ from: account, value: web3.utils.toWei("1", "ether") });
await faucet.withdraw(web3.utils.toWei("0.1", "ether"), { from: account });
```

## dApp API & Usage

### Overview

This project is a simple Ethereum faucet dApp. Users can connect a wallet (MetaMask), donate funds to the faucet, and withdraw a limited amount per transaction. The frontend uses Web3 and loads the deployed contract artifact from `public/contracts/Faucet.json`.

### UI Usage

- **Connect Wallet**: Click "Connect Wallet" to connect MetaMask. Network changes and account switches will auto-reload the app.
- **Donate 1 ETH**: Sends 1 ETH to the faucet contract (`addFunds`).
- **Withdraw 0.1 ETH**: Withdraws 0.1 ETH from the faucet (`withdraw`). Each call is limited to 0.1 ETH.
- **Balance**: The dApp displays the current contract balance in ETH.

### Contract API (Faucet)

```solidity
function addFunds() external payable;
function withdraw(uint withdrawAmount) external; // <= 0.1 ether per call
function getAllFunders() external view returns (address[] memory);
function getFunderAtIndex(uint8 index) external view returns (address);
receive() external payable; // accept direct ETH transfers
```

Notes:
- A per-call limit of 0.1 ETH is enforced by the `limitWithdraw` modifier.
- Unique funders are tracked; `getAllFunders` returns the list of first-time funding addresses.

### Programmatic Usage (Frontend)

```js
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import { loadContract } from "./src/utils/load-contract";

(async () => {
  const provider = await detectEthereumProvider();
  const web3 = new Web3(provider);
  const faucet = await loadContract("Faucet", provider);
  const [account] = await web3.eth.getAccounts();

  // Donate 1 ETH
  await faucet.addFunds({
    from: account,
    value: web3.utils.toWei("1", "ether"),
  });

  // Withdraw 0.1 ETH
  const amount = web3.utils.toWei("0.1", "ether");
  await faucet.withdraw(amount, { from: account });
})();
```

### Deployment/Artifacts

- The frontend fetches contract artifacts from `public/contracts/*.json`.
- Ensure you have deployed the contracts to your desired network so that `@truffle/contract` can resolve `deployed()` based on the artifact's network entries.
