// src/commands.ts
import { SlashCommandBuilder } from "@discordjs/builders";
import { Permissions } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong!"),
  new SlashCommandBuilder()
    .setName("sendpanel")
    .setDescription("Send a panel with a button to unlock the server")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the panel to")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(Permissions.FLAGS.ADMINISTRATOR),
].map((command) => command.toJSON());
