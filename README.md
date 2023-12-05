# Discord Integration Unlock Bot

## Overview
This bot integrates a Discord bot with the Unlock Protocol, giving access control for specific channels within a Discord server. Authenticate Discord users' ownership of NFTs associated with Unlock Protocol memberships and automatically grant them corresponding roles.

- **Role Management**: The bot efficiently manages roles based on users' ownership of NFTs tied to Unlock Protocol memberships. It automatically grants or revokes access as needed, ensuring a seamless experience for members. This job diligently scans and updates roles for users who have obtained them through the bot. This meticulous approach ensures that manually assigned roles remain untouched, safeguarding the integrity of your Discord community.

## Environment Setup
1. Create a `.env` file based on the provided `.env.example`.

   - `DISCORD_CLIENT_ID`: Your Discord application's client ID.
   - `DISCORD_CLIENT_SECRET`: Your Discord application's client secret.
   - `DISCORD_BOT_TOKEN`: Your Discord bot's token.
   - `DISCORD_GUILD_ID`: Your Discord server (guild) ID.
   - `DISCORD_ROLE_ID`: The ID of the role to assign in Discord.
   - `DISCORD_CHANNEL_ID`: The ID of the Discord channel for using the unlock command.
   - `UNLOCKED_CHANNEL_ID`: ID of the channel to ping after success, unlocked for NFT owners.
   - `HOST`: Your server's host URL.
   - `PORT`: The port for your server.
   - `GUILD_SERVER_NAME`: The name of your Discord server.
   - `RPC_PROVIDER_URL`: The Ethereum RPC provider URL.

2. Edit the `paywallConfig` in the `src/config.ts` file to add your lock details. Replace the placeholder lock address with your contract's address and update the name and network accordingly.

   ```typescript
   export const paywallConfig: PaywallConfig = {
     messageToSign: `Allow access to your Discord Community`,    // Custom message to sign
     pessimistic: true,
     locks: {
       "0x000000000000000000000000000000000": {                  // Your unlock contract address
         name: "Your Lock Name",                                 // Your lock name
         network: 5,                                             // The network ID your contract is deployed on
         contractAddress: "0x000000000000000000000000000000000", // Your unlock contract address
       },
     },
     metadataInputs: [{ name: "email", type: "email", required: true }],
   };
   ```


## Installation
To install the necessary packages, run:

```bash
npm install
```

## Building the Bot
Build the bot with:

```bash
npm run build
```

## Running the Bot
Start the bot with:

```bash
npm run start
```

## Usage

### Command: `/sendpanel` 

- **Functionality**: The `/sendpanel` command is utilized by Discord administrators to trigger the NFT ownership verification process. This replaces the need for users to type `/unlock`. Upon execution, the bot sends a custom embed with a verification button.

```markdown
            +-------------------------------------+
            | Admin uses `/sendpanel`             |
            +-------------------------------------+
                        |
                        V
            +-------------------------------------+
            | Bot sends an embed with a          |
            | verification button                 |
            +-------------------------------------+
                        |
                        V
            +-------------------------------------+
            | User clicks on the verification     |
            | button in the embed                 |
            +-------------------------------------+
                        |
                        V
            +-------------------------------------+
            | Check if user has role              |
            +-------------------------------------+
               Yes                           No
                |                             |
                |                             |
                V                             V
    +-----------------------------+   +-----------------------------+
    | Confirm existing membership |   | Guide to verify wallet      |
    | and access                  |   | address via checkout        |
    +-----------------------------+   +-----------------------------+
                                                    |
                                                    V
                                      +-----------------------------+
                                      | User interacts with         |
                                      | checkout flow               |
                                      +-----------------------------+
                                                    |
                                                    V
                                      +-----------------------------+
                                      | User provides signature     |
                                      | to prove ownership          |
                                      +-----------------------------+
                                                    |
                                                    V
                                        +-----------------------+
                                        | Verify signature and  |
                                        | check NFT ownership   |
                                        +-----------------------+
                                                    |
                                                    V
                                        +--------------------------+
                                        | Grant access & Send      |
                                        | welcome message/card     |
                                        +--------------------------+

```

## Troubleshooting
- Check all environment variables for accuracy.
- Confirm the Discord bot has appropriate permissions.
- Ensure the RPC URL points to the correct Ethereum network.

