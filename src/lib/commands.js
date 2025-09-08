import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMMANDS_DIR = path.join(__dirname, "../commands");

export class CommandLoader {
  constructor() {
    this.commands = new Map();
    this.aliases = new Map();
  }

  async loadCommands() {
    console.log("📂 Loading commands...");

    if (!fs.existsSync(COMMANDS_DIR)) {
      console.log("❌ Commands directory not found");
      return;
    }

    await this.loadFromDirectory(COMMANDS_DIR);

    console.log(`✅ Loaded ${this.commands.size} commands`);
    this.logLoadedCommands();
  }

  async loadFromDirectory(dir, category = "") {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Recursive load subdirectories
        const subCategory = category ? `${category}/${item}` : item;
        await this.loadFromDirectory(fullPath, subCategory);
      } else if (item.endsWith(".js")) {
        await this.loadCommand(fullPath, category);
      }
    }
  }

  async loadCommand(filePath, category) {
    try {
      const fileUrl = pathToFileURL(filePath).href;
      const module = await import(fileUrl);
      const command = module.default;

      if (!this.validateCommand(command)) {
        console.log(`❌ Invalid command structure: ${path.basename(filePath)}`);
        return;
      }

      // Set category if not defined
      if (!command.category) {
        command.category = category || "general";
      }

      // Register command
      this.commands.set(command.name.toLowerCase(), command);

      // Register aliases
      if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach((alias) => {
          this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
        });
      }
    } catch (error) {
      console.error(
        `❌ Failed to load command ${path.basename(filePath)}:`,
        error.message,
      );
    }
  }

  validateCommand(command) {
    if (!command || typeof command !== "object") return false;
    if (!command.name || typeof command.name !== "string") return false;
    if (!command.execute || typeof command.execute !== "function") return false;

    return true;
  }

  getCommand(name) {
    name = name.toLowerCase();

    // Direct command lookup
    if (this.commands.has(name)) {
      return this.commands.get(name);
    }

    // Alias lookup
    if (this.aliases.has(name)) {
      const commandName = this.aliases.get(name);
      return this.commands.get(commandName);
    }

    return null;
  }

  getAllCommands() {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory() {
    const categories = {};

    this.commands.forEach((command) => {
      const category = command.category || "general";
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(command);
    });

    return categories;
  }

  logLoadedCommands() {
    const categories = this.getCommandsByCategory();

    Object.keys(categories).forEach((category) => {
      const commands = categories[category];
      console.log(
        `  📁 ${category}: ${commands.map((cmd) => cmd.name).join(", ")}`,
      );
    });
  }

  async reloadCommands() {
    this.commands.clear();
    this.aliases.clear();
    await this.loadCommands();
  }
}

export const commandLoader = new CommandLoader();
