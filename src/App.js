/**
 * @fileoverview Faucet dApp - A decentralized application for managing a cryptocurrency faucet.
 * 
 * This component provides a user interface for interacting with a smart contract faucet
 * that allows users to deposit and withdraw funds. It integrates with MetaMask and
 * Ganache for Ethereum blockchain interactions.
 * 
 * @requires react - React hooks for component state and lifecycle management
 * @requires web3 - Web3.js library for Ethereum blockchain interaction
 * @requires @metamask/detect-provider - Utility for detecting Ethereum providers
 * @requires ./utils/load-contract - Helper function for loading Truffle contract artifacts
 */

import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Web3 from "web3";
import detectEthereumProvider from '@metamask/detect-provider'
import { loadContract } from "./utils/load-contract";


/**
 * React root component for the Faucet dApp UI.
 *
 * This component manages the complete lifecycle of connecting to an Ethereum provider
 * (MetaMask or Ganache), loading the deployed Faucet smart contract, tracking wallet
 * account state, and providing UI controls for depositing and withdrawing funds.
 *
 * @component
 * @returns {JSX.Element} The rendered Faucet dApp interface
 *
 * @example
 * // The component automatically detects providers and loads contracts on mount
 * <App />
 */
function App() {
  /**
   * State object containing Web3 provider, instance, and contract references.
   * 
   * @type {Object}
   * @property {Object|null} provider - EIP-1193 compatible provider (MetaMask, Ganache, etc.)
   * @property {boolean} isProviderLoaded - Flag indicating if provider detection is complete
   * @property {Web3|null} web3 - Web3.js instance initialized with the provider
   * @property {Object|null} contract - Truffle contract instance for the deployed Faucet contract
   */
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null
  })

  /**
   * Current balance of the faucet contract in ETH.
   * 
   * @type {string|null} - Balance as a string (e.g., "1.5") or null if not loaded
   */
  const [balance, setBallance] = useState(null)

  /**
   * Currently connected Ethereum account address.
   * 
   * @type {string|null} - Hexadecimal address (0x...) or null if no account connected
   */
  const [account, setAccount] = useState(null)

  /**
   * Toggle flag used to trigger balance reloads after transactions.
   * 
   * @type {boolean} - Boolean flag that toggles to trigger useEffect dependencies
   */
  const [shouldReload, reload] = useState(false)

  /**
   * Computed flag indicating if the user can interact with the contract.
   * 
   * @type {boolean} - True if both account and contract are available
   */
  const canConnectToContract = account && web3Api.contract

  /**
   * Callback function to trigger a balance reload by toggling shouldReload.
   * 
   * @type {Function}
   * @returns {void}
   */
  const reloadEffect = useCallback(() => reload(!shouldReload), [shouldReload])

  /**
   * Registers event listeners on the Ethereum provider to handle account and network changes.
   * 
   * Sets up three critical event listeners:
   * 1. accountsChanged - Fires when user switches accounts or disconnects
   * 2. chainChanged - Fires when user switches networks (e.g., Mainnet to Ropsten)
   * 3. disconnect - Fires when MetaMask disconnects from the dApp
   * 
   * @param {Object} provider - EIP-1193 compatible provider instance (e.g., window.ethereum from MetaMask)
   * @returns {void}
   * 
   * @example
   * // Called automatically when provider is detected
   * setAccountListener(window.ethereum)
   */
  const setAccountListener = provider => {
    /**
     * Listener for account changes (switching accounts or disconnecting).
     * 
     * @param {string[]} accounts - Array of connected account addresses
     */
    provider.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        // User disconnected MetaMask or locked their wallet - clear account state
        setAccount(null)
      } else {
        // User switched to a different account - reload page to refresh all state
        window.location.reload()
      }
    })

    /**
     * Listener for network/chain changes.
     * Reloads the page when user switches networks to ensure contract address
     * matches the current network.
     * 
     * @param {string} chainId - The new chain ID (hex format)
     */
    provider.on("chainChanged", _ => window.location.reload())

    /**
     * Listener for provider disconnection events.
     * Clears account state when MetaMask disconnects from the dApp.
     */
    provider.on("disconnect", () => {
      setAccount(null)
    })
  }

  /**
   * Effect hook: Detects Ethereum provider and initializes Web3 connection.
   * 
   * This effect runs once on component mount to:
   * 1. Detect if an Ethereum provider (MetaMask, Ganache, etc.) is available
   * 2. Load the deployed Faucet contract artifact
   * 3. Initialize Web3.js instance with the provider
   * 4. Register event listeners for account/network changes
   * 5. Update state to indicate provider detection is complete
   * 
   * @effect Runs once on mount (empty dependency array)
   * @returns {void}
   */
  useEffect(() => {
    /**
     * Async function to detect and initialize the Ethereum provider.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadProvider = async () => {
      // Detect if any Ethereum provider is available in the browser
      const provider = await detectEthereumProvider()

      if (provider) {
        // Provider detected - proceed with initialization
        // Load the Faucet contract using the provider
        const contract = await loadContract("Faucet", provider)
        
        // Register event listeners for account/network changes
        setAccountListener(provider)
        
        // Initialize Web3 API state with provider, Web3 instance, and contract
        setWeb3Api({
          web3: new Web3(provider),        // Create Web3.js instance
          provider,                        // Store provider reference
          contract,                        // Store contract instance
          isProviderLoaded: true           // Mark detection as complete
        })
      } else {
        // No provider detected - inform user and mark as loaded to show UI
        setWeb3Api(api => ({...api, isProviderLoaded: true}))
        console.error("Please, install Metamask.")
      }
    }

    // Execute provider detection on mount
    loadProvider()
  }, []) // Empty dependency array ensures this runs only once on mount

  /**
   * Effect hook: Loads and displays the faucet contract's current balance.
   * 
   * This effect fetches the contract's ETH balance whenever:
   * - The contract becomes available (after provider initialization)
   * - The shouldReload flag toggles (after transactions)
   * - The web3Api state changes
   * 
   * The balance is fetched in wei and converted to ether for display.
   * 
   * @effect Runs when web3Api or shouldReload changes
   * @returns {void}
   */
  useEffect(() => {
    /**
     * Async function to fetch the contract balance from the blockchain.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadBalance = async () => {
      const { contract, web3 } = web3Api
      
      // Get contract balance in wei (smallest unit of ETH)
      const balance = await web3.eth.getBalance(contract.address)
      
      // Convert from wei to ether and update state
      // fromWei converts: 1000000000000000000 wei -> "1" ether
      setBallance(web3.utils.fromWei(balance, "ether"))
    }

    // Only load balance if contract is available
    web3Api.contract && loadBalance()
  }, [web3Api, shouldReload]) // Re-run when contract becomes available or after transactions

  /**
   * Effect hook: Retrieves and stores the currently connected wallet account.
   * 
   * This effect fetches the active account from the provider whenever:
   * - The Web3 instance becomes available
   * - The provider connection changes
   * 
   * Handles edge cases:
   * - Empty account array (wallet locked or disconnected)
   * - Connection errors (provider unavailable, network issues)
   * 
   * @effect Runs when web3Api.web3 changes
   * @returns {void}
   */
  useEffect(() => {
    /**
     * Async function to fetch the currently selected account from the provider.
     * 
     * Uses Web3.js getAccounts() which returns an array of accounts that the
     * user has authorized for this dApp. The first account is typically the
     * active/default account.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const getAccount = async () => {
      try {
        // Request accounts from the provider
        // Returns array of authorized accounts (e.g., ["0x1234...", "0x5678..."])
        const accounts = await web3Api.web3.eth.getAccounts()
        
        // Handle empty account array (wallet locked, disconnected, or not authorized)
        if (accounts.length === 0) {
          setAccount(null) // Clear account state
        } else {
          // Store the first (active) account
          setAccount(accounts[0])
        }
      } catch (error) {
        // Handle connection errors (provider disconnected, network issues, etc.)
        console.error("Error getting accounts:", error)
        setAccount(null) // Clear account state on error
      }
    }

    // Only fetch account if Web3 instance is available
    web3Api.web3 && getAccount()
  }, [web3Api.web3]) // Re-run when Web3 instance becomes available or changes

  /**
   * Deposits 1 ETH into the faucet contract from the connected account.
   * 
   * This function calls the smart contract's addFunds() function, which is
   * payable and accepts ETH transfers. The transaction sends exactly 1 ETH
   * (converted to wei) to the contract address.
   * 
   * After a successful transaction:
   * - The contract balance increases by 1 ETH
   * - The user's account balance decreases by 1 ETH + gas fees
   * - The UI balance is automatically refreshed
   * 
   * @async
   * @function addFunds
   * @returns {Promise<void>} Resolves when transaction is submitted (not necessarily confirmed)
   * 
   * @throws {Error} If transaction fails (insufficient funds, contract error, etc.)
   * 
   * @example
   * // User clicks "Donate 1 eth" button
   * await addFunds()
   */
  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api
    
    // Call the contract's payable addFunds() function
    // toWei converts: "1" ether -> 1000000000000000000 wei
    await contract.addFunds({
      from: account,                                    // Transaction sender
      value: web3.utils.toWei("1", "ether")           // Amount to send (1 ETH in wei)
    })

    // Trigger balance reload to show updated contract balance
    reloadEffect()
  }, [web3Api, account, reloadEffect]) // Memoized with dependencies

  /**
   * Withdraws 0.1 ETH from the faucet contract to the connected account.
   * 
   * This function calls the smart contract's withdraw() function, which transfers
   * ETH from the contract to the caller's address. The contract enforces a maximum
   * withdrawal limit of 0.1 ETH per transaction (defined in the smart contract).
   * 
   * After a successful transaction:
   * - The contract balance decreases by 0.1 ETH
   * - The user's account balance increases by 0.1 ETH (minus gas fees)
   * - The UI balance is automatically refreshed
   * 
   * @async
   * @function withdraw
   * @returns {Promise<void>} Resolves when transaction is submitted (not necessarily confirmed)
   * 
   * @throws {Error} If transaction fails:
   *   - Contract balance insufficient
   *   - Withdrawal amount exceeds 0.1 ETH limit (contract revert)
   *   - Gas estimation fails
   * 
   * @example
   * // User clicks "Withdraw 0.1 eth" button
   * await withdraw()
   */
  const withdraw = async () => {
    const { contract, web3 } = web3Api
    
    // Convert 0.1 ETH to wei for the transaction
    // toWei converts: "0.1" ether -> 100000000000000000 wei
    const withdrawAmount = web3.utils.toWei("0.1", "ether")
    
    // Call the contract's withdraw() function
    await contract.withdraw(withdrawAmount, {
      from: account  // Transaction sender (must match connected account)
    })
    
    // Trigger balance reload to show updated contract balance
    reloadEffect()
  }

  /**
   * Renders the Faucet dApp UI.
   * 
   * The UI conditionally renders based on provider state:
   * - Loading state: Shows "Looking for Web3..." while detecting provider
   * - No provider: Shows warning to install MetaMask
   * - Provider but no account: Shows "Connect Wallet" button
   * - Connected: Shows account address and transaction buttons
   * 
   * @returns {JSX.Element} The complete Faucet dApp interface
   */
  return (
    <>
      <div className="faucet-wrapper">
        <div className="faucet">
          {/* Provider Detection Status */}
          { web3Api.isProviderLoaded ?
            /* Provider detected - show account connection UI */
            <div className="is-flex is-align-items-center">
              <span>
                <strong className="mr-2">Account: </strong>
              </span>
              {/* Account Connection Status */}
              { account ?
                /* Account connected - display address */
                <div>{account}</div> :
                !web3Api.provider ?
                /* No provider detected - show install MetaMask message */
                <>
                  <div className="notification is-warning is-size-6 is-rounded">
                    Wallet is not detected!{` `}
                    <a
                      rel="noreferrer"
                      target="_blank"
                      href="https://docs.metamask.io">
                      Install Metamask
                    </a>
                  </div>
                </> :
                /* Provider available but not connected - show connect button */
                <button
                  className="button is-small"
                  onClick={() =>
                    // Request account access from provider (MetaMask popup)
                    web3Api.provider.request({method: "eth_requestAccounts"})
                  }
                >
                  Connect Wallet
                </button>
              }
            </div> :
            /* Provider detection in progress */
            <span>Looking for Web3...</span>
          }
          
          {/* Contract Balance Display */}
          <div className="balance-view is-size-2 my-4">
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          
          {/* Connection Status Indicator */}
          { !canConnectToContract &&
            <i className="is-block">
              Connect to Ganache
            </i>
          }
          
          {/* Transaction Buttons */}
          {/* Deposit Button: Sends 1 ETH to the contract */}
          <button
            disabled={!canConnectToContract}  // Disabled if account or contract unavailable
            onClick={addFunds}                // Trigger addFunds transaction
            className="button is-link mr-2">
              Donate 1 eth
          </button>
          
          {/* Withdraw Button: Withdraws 0.1 ETH from the contract */}
          <button
            disabled={!canConnectToContract}  // Disabled if account or contract unavailable
            onClick={withdraw}                 // Trigger withdraw transaction
            className="button is-primary">Withdraw 0.1 eth</button>
        </div>
      </div>
    </>
  );
}

export default App;

/**
 * @fileoverview Note: The following cryptographic keys are example/development keys.
 * 
 * DO NOT use these keys in production or with real funds. These are provided
 * for educational purposes only and may be publicly known.
 * 
 * @private
 * @ignore
 */

// Private key 32 byte number
// c0ab562fa567abc1597a9f9c840537342809a387f6d45f5e112d0d074c6875ce

// Public key(Uncompressed) 64 byte number
// 048bd5fbf4bc3d8421b8024229943170babd858b9338552ddccb2fa3da24f867ca071f658662bc263ef3272e15fd10a3abc9533991586f2e93136f548db9cb921f

// Public key(Compressed) 33 byte number
// 038bd5fbf4bc3d8421b8024229943170babd858b9338552ddccb2fa3da24f867ca
