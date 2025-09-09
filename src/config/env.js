import { config } from 'dotenv';

config();

export const ENV = {
  // Database
  DB_MODE: process.env.DB_MODE || 'json',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-bot',
  
  // Bot Configuration
  BOT_NAME: process.env.BOT_NAME || 'WhatsApp Bot',
  PREFIX: process.env.PREFIX || '!',
  OWNER_NUMBERS: process.env.OWNER_NUMBERS?.split(',') || [process.env.OWNER_NUMBER || ''].filter(Boolean),
  ADMIN_NUMBERS: process.env.ADMIN_NUMBERS?.split(',') || [],
  
  // Bot Options
  AUTO_RECONNECT: process.env.AUTO_RECONNECT === 'true',
  PRINT_QR: process.env.PRINT_QR === 'true',
  USE_PAIRING_CODE: process.env.USE_PAIRING_CODE === 'true',
  PAIRING_NUMBER: process.env.PAIRING_NUMBER || '',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Commands
  COMMANDS_DIR: process.env.COMMANDS_DIR || 'src/commands'
};

ENV.OWNER_NUMBER = ENV.OWNER_NUMBERS[0] || '';

export default ENV;