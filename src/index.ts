// src/index.ts
import Fastify from "fastify";
import DiscordOauth from "discord-oauth2";
import { config } from "./config";
import crypto from "crypto";
import cookie from "@fastify/cookie";
import {
  Client,
  Role,
  MessageActionRow,
  MessageButton,
  ButtonInteraction,
  GuildMemberRoleManager,
  CommandInteraction,
  TextChannel,
} from "discord.js";
import { users, nounces, appendWalletAddress, upsertNounce } from "./database";
import { hasMembership } from "./unlock";
import { ethers } from "ethers";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { commands } from "./commands";

const port = process.env.PORT || 8080;

interface GetStatusFromSignatureOptions {
  signature: string;
  userId: string;
}

const fetchStatusFromSignature = async ({
  signature,
  userId,
}: GetStatusFromSignatureOptions) => {
  try {
    const walletAddress = ethers.utils.verifyMessage(
      config.paywallConfig.messageToSign,
      signature
    );
    const status = await hasMembership(walletAddress);
    await appendWalletAddress(userId, walletAddress);
    return {
      status,
      walletAddress,
    };
  } catch (error) {
    console.error("Error in signature verification: ", error);
    return {
      status: false,
      walletAddress: null,
    };
  }
};

const client = new Client({
  intents: ["GUILD_MEMBERS"],
});

const oauth = new DiscordOauth({
  clientId: config.clientId,
  clientSecret: config.clientSecret,
});

const restClient = new REST({
  version: "9",
}).setToken(config.token);

const fastify = Fastify({
  logger: true,
});

fastify.addHook("onClose", async (_, done) => {
  await client.destroy();
  done();
});

fastify.register(cookie, {
  parseOptions: {},
});

async function unlockInteractionHandler(interaction: ButtonInteraction) {
  await interaction.deferReply({
    ephemeral: true,
  });

  let role = await interaction.guild?.roles.fetch(config.roleId);

  const hasRole = (
    interaction.member?.roles as GuildMemberRoleManager
  ).cache.get(role!.id);

  if (hasRole) {
    await interaction.editReply({
      content: `You are already a member of ${config.serverName}, ${interaction.member?.user}. You can send messages.`,
    });
    return;
  }

  const userId = interaction.member?.user.id;
  const user = users.get(userId);

  if (!user) {
    const nounceId = crypto.randomUUID();
    upsertNounce(nounceId, userId || null);

    const checkoutURL = new URL(`/checkout/${nounceId}`, config.host!);

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setStyle("LINK")
        .setLabel("Claim Membership")
        .setURL(checkoutURL.toString())
        .setEmoji("🔑")
    );
    await interaction.editReply({
      content:
        "You need to go through the checkout and claim a membership NFT.",
      components: [row],
    });
    return;
  }

  const walletAddresses = user.walletAddresses || [];

  for (const walletAddress of walletAddresses) {
    const validMembership = await hasMembership(walletAddress);

    if (validMembership) {
      const role =
        interaction.guild?.roles.cache.get(config.roleId) ||
        (await interaction.guild?.roles.fetch(config.roleId));

      await (interaction.member!.roles as GuildMemberRoleManager).add(
        role as Role
      );

      await interaction.editReply({
        content: `You already have a valid ${
          config.serverName
        } Membership. Welcome to ${config.serverName}, ${
          interaction.member!.user
        }. You can start sending messages now. Head over to <#${
          config.unlockedChannelId
        }> and tell us a little more about yourself.`,
      });
      return;
    }
  }
}

async function UnlockCommandHandler(interaction: CommandInteraction) {
  if (interaction.commandName === "ping") {
    return interaction.reply({
      ephemeral: true,
      content: "Pong!",
    });
  }

  if (interaction.commandName === "unlock") {
    await interaction.deferReply({
      ephemeral: true,
    });

    let role = await interaction.guild?.roles.fetch(config.roleId);

    const hasRole = (
      interaction.member?.roles as GuildMemberRoleManager
    ).cache.get(role!.id);

    if (hasRole) {
      await interaction.editReply({
        content: `You are already a member of ${config.serverName}, ${interaction.member?.user}. You can send messages.`,
      });
      return;
    }

    const userId = interaction.member?.user.id;
    const user = users.get(userId);

    if (!user) {
      const nounceId = crypto.randomUUID();
      upsertNounce(nounceId, userId || null);

      const checkoutURL = new URL(`/checkout/${nounceId}`, config.host!);

      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("LINK")
          .setLabel("Claim Membership")
          .setURL(checkoutURL.toString())
          .setEmoji("🔑")
      );
      await interaction.editReply({
        content: `You need to go through the checkout and claim a ${config.serverName} membership NFT.`,
        components: [row],
      });
      return;
    }

    const walletAddresses = user.walletAddresses || [];

    for (const walletAddress of walletAddresses) {
      const validMembership = await hasMembership(walletAddress);

      if (validMembership) {
        const fetchedRole =
          interaction.guild?.roles.cache.get(config.roleId) ||
          (await interaction.guild?.roles.fetch(config.roleId));

        await (interaction.member!.roles as GuildMemberRoleManager).add(
          fetchedRole as Role
        );

        await interaction.editReply({
          content: `You already have a valid ${
            config.serverName
          } Membership. Welcome to ${config.serverName}, ${
            interaction.member!.user
          }. You can start sending messages now. Head over to <#${
            config.unlockedChannelId
          }> and tell us a little more about yourself.`,
        });
        return;
      }
    }
  }
}

fastify.get<{
  Params: {
    nounce: string;
  };
}>("/checkout/:nounce", async (request, response) => {
  fastify.log.info(
    `Checkout request received. Nounce: ${request.params.nounce}`
  );
  const checkoutURL = new URL("/checkout", "https://app.unlock-protocol.com");
  checkoutURL.searchParams.set(
    "paywallConfig",
    JSON.stringify(config.paywallConfig)
  );

  if (request.params.nounce) {
    checkoutURL.searchParams.set(
      "redirectUri",
      new URL(`/access/${request.params.nounce}`, config.host!).toString()
    );
  } else {
    checkoutURL.searchParams.set(
      "redirectUri",
      new URL("/membership", config.host!).toString()
    );
  }

  fastify.log.info(`Redirecting user to: ${checkoutURL.toString()}`);
  return response.redirect(checkoutURL.toString());
});

fastify.get<{
  Params: {
    nounce: string;
  };
  Querystring: {
    signature: string;
  };
}>("/access/:nounce", async (request, response) => {
  const nounce = nounces.get(request.params.nounce);

  if (!nounce) {
    return response.status(404).send({ message: "Nounce not found." });
  }

  const { userId } = nounce;

  const { status, walletAddress } = await fetchStatusFromSignature({
    signature: request.query.signature,
    userId: userId,
  });

  if (!status) {
    fastify.log.warn(`Invalid signature or membership for user ID: ${userId}`);
    const redirectURL = new URL("/membership", config.host!);
    redirectURL.searchParams.set("signature", request.query.signature);
    return response.redirect(redirectURL.toString());
  }

  const { guildId, roleId } = config;
  const guild = await client.guilds.fetch(guildId);
  const member = await guild.members.fetch(userId);
  const role = await guild.roles.fetch(roleId);
  await member.roles.add(role as Role);

  const channel = await guild.channels.fetch(config.channelId);
  if (channel?.type === "GUILD_TEXT") {
    await channel.send({
      content: `Welcome to the ${config.serverName} Community, ${member.user}. You can start sending messages now. Head over to <#${config.unlockedChannelId}> and tell us a little more about yourself.`,
    });
  }

  response.redirect(`https://discord.com/channels/${guildId}`);
  nounces.delete(request.params.nounce);
  return;
});

fastify.get<{
  Querystring: {
    signature: string;
  };
}>("/membership", async (req, res) => {
  if (!req.query.signature) {
    return res
      .status(401)
      .send({ message: "You need signature in the query params" });
  }
  const { signature } = req.query;
  if (!signature) {
    return res.status(401).send({
      message: "You need signature in the query params",
    });
  }
  const { paywallConfig } = config;
  const walletAddress = ethers.utils.verifyMessage(
    paywallConfig.messageToSign,
    signature
  );
  const hasValidMembership = await hasMembership(walletAddress);

  if (hasValidMembership) {
    const discordOauthURL = oauth.generateAuthUrl({
      redirectUri: new URL(`/access`, config.host).toString(),
      scope: ["guilds", "guilds.join", "identify"],
    });

    return res.redirect(discordOauthURL.toString());
  } else {
    return res.redirect(new URL(`/checkout`, config.host!).toString());
  }
});

fastify.get<{
  Querystring: {
    code: string;
  };
}>("/access", async (req, res) => {
  try {
    const code = req.query.code;
    const { guildId, roleId } = config;
    const data = await oauth.tokenRequest({
      code,
      grantType: "authorization_code",
      scope: ["guilds", "guilds.join", "identify"],
      redirectUri: new URL(`/access`, config.host).toString(),
    });

    const user = await oauth.getUser(data.access_token);
    const userGuilds = await oauth.getUserGuilds(data.access_token);
    const userGuildIds = userGuilds.map((guild) => guild.id);
    const guild = await client.guilds.fetch(guildId);
    if (userGuildIds.includes(guildId!)) {
      const member = await guild.members.fetch(user.id);
      const role = await guild.roles.fetch(roleId!);
      await member.roles.add(role!);
    } else {
      await oauth.addMember({
        userId: user.id,
        guildId,
        roles: [roleId],
        botToken: config.token!,
        accessToken: data.access_token,
      });
    }
    const channel = await guild.channels.fetch(config.channelId);

    if (channel?.type === "GUILD_TEXT") {
      await channel.send({
        content: `Welcome to the Unlock Community, ${user}. You can start sending messages now. Head over to <#${config.unlockedChannelId}> and tell us a little more about yourself.`,
      });
    }
    return res.redirect(`https://discord.com/channels/${guildId}`);
  } catch (error: any) {
    fastify.log.error(error.message);
    return res.status(500).send({
      message: `There was an error in accessing ${config.serverName} Discord. Please contact one of the team members.`,
    });
  }
});

fastify.addHook("onReady", async () => {
  try {
    await client.login(config.token);

    await restClient.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    client.on("ready", () => {
      fastify.log.info(`Discord bot connected!`);
    });

    client.on("guildMemberAdd", async (member) => {
      if (member.guild.id !== config.guildId) {
        return;
      }

      let channel = member.guild.channels.cache.get(config.channelId) as
        | TextChannel
        | undefined;
      if (!channel) {
        channel = (await member.guild.channels.fetch(config.channelId)) as
          | TextChannel
          | undefined;
      }

      if (channel && channel.type === "GUILD_TEXT") {
        await channel.send({
          content: `Hello ${member.user}! To join, type the \`/unlock\` command (don't forget the \`/\`) and press return.`,
        });
      }
    });

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isButton() && interaction.customId === "unlock") {
        return unlockInteractionHandler(interaction);
      }
      if (interaction.isCommand()) {
        return UnlockCommandHandler(interaction);
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      fastify.log.error(error.message);
    }
    process.exit(1);
  }
});

fastify.listen(port, "0.0.0.0", async (error, address) => {
  if (error) {
    fastify.log.error(error.message);
    process.exit(0);
  }
  fastify.log.info(`Server listening at ${address}`);
});
