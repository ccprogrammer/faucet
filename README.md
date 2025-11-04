# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

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
