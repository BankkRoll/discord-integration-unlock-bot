# Discord Integration Unlock Bot

## Overview
This project integrates a Discord bot with with Unlock Protocol to manage access to specific Discord server channels. It verifies Discord users' NFT ownership and grants them roles accordingly.

## Environment Setup
Create a `.env` file based on the provided `.env.example` with the following variables:
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

- **Flow**:
  1. User types `/unlock` in the Discord server.
  2. If the user already has the role, they receive a message confirming their existing membership.
  3. If the user doesn't have the role, they are guided to verify their wallet address.
  4. The user signs a message with their wallet to prove ownership.
  5. The bot verifies the signature, checks for NFT ownership, and grants access accordingly.
  6. The user is notified of their successful access to the server with a welcome message.

## Troubleshooting
- Check all environment variables for accuracy.
- Confirm the Discord bot has appropriate permissions.
- Ensure the RPC URL points to the correct Ethereum network.

