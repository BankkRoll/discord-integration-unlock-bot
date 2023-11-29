// src/config.ts
export const paywallConfig = {
  messageToSign: `Allow access to the ${process.env.SERVER_NAME!} Discord Community`,
  pessimistic: true,
  locks: {
    "0x127eac9e40b5e713e947af227A827530803eAAC3": {
      name: "Bankkship",
      network: 5,
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
  serverName: process.env.SERVER_NAME!,
  unlockedChannelId: process.env.UNLOCKED_CHANNEL_ID!,
};
