import contract from "@truffle/contract";

/**
 * Load a deployed Truffle contract by artifact name using the given provider.
 *
 * @param {string} name - Contract artifact name located under `/public/contracts`.
 * @param {any} provider - EIP-1193 compatible provider (e.g., window.ethereum).
 * @returns {Promise<any>} A promise that resolves to the deployed contract instance.
 */
export const loadContract = async (name, provider) => {
  const res = await fetch(`/contracts/${name}.json`);
  const Artifact = await res.json();

  console.log(`artifact => ${Artifact}`);

  const _contract = contract(Artifact);
  _contract.setProvider(provider);

  let deployedContract = null;
  try {
    deployedContract = await _contract.deployed();
  } catch (e) {
    console.error("You are connected to the wrong network:", e?.message || e);
  }

  return deployedContract;
};
