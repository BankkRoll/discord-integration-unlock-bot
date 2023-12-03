// src/unlock.ts
import { ethers } from "ethers";
import { config } from "./config";

const erc721ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function getHasValidKey(address _keyOwner) view returns (bool)"
];

export async function hasMembership(userAddress: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(
    config.rpcProviderUrl
  );

  for (const [_, { contractAddress }] of Object.entries(
    config.paywallConfig.locks
  )) {
    try {
      const contract = new ethers.Contract(
        contractAddress,
        erc721ABI,
        provider
      );
      const balance = await contract.balanceOf(userAddress);

      if (balance.gt(0)) {
        return true;
      }
    } catch (error) {
      console.error(
        `Error checking balance for address ${userAddress} on contract ${contractAddress}:`,
        error
      );
    }
  }

  return false;
}

// Verifies if the user has a valid key
export async function doesUserHaveValidKey(userAddress: string, contractAddress: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(config.rpcProviderUrl);
  const contract = new ethers.Contract(contractAddress, erc721ABI, provider);

  return contract.getHasValidKey(userAddress);
}
