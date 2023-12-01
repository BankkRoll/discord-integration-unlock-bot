// src/config.ts
export interface LockConfig {
  name: string;
  network: number;
  contractAddress: string;
}

export interface PaywallConfig {
  messageToSign: string;
  pessimistic: boolean;
  locks: { [key: string]: LockConfig };
  metadataInputs: Array<{ name: string; type: string; required: boolean }>;
}

export const paywallConfig: PaywallConfig = {
  messageToSign: `Allow access to the Discord Community`,
  pessimistic: true,
  locks: {
    "0x0000000000000000000000000000000000000000": {
      name: "Bankkroll",
      network: 5,
      contractAddress: "0x0000000000000000000000000000000000000000",
    },
  },
  metadataInputs: [{ name: "email", type: "email", required: true }],
};

export const config = {
  paywallConfig,
  clientId: process.env.DISCORD_CLIENT_ID!,
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  host: process.env.HOST!,
  token: process.env.DISCORD_BOT_TOKEN!,
  guildId: process.env.DISCORD_GUILD_ID!,
  roleId: process.env.DISCORD_ROLE_ID!,
  channelId: process.env.DISCORD_CHANNEL_ID!,
  serverName: process.env.GUILD_SERVER_NAME!,
  unlockedChannelId: process.env.UNLOCKED_CHANNEL_ID!,
  rpcProviderUrl: process.env.RPC_PROVIDER_URL!,
};
