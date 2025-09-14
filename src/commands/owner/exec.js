import util from "util";
import cp, { exec as _exec } from "child_process";

const exec = util.promisify(_exec).bind(cp);

export default {
  name: "exec",
  description: "Execute terminal commands (Owner only)",
  command: ["$", "exec", "exc"],
  category: "owner",
  cooldown: 0,
  prefix: false,
  isOwner: true,

  async execute(m, { text }) {
    if (!text) {
      return m.reply("❌ Please provide a command to execute!");
    }

    let o;
    try {
      o = await exec(text);
    } catch (e) {
      o = e;
    } finally {
      if (!o) return;

      const { stdout, stderr } = o;

      if (typeof stdout === "string" && stdout.trim()) {
        m.reply(stdout);
      }

      if (typeof stderr === "string" && stderr.trim()) {
        m.reply(stderr);
      }
    }
  },
};
