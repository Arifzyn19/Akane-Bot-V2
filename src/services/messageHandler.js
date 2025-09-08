import { ENV } from "../config/env.js";
import { storage } from "../config/storage.js";
import { commandLoader } from "../lib/commands.js";
import {
  parseCommand,
  hasPermission,
  checkCooldown,
  setCooldown,
} from "../lib/utils.js";

export class MessageHandler {
  constructor(sock) {
    this.sock = sock;
  }

  async handle(msg) {
    try {
      // Extract message info
      const messageInfo = this.extractMessageInfo(msg);
      if (!messageInfo) return;

      const { text, sender, isGroup } = messageInfo;

      // Check if message starts with prefix
      const parsedCommand = parseCommand(text, ENV.PREFIX);
      if (!parsedCommand) return;

      const { command, args } = parsedCommand;

      // Get command from loader
      const cmd = commandLoader.getCommand(command);
      if (!cmd) {
        await this.sendMessage(
          msg.key.remoteJid,
          `❌ Command *${command}* not found. Use ${ENV.PREFIX}menu to see available commands.`,
        );
        return;
      }

      // Get or create user
      const user = await storage.getUser(sender);

      // Check permissions
      if (
        cmd.permissions &&
        !hasPermission(user.permissions, cmd.permissions)
      ) {
        await this.sendMessage(
          msg.key.remoteJid,
          `❌ You don't have permission to use this command.`,
        );
        return;
      }

      // Check cooldown
      if (cmd.cooldown) {
        const cooldownCheck = checkCooldown(
          user.cooldowns,
          cmd.name,
          cmd.cooldown,
        );
        if (!cooldownCheck.canUse) {
          await this.sendMessage(
            msg.key.remoteJid,
            `⏳ Command is on cooldown. Wait ${cooldownCheck.remaining} seconds.`,
          );
          return;
        }
      }

      // Execute command
      const context = {
        msg,
        args,
        sender,
        isGroup,
        user,
        bot: {
          name: ENV.BOT_NAME,
          prefix: ENV.PREFIX,
        },
        config: ENV,
        commands: commandLoader.getAllCommands(),
      };

      await cmd.execute(this.sock, context);

      // Set cooldown
      if (cmd.cooldown) {
        setCooldown(user.cooldowns, cmd.name);
        await storage.saveUser(sender, user);
      }
    } catch (error) {
      console.error("❌ Error in message handler:", error);

      try {
        await this.sendMessage(
          msg.key.remoteJid,
          "❌ An error occurred while processing your command.",
        );
      } catch (sendError) {
        console.error("❌ Failed to send error message:", sendError);
      }
    }
  }

  extractMessageInfo(msg) {
    const messageType = Object.keys(msg.message)[0];
    let text = "";
    
    switch (messageType) {
      case "conversation":
        text = msg.message.conversation;
        break;
      case "extendedTextMessage":
        text = msg.message.extendedTextMessage.text;
        break;
      case "imageMessage":
        text = msg.message.imageMessage.caption || "";
        break;
      case "videoMessage":
        text = msg.message.videoMessage.caption || "";
        break;
      default:
        return null;
    }
    
    if (!text || msg.key.remoteJid === "status@broadcast") {
      return null;
    }

    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = msg.key.remoteJid.includes("@g.us");

    return { text, sender, isGroup, messageType };
  }

  async sendMessage(jid, text) {
    return await this.sock.sendMessage(jid, { text });
  }
}
