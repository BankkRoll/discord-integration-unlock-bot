// src/database.js
const Enmap = require("enmap");

// Enmap for users
export const users = new Enmap({
  name: "users",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: "deep",
});

// Enmap for nounces
export const nounces = new Enmap({
  name: "nounces",
  fetchAll: false,
  autoFetch: true,
  cloneLevel: "deep",
});

// Function to append a wallet address to a user
export async function appendWalletAddress(
  userId: string,
  walletAddress: string
) {
  try {
    if (!userId || !walletAddress) {
      throw new Error("Invalid input data");
    }

    let user = users.get(userId) || { id: userId, walletAddresses: new Set() };
    user.walletAddresses.add(walletAddress);

    users.set(userId, {
      ...user,
      walletAddresses: Array.from(user.walletAddresses),
    });
    console.log(`Wallet address appended to user ${userId}`);
  } catch (error) {
    console.error(`Error appending wallet address: ${error}`);
  }
}

// Function to create or update a nounce
export async function upsertNounce(id: string, userId: string | null = null) {
  try {
    if (!id) {
      throw new Error("Nounce ID is required");
    }

    let nounce = nounces.get(id) || { id };
    if (userId) nounce.userId = userId;

    nounces.set(id, nounce);
    console.log(`Nounce ${id} upserted with userId ${userId}`);
  } catch (error) {
    console.error(`Error in upserting nounce: ${error}`);
  }
}

// Utility function to get a user
export function getUser(userId: string) {
  return users.get(userId);
}

// Utility function to get a nounce
export function getNounce(id: string) {
  return nounces.get(id);
}
