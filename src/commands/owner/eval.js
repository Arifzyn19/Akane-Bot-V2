import util from 'util';

export default {
  name: "eval",
  description: "Execute JavaScript code (Owner only)",
  usage: "!eval <code>",
  category: "owner", 
  aliases: ["ev", "js"],
  permissions: ["owner"],
  cooldown: 0,

  execute: async (sock, { msg, args, user, bot, config }) => {
    if (!args.length) {
      return msg.reply("❌ Please provide code to execute!");
    }

    const code = args.join(' ');
    
    try {
      await msg.react('⏳');
      
      let result = eval(code);
      
      if (result instanceof Promise) {
        result = await result;
      }
      
      const output = util.inspect(result, {
        depth: 3,
        colors: false,
        maxStringLength: 1000
      });
      
      let response = `📤 *Input:*\n\`\`\`javascript\n${code}\n\`\`\`\n\n`;
      response += `📥 *Output:*\n\`\`\`javascript\n${output}\n\`\`\`\n\n`;
      response += `📊 *Type:* ${typeof result}\n`;
      response += `⏱️ *Time:* ${Date.now() - msg.timestamp}ms`;
      
      await msg.reply(response);
      await msg.react('✅');
      
    } catch (error) {
      const errorOutput = util.inspect(error, {
        depth: 2,
        colors: false
      });
      
      let response = `📤 *Input:*\n\`\`\`javascript\n${code}\n\`\`\`\n\n`;
      response += `❌ *Error:*\n\`\`\`javascript\n${errorOutput}\n\`\`\``;
      
      await msg.reply(response);
      await msg.react('❌');
    }
  }
};  