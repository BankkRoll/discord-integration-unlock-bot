// src/index.ts
import Fastify from "fastify";
import cron from "node-cron";
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
  MessageAttachment,
  FetchMemberOptions,
  FetchMembersOptions,
  UserResolvable,
  MessageEmbed,
} from "discord.js";
import {
  users,
  nounces,
  appendWalletAddress,
  upsertNounce,
  getUser,
} from "./database";
import { doesUserHaveValidKey, hasMembership } from "./unlock";
import { ethers } from "ethers";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { commands } from "./commands";
import { generateWelcomeCard } from "./card";

const port = 25680;

interface GetStatusFromSignatureOptions {
  signature: string;
  userId: string;
}

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
  pluginTimeout: 30000,
});

fastify.addHook("onClose", async (instance) => {
  await client.destroy();
});

fastify.register(cookie, {
  parseOptions: {},
});

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

async function validateMemberships(
  client: Client,
  guildId: string,
  roleId: string
) {
  const guild = await client.guilds.fetch(guildId);
  const role = await guild.roles.fetch(roleId);

  if (!role) {
    console.error(`Role with ID ${roleId} not found.`);
    return;
  }

  users.forEach(
    async (user: {
      walletAddresses: string[];
      id:
        | UserResolvable
        | FetchMemberOptions
        | (FetchMembersOptions & { user: UserResolvable });
    }) => {
      let hasValidKey = false;

      if (user.walletAddresses && user.walletAddresses.length > 0) {
        for (const walletAddress of user.walletAddresses) {
          if (
            await doesUserHaveValidKey(
              walletAddress,
              config.paywallConfig.locks[
                "0x0947a1c28C7c91128E37cB89538A82E2396A1e87"
              ].contractAddress
            )
          ) {
            hasValidKey = true;
            break;
          }
        }
      }

      try {
        const member = await guild.members.fetch(user.id);
        if (member) {
          const hasRole = member.roles.cache.has(roleId);

          if (hasValidKey && !hasRole) {
            await member.roles.add(role);
          } else if (!hasValidKey && hasRole) {
            await member.roles.remove(role);
          }
        }
      } catch (error) {
        console.error(`Error fetching or updating member: ${error}`);
      }
    }
  );
}

cron.schedule("0 * * * *", () => {
  validateMemberships(client, config.guildId, config.roleId);
});

async function unlockInteractionHandler(interaction: ButtonInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      console.error("Guild is undefined.");
      await interaction.editReply({
        content: "An error occurred with the guild. Please try again.",
      });
      return;
    }

    const role = await interaction.guild.roles.fetch(config.roleId);
    if (!role) {
      console.error("Role is undefined.");
      await interaction.editReply({
        content: "An error occurred with the role. Please try again.",
      });
      return;
    }

    const memberRoles = interaction.member?.roles as GuildMemberRoleManager;
    if (!memberRoles) {
      console.error("Member roles are undefined.");
      await interaction.editReply({
        content: "An error occurred with member roles. Please try again.",
      });
      return;
    }

    const hasRole = memberRoles.cache.get(role.id);
    if (hasRole) {
      await interaction.editReply({
        content: `You are already a member of ${config.serverName}, ${interaction.member?.user}. You can send messages.`,
      });
      return;
    }

    const userId = interaction.member?.user.id;
    if (!userId) {
      console.error("User ID is undefined.");
      await interaction.editReply({
        content: "An error occurred. Please try again.",
      });
      return;
    }

    const user = getUser(userId);
    if (!user || !(user.walletAddresses && user.walletAddresses.length > 0)) {
      const nounceId = crypto.randomUUID();
      upsertNounce(nounceId, userId);

      const checkoutURL = new URL(`/checkout/${nounceId}`, config.host!);
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setStyle("LINK")
          .setLabel("Claim Membership")
          .setURL(checkoutURL.toString())
          .setEmoji("1172610238575284278")
      );
      await interaction.editReply({
        content: "You need to go through the checkout and claim a membership NFT.",
        components: [row],
      });
      return;
    }

    const walletAddresses = user.walletAddresses || [];
    for (const walletAddress of walletAddresses) {
      const validMembership = await hasMembership(walletAddress);
      if (validMembership) {
        await memberRoles.add(role);
        await interaction.editReply({
          content: `You already have a valid ${config.serverName} Membership. Welcome to ${config.serverName}, ${interaction.member!.user}. You can start sending messages now. Head over to <#${config.unlockedChannelId}> and tell us a little more about yourself.`,
        });
        return;
      }
    }
  } catch (error) {
    console.error("Error in unlockInteractionHandler:", error);
    await interaction.editReply({
      content: "An error occurred. Please try again.",
    });
  }
}


async function UnlockCommandHandler(interaction: CommandInteraction) {
  if (interaction.commandName === "ping") {
    return interaction.reply({
      ephemeral: true,
      content: "Pong!",
    });
  }

  if (interaction.commandName === "sendpanel") {
    if (!interaction.memberPermissions?.has("ADMINISTRATOR")) {
      return interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const channelOption = interaction.options.getChannel("channel");
    if (!channelOption || channelOption.type !== "GUILD_TEXT") {
      return interaction.reply({
        content: "Invalid channel specified. Please select a text channel.",
        ephemeral: true,
      });
    }

    const embed = new MessageEmbed()
      .setColor("#FF0000")
      .setTitle(`Welcome to ${config.serverName}`)
      .setDescription("Press the button below to unlock the server.")
      .setImage("https://i.ibb.co/G7WLXhy/imageedit-2-8933853459.jpg");

    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId("unlockServer")
        .setLabel("Unlock Server")
        .setStyle("PRIMARY")
        .setEmoji("1172610238575284278")
    );

    const textChannel = channelOption as TextChannel;
    await textChannel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: `Panel sent to ${textChannel.name}`,
      ephemeral: true,
    });
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
  const nounceEntry = nounces.get(request.params.nounce);

  if (!nounceEntry) {
    return response.status(404).send({ message: "Nounce not found." });
  }

  if (nounceEntry.processed) {
    return response.status(400).send({ message: "Request already processed." });
  }
  nounceEntry.processed = true;
  nounces.set(request.params.nounce, nounceEntry);

  const { userId } = nounceEntry;

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
    const welcomeCardBuffer = await generateWelcomeCard(
      member.user.username,
      member.user.displayAvatarURL({
        format: "png",
        dynamic: true,
        size: 1024,
      }),
      member.user.id
    );
    const attachment = new MessageAttachment(
      welcomeCardBuffer,
      "welcome-card.png"
    );

    await channel.send({
      content: `Welcome to the ${config.serverName}, ${member.user}. You can start sending messages now. Head over to <#${config.unlockedChannelId}> and tell us a little more about yourself.`,
      files: [attachment],
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
        content: `Welcome to the ${config.serverName}, ${user}. You can start sending messages now. Head over to <#${config.unlockedChannelId}> and tell us a little more about yourself.`,
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

    client.on("interactionCreate", async (interaction) => {
      if (interaction.isButton() && interaction.customId === "unlockServer") {
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

fastify.listen({ port: port, host: "0.0.0.0" }, async (error, address) => {
  if (error) {
    fastify.log.error(error.message);
    process.exit(1);
  }
  fastify.log.info(`Server listening at ${address}`);
});
