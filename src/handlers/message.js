import { ENV } from '../config/env.js';
import { storage } from '../config/storage.js';
import { plugins } from '../lib/plugin.js';
import { checkCooldown, setCooldown } from '../lib/utils.js';
import { Serialize } from '../lib/client.js';
import chalk from 'chalk';

export class MessageHandler {
  constructor(sock) {
    this.sock = sock;
  }

  /** 
   * Handle incoming message
   * @param {object} msg - Incoming message object from Baileys
   */
  async handle(msg) {
    try {
      const m = Serialize(this.sock, msg, this.sock.store);
      if (!m) return;

      if (m.fromMe) return; 
      if (m.isBaileys) return; 

      console.log(chalk.gray('📨'), chalk.greenBright('Message received from'), chalk.cyan(m.pushName || m.sender), chalk.greenBright('in'), chalk.cyan(m.isGroup ? m.groupName || 'Group Chat' : 'Private Chat'));
   
      for (const pluginName in plugins) {
        const plugin = plugins[pluginName];
        if (!plugin || !plugin.command || !plugin.execute) continue;

        // Check if message matches plugin conditions
        if (plugin.group === true && !m.isGroup) continue;
        if (plugin.private === true && m.isGroup) continue;

        if (m.prefix) {
          const isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false;
          const command = isCommand ? m.command.toLowerCase() : false;

          const isAccept = Array.isArray(plugin.command)
            ? plugin.command.includes(command)
            : plugin.command === command;
          if (!isAccept) continue;

          m.plugin = plugin;
          m.isCommand = isCommand;

          const user = await storage.getUser(m.sender);

          // Permission checking with new system
          if (!this.hasPermission(plugin.permissions, m.sender, user)) {
            await m.reply("❌ You don't have permission to use this command.");
            return;
          }
          
          // Cooldown check
          if (plugin.cooldown && plugin.cooldown > 0) {
            const cooldownResult = checkCooldown(user.cooldowns, plugin.name, plugin.cooldown);
            if (!cooldownResult.canUse) {
              await m.reply(`⏳ Please wait ${cooldownResult.remaining} seconds before using the *${plugin.name}* command again.`);
              return;
            }
          }

          // Execute plugin
          try {
            await plugin.execute(m, {
              args: m.args,
              text: m.text,
              prefix: m.prefix,
              sock: this.sock,
              user,
              isOwner: m.isOwner,
              isAdmin: m.isAdmin,
              isGroup: m.isGroup
            });

            // Set cooldown after successful execution
            if (plugin.cooldown && plugin.cooldown > 0) {
              setCooldown(user.cooldowns, plugin.name);
              await storage.saveUser(m.sender, user);
            }
          } catch (error) {
            console.error(chalk.red('❌ Plugin execution error:'), error);
            await m.reply(`❌ Error executing command: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in message handler:', error);
    }
  }

  /**
   * Check if user has permission to use plugin
   * @param {string|array} requiredPermissions - Required permissions
   * @param {string} sender - User JID
   * @param {object} user - User data
   * @returns {boolean}
   */
  hasPermission(requiredPermissions, sender, user) {
    // If permissions is "all", everyone can use
    if (requiredPermissions === 'all') return true;

    const userNumber = sender.replace('@s.whatsapp.net', '');
    
    // Check owner permission (support multiple owners)
    if (requiredPermissions === 'owner') {
      return ENV.OWNER_NUMBERS.includes(userNumber);
    }
    
    // Check admin permission (includes all owners)
    if (requiredPermissions === 'admin') {
      return ENV.OWNER_NUMBERS.includes(userNumber) || ENV.ADMIN_NUMBERS.includes(userNumber);
    }

    // For array permissions, check if user has any of them
    if (Array.isArray(requiredPermissions)) {
      return requiredPermissions.some(perm => this.hasPermission(perm, sender, user));
    }

    return false;
  }
}