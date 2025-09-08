export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const formatUptime = (uptime) => {
  const seconds = Math.floor(uptime % 60);
  const minutes = Math.floor((uptime / 60) % 60);
  const hours = Math.floor((uptime / 3600) % 24);
  const days = Math.floor(uptime / 86400);

  let result = "";
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${seconds}s`;

  return result.trim();
};

export const isValidJid = (jid) => {
  return /^[\d\-@s.whatsapp.net]+$/.test(jid);
};

export const extractNumber = (jid) => {
  return jid.replace("@s.whatsapp.net", "");
};

export const formatNumber = (number) => {
  return number.includes("@") ? number : `${number}@s.whatsapp.net`;
};

export const getUserMention = (jid) => {
  return `@${extractNumber(jid)}`;
};

export const hasPermission = (userPermissions, requiredPermissions) => {
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }

  return requiredPermissions.some((perm) => userPermissions.includes(perm));
};

export const checkCooldown = (userCooldowns, commandName, cooldownTime) => {
  const now = Date.now();
  const lastUsed = userCooldowns[commandName];

  if (!lastUsed) return { canUse: true };

  const timePassed = (now - new Date(lastUsed).getTime()) / 1000;
  const remaining = cooldownTime - timePassed;

  if (remaining > 0) {
    return {
      canUse: false,
      remaining: Math.ceil(remaining),
    };
  }

  return { canUse: true };
};

export const setCooldown = (userCooldowns, commandName) => {
  userCooldowns[commandName] = new Date().toISOString();
};

export const parseCommand = (text, prefix) => {
  if (!text.startsWith(prefix)) return null;

  const args = text.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  return { command, args };
};
