import util from 'util';

export default {
  name: "eval",
  description: "Execute JavaScript code (Owner only)",
  command: ["eval", "ev", "js"],
  permissions: "owner",
  category: "owner",
  cooldown: 0,

  async execute(m, { text, sock }) {
    if (!text) {
      return m.reply("❌ Please provide code to execute!");
    }

    try {
      let result = eval(text);
      
      if (result instanceof Promise) {
        result = await result;
      }
      
      const output = util.inspect(result, {
        depth: 3,
        colors: false,
        maxStringLength: 1000
      });
      
      let response = `📤 *Input:*\n\`\`\`javascript\n${text}\n\`\`\`\n\n`;
      response += `📥 *Output:*\n\`\`\`javascript\n${output}\n\`\`\`\n\n`;
      response += `📊 *Type:* ${typeof result}`;
      
      await m.reply(response);
      
    } catch (error) {
      const errorOutput = util.inspect(error, {
        depth: 2,
        colors: false
      });
      
      let response = `📤 *Input:*\n\`\`\`javascript\n${text}\n\`\`\`\n\n`;
      response += `❌ *Error:*\n\`\`\`javascript\n${errorOutput}\n\`\`\``;
      
      await m.reply(response);
    }
  }
};