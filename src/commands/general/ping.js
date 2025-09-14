import os from "os";
import { performance } from "perf_hooks";

export default {
  name: "ping",
  description: "Show latency and host info",
  command: ["ping", "p"],
  permissions: "all",
  category: "info",
  cooldown: 3,

  async execute(m) {
    const t0 = performance.now();
    const total = (os.totalmem() / 1024 ** 3).toFixed(2);
    const free = (os.freemem() / 1024 ** 3).toFixed(2);
    const used = (total - free).toFixed(2);

    await m.reply(
      `🏓 *PONG!*\n\n` +
        `⚡ Latency: ${(performance.now() - t0).toFixed(2)}ms\n` +
        `💻 CPU: ${os.cpus().length} cores\n` +
        `🧠 RAM: ${used} / ${total} GB\n` +
        `📊 Free: ${free} GB\n` +
        `🖥️ Platform: ${os.platform()}\n` +
        `⏰ Uptime: ${process.uptime().toFixed(0)}s`,
    );
  },
};
