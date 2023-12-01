// src/unlock.ts
import { ethers } from "ethers";
import { config } from "./config";

// Define the balanceOf function of the ERC-721 contract
const erc721ABI = ["function balanceOf(address owner) view returns (uint256)"];

export async function hasMembership(userAddress: string): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_PROVIDER_URL
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
