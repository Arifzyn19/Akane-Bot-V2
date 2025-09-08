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

  async handle(msg) {
    try {
      const m = Serialize(this.sock, msg, this.sock.store);
      if (!m) return;

      if (m.fromMe) return; 
      if (m.isBaileys) return; 

      console.log(chalk.gray('📨'), chalk.greenBright('Message received from'), chalk.cyan(m.pushName || m.sender), chalk.greenBright('in'), chalk.cyan(m.isGroup ? m.groupName : 'Private Chat'));
   
      for (const pluginName in plugins) {
        const plugin = plugins[pluginName];
        if (!plugin || !plugin.command || !plugin.execute) continue;

        if (m.prefix) {
          const isCommand = (m.prefix && m.body.startsWith(m.prefix)) || false
          const command = isCommand ? m.command.toLowerCase() : false

          const isAccept = Array.isArray(plugin.command)
            ? plugin.command.includes(command)
            : plugin.command === command
          if (!isAccept) continue

          m.plugin = plugin
          m.isCommand = isCommand

          //  debug log
          console.log(chalk.gray('🔍'), chalk.blueBright('Command detected:'), chalk.cyan(command), chalk.blueBright('from'), chalk.cyan(m.pushName || m.sender));
          
          // User management
          const user = await storage.getUser(m.sender);
          if (!user) {
            await storage.createUser(m.sender);
          }
  
          if (plugin.permissions && plugin.permissions !== 'all') {
            const userPerms = user.permissions || [];
            const requiredPerms = Array.isArray(plugin.permissions)
              ? plugin.permissions
              : [plugin.permissions];

            const hasPermission = requiredPerms.every(perm => userPerms.includes(perm));
            if (!hasPermission) {
              await this.sock.sendMessage(m.chat, { text: "❌ You don't have permission to use this command." });
              return;
            }
          }
          
          /*
          if (plugin.cooldown) {
            const onCooldown = checkCooldown(user.cooldowns, plugin.name, plugin.cooldown);
            if (onCooldown) {
              await this.sock.sendMessage(m.chat, { text: `⏳ Please wait before using the *${plugin.name}* command again.` });
              return;
            }
          }
          */

          const opts = {
            args: m.args,
            text: m.text,
            prefix: m.prefix,
          };

          console.log(chalk.gray('⚙️'), chalk.yellow('Executing plugin:'), chalk.cyan(plugin.name), chalk.yellow('for user'), chalk.cyan(m.pushName || m.sender));

          await plugin.execute(this.sock, { m, ...opts });
        }
      }
    } catch (error) {
      console.error('❌ Error in message handler:', error);
    }
  }
}