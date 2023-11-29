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
  let user = users.get(userId) || { id: userId, walletAddresses: [] };

  const walletAddresses = new Set(user.walletAddresses);
  walletAddresses.add(walletAddress);

  users.set(userId, { ...user, walletAddresses: Array.from(walletAddresses) });
}

// Function to create or update a nounce
export async function upsertNounce(id: string, userId: string | null) {
  let nounce = nounces.get(id) || { id };

  if (userId) {
    nounce.userId = userId;
  }

  nounces.set(id, nounce);
  return nounce;
}
