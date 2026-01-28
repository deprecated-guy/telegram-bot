import { Context, SessionFlavor } from 'grammy';

type BotContext = Context & SessionFlavor<{ creatingOutlineKey?: boolean }>;

import { getServerInfo, formatUptime, formatBytes } from '../utils/server';
import { BUTTONS } from '../utils/buttons';
import { loadUsers } from '../utils/database';
import { getAllKeys } from '../utils/outline';

export function isAdmin(id: number | bigint) {
  const adminId = BigInt(process.env.ADMIN_ID || '0');
  const userId = typeof id === 'bigint' ? id : BigInt(id);
  return adminId.toString() === userId.toString();
}

export async function showAdminMenu(ctx: BotContext): Promise<void> {
  if (!isAdmin(ctx.from?.id || 0)) {
    await ctx.reply('❌ You do not have admin access.');
    return;
  }

  await ctx.reply('👨‍💼 Admin Panel', {
    reply_markup: {
      inline_keyboard: BUTTONS.adminMenu(),
    },
  });
}

export async function handleServerInfo(ctx: BotContext): Promise<void> {
  try {
    await ctx.answerCallbackQuery('Loading server information...');
    const serverInfo = await getServerInfo();

    const message = `
📊 <b>Server Information</b>

⏱️ <b>Uptime:</b> ${formatUptime(serverInfo.uptime)}

🖥️ <b>CPU Usage:</b> ${serverInfo.cpuUsage.toFixed(2)}%

💾 <b>Memory:</b>
   Used: ${formatBytes(serverInfo.memoryUsage.used)}
   Total: ${formatBytes(serverInfo.memoryUsage.total)}
   Usage: ${serverInfo.memoryUsage.percentage.toFixed(2)}%

💿 <b>Disk:</b>
   Used: ${formatBytes(serverInfo.diskUsage.used)}
   Total: ${formatBytes(serverInfo.diskUsage.total)}
   Usage: ${serverInfo.diskUsage.percentage.toFixed(2)}%
    `;

    await ctx.editMessageText(message.trim(), {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: BUTTONS.serverInfoActions(),
      },
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    await ctx.answerCallbackQuery('❌ Error loading server information');
  }
}

export async function handleOutlineKeys(ctx: BotContext): Promise<void> {
  await ctx.editMessageText('🔑 Outline Key Management', {
    reply_markup: {
      inline_keyboard: BUTTONS.outlineKeysMenu(),
    },
  });
}

interface APIConfig {
  environment: string;
  apiVersion: string;
  outlineApiUrl: string;
  adminIds: bigint[];
}

export async function handleAPIInfo(ctx: BotContext, apiConfig: APIConfig): Promise<void> {
  const message = `
⚙️ <b>API Configuration</b>

🌍 <b>Environment:</b> ${apiConfig.environment}
📦 <b>API Version:</b> ${apiConfig.apiVersion}
🔗 <b>Outline API URL:</b> ${apiConfig.outlineApiUrl || 'Not configured'}
👥 <b>Admin IDs:</b> ${apiConfig.adminIds.join(', ')}
    `;

  await ctx.editMessageText(message.trim(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: BUTTONS.backToAdmin(),
    },
  });
}

export async function startOutlineKeyCreation(ctx: BotContext): Promise<void> {
  await ctx.editMessageText(
    '📝 Please enter a name for the new Outline access key:\n\n(Use /cancel to abort)',
    {
      reply_markup: {
        inline_keyboard: BUTTONS.cancelOutlineKey(),
      },
    }
  );
  ctx.session.creatingOutlineKey = true;
}

export async function listOutlineKeys(ctx: BotContext): Promise<void> {
  const users = loadUsers() ?? [];

  if (!users || users.length === 0) {
    await ctx.editMessageText('📋 <b>Outline Access Keys</b>\n\nNo access keys found.', {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: BUTTONS.backToOutlineMenu(),
      },
    });
    return;
  }

  const lines = users.map((u) => {
    const masked = u.apiKey ? `${u.apiKey.slice(0, 6)}...${u.apiKey.slice(-6)}` : 'N/A';
    return `<b>${u.id} — ${u.username}</b>\n<code>${masked}</code>`;
  });

    // Build inline keyboard with a copy button for each key
    const keyboard: Array<Array<{ text: string; callback_data: string }>> = users.map((u) => [
      { text: `🔑 ${u.username}`, callback_data: `show_key:${u.id}` },
    ]);

    // append a back button row
    keyboard.push(...BUTTONS.backToOutlineMenu());

    const message = `📋 <b>Outline Access Keys</b>\n\n${lines.join('\n\n')}`;

    await ctx.editMessageText(message, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
  }
