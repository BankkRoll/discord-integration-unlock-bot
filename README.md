# Discord Integration Unlock Bot

## Overview
This project integrates a Discord bot with with Unlock Protocol to manage access to specific Discord server channels. It verifies Discord users' NFT ownership and grants them roles accordingly.

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
   - `SERVER_NAME`: The name of your Discord server.
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

### Command: `/unlock`

- **Functionality**: The `/unlock` command is designed for Discord users to initiate the process of verifying their NFT ownership and gaining access to exclusive server roles.


```
            +-----------------------------+
            | User types `/unlock`        |
            +-----------------------------+
                        |
                        V
            +-----------------------------+
            | Check if user has role      |
            +-----------------------------+
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
                                    | welcome message          |
                                    +--------------------------+

```

## Troubleshooting
- Check all environment variables for accuracy.
- Confirm the Discord bot has appropriate permissions.
- Ensure the RPC URL points to the correct Ethereum network.

