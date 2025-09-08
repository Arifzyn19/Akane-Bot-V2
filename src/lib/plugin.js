import config from '../config/env.js';
import fs, { existsSync, watch } from 'fs';
import { join, resolve } from 'path';
import * as os from 'os';
import syntaxerror from 'syntax-error';
import { createRequire } from 'module';
import path from 'path';
import Helper from './helper.js';
import chalk from 'chalk';

const __dirname = Helper.__dirname(import.meta);
const rootDirectory = Helper.__dirname(join(__dirname, '../'));
const pluginFolder = Helper.__dirname(join(__dirname, '../commands/'));
const pluginFilter = (filename) => /\.(js|mjs|cjs)$/.test(filename);
const require = createRequire(import.meta.url);

async function importFile(module) {
  module = Helper.__filename(module);

  const ext = path.extname(module);
  let result;

  if (ext === '.cjs') {
    const module_ = require(module);
    result = module_ && module_.default ? module_.default : module_;
  } else {
    const module_ = await import(`${module}?id=${Date.now()}`);
    result = module_ && module_.default ? module_.default : module_;
  }

  return result;
}

let watcher = {};
let plugins = {};
let pluginFolders = [];

/**
 * Load files from plugin folder as plugins
 */
async function loadPluginFiles(
  pluginFolder_ = pluginFolder,
  pluginFilter_ = pluginFilter,
  opts = { recursiveRead: true },
) {
  const folder = resolve(pluginFolder_);
  if (folder in watcher) return;
  pluginFolders.push(folder);
  
  try {
    const paths = await fs.promises.readdir(pluginFolder_);
    await Promise.all(
      paths.map(async (path) => {
        const resolved = join(folder, path);
        const dirname = resolved;
        const formattedFilename = formatFilename(resolved);
        
        try {
          const stats = await fs.promises.lstat(dirname);
          if (!stats.isFile()) {
            if (opts.recursiveRead) await loadPluginFiles(dirname, pluginFilter_, opts);
            return;
          }
          
          const filename = resolved;
          const isValidFile = pluginFilter_(filename);
          if (!isValidFile) return;
          
          const module = await importFile(filename);
          if (module && validatePlugin(module)) {
            plugins[formattedFilename] = module;
            opts.logger?.info?.(`loaded plugin - '${formattedFilename}'`) 
          } else {
            opts.logger?.warn?.(`invalid plugin structure - '${formattedFilename}'`) ||
              console.log(chalk.yellow(`  ⚠ Invalid structure: ${filename}`));
          }
        } catch (e) {
          opts.logger?.error?.(e, `error while requiring ${formattedFilename}`) ||
            console.error(chalk.red(`  ✗ Error loading ${filename}:`, e.message));
          delete plugins[formattedFilename];
        }
      }),
    );
  } catch (error) {
    opts.logger?.error?.(error, `error reading directory ${pluginFolder_}`) ||
      console.error(chalk.red(`Error reading directory ${pluginFolder_}:`, error.message));
  }
  
  const watching = watch(
    folder,
    reload.bind(null, {
      logger: opts.logger,
      pluginFolder: pluginFolder_,
      pluginFilter: pluginFilter_,
    }),
  );
  watching.on('close', () => deletePluginFolder(folder, true));
  watcher[folder] = watching;
  return (plugins = sortedPlugins(plugins));
}

/**
 * Validate plugin structure
 */
function validatePlugin(plugin) {
  if (!plugin || typeof plugin !== 'object') return false;
  if (!plugin.name || typeof plugin.name !== 'string') return false;
  if (!plugin.execute || typeof plugin.execute !== 'function') return false;
  return true;
}

/**
 * Delete and stop watching the folder
 */
function deletePluginFolder(folder, isAlreadyClosed = false) {
  const resolved = resolve(folder);
  if (!(resolved in watcher)) return;
  if (!isAlreadyClosed) watcher[resolved].close();
  delete watcher[resolved];
  pluginFolders.splice(pluginFolders.indexOf(resolved), 1);
}

/**
 * Reload file to load latest changes
 */
async function reload(
  { logger, pluginFolder = pluginFolder, pluginFilter = pluginFilter },
  _ev,
  filename,
) {
  if (pluginFilter(filename)) {
    const file = join(pluginFolder, filename);
    const formattedFilename = formatFilename(file);
    
    if (formattedFilename in plugins) {
      if (existsSync(file)) {
        logger?.info?.(`updated plugin - '${formattedFilename}'`) ||
          console.log(chalk.blue(`  🔄 Updated: ${path.basename(filename)}`));
      } else {
        logger?.warn?.(`deleted plugin - '${formattedFilename}'`) ||
          console.log(chalk.red(`  🗑️ Deleted: ${path.basename(filename)}`));
        return delete plugins[formattedFilename];
      }
    } else {
      logger?.info?.(`new plugin - '${formattedFilename}'`) ||
        console.log(chalk.green(`  ➕ New: ${path.basename(filename)}`));
    }
    
    const src = await fs.promises.readFile(file);
    let err = syntaxerror(src, filename, {
      sourceType: 'module',
      allowAwaitOutsideFunction: true,
    });
    
    if (err) {
      logger?.error?.(err, `syntax error while loading '${formattedFilename}'`) ||
        console.error(chalk.red(`  ❌ Syntax error in ${path.basename(filename)}:`, err.message));
    } else {
      try {
        const module = await importFile(file);
        if (module && validatePlugin(module)) {
          plugins[formattedFilename] = module;
        } else {
          logger?.warn?.(`invalid plugin structure - '${formattedFilename}'`) ||
            console.log(chalk.yellow(`  ⚠ Invalid structure: ${path.basename(filename)}`));
          delete plugins[formattedFilename];
        }
      } catch (e) {
        logger?.error?.(e, `error require plugin '${formattedFilename}'`) ||
          console.error(chalk.red(`  ❌ Error requiring ${path.basename(filename)}:`, e.message));
        delete plugins[formattedFilename];
      } finally {
        plugins = sortedPlugins(plugins);
      }
    }
  }
}

/**
 * Format filename to a relative path
 */
function formatFilename(filename) {
  let dir = join(rootDirectory, './');
  if (os.platform() === 'win32') dir = dir.replace(/\\/g, '\\\\');
  const regex = new RegExp(`^${dir}`);
  const formatted = filename.replace(regex, '');
  return formatted;
}

/**
 * Sort plugins by their keys
 */
function sortedPlugins(plugins) {
  return Object.fromEntries(Object.entries(plugins).sort(([a], [b]) => a.localeCompare(b)));
}

export {
  pluginFolder,
  pluginFilter,
  plugins,
  watcher,
  pluginFolders,
  loadPluginFiles,
  deletePluginFolder,
  reload
}; 