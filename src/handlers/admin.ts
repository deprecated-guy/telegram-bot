import { BotContext } from '../bot'; // путь к твоему типу BotContext
import { loadUsers } from '../utils/database';
import { getServerInfo, formatUptime, formatBytes } from '../utils/server';
import { CALLBACK_DATA, BUTTONS } from '../utils/buttons';
import { getAllKeys } from '../utils/outline';

// ================= UTILS =================
export function isAdmin(id: number | bigint) {
  const adminId = BigInt(process.env.ADMIN_ID || '0');
  const userId = typeof id === 'bigint' ? id : BigInt(id);
  return adminId.toString() === userId.toString();
}

// ================= ADMIN MENU =================
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

// ================= SERVER INFO =================
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
      reply_markup: { inline_keyboard: BUTTONS.serverInfoActions() },
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    await ctx.answerCallbackQuery('❌ Error loading server information');
  }
}

// ================= API INFO =================
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
    reply_markup: { inline_keyboard: BUTTONS.backToAdmin() },
  });
}

// ================= OUTLINE KEY MANAGEMENT =================
export async function handleOutlineKeys(ctx: BotContext): Promise<void> {
  await listOutlineKeys(ctx);
}

export async function listOutlineKeys(ctx: BotContext): Promise<void> {
  const users = loadUsers() ?? [];

  if (!users || users.length === 0) {
    await ctx.editMessageText('📋 <b>Outline Access Keys</b>\n\nNo access keys found.', {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: BUTTONS.backToOutlineMenu() },
    });
    return;
  }

  for (const user of users) {
    const keyboard = [
      [
        { text: '🔑 Show Key', callback_data: `show_key:${user.id}` },
        { text: '📤 Send Key', callback_data: `send_key:${user.telegramId}` },
      ],
      [
        { text: '➕ Create Another Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY },
      ],
    ];

    await ctx.reply(
      `👤 <b>${user.username || 'Unknown user'}</b>\n🆔 <code>${user.telegramId}</code>`,
      {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  }
}

// ================= SHOW KEY =================
export async function handleShowKey(ctx: BotContext) {
  const action = ctx.callbackQuery?.data;
  if (!action || !action.startsWith('show_key:')) return;

  const userId = Number(action.split(':')[1]);
  const users = loadUsers() ?? [];
  const user = users.find(u => Number(u.id) === userId);

  if (!user) {
    await ctx.answerCallbackQuery('❌ Key not found');
    return;
  }

  await ctx.reply(
    `🔑 <b>Outline Access Key for ${user.username}</b>\n\n<tg-spoiler><code>${user.apiKey}</code></tg-spoiler>`,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🗑 Delete Message', callback_data: `delete_key_msg:${ctx.from?.id}` },
            { text: '📤 Send to Owner', callback_data: `send_key:${user.telegramId}` },
          ],
        ],
      },
    }
  );

  await ctx.answerCallbackQuery('Key revealed! Tap code to copy.');
}

// ================= DELETE KEY MESSAGE =================
export async function handleDeleteKeyMsg(ctx: BotContext) {
  const action = ctx.callbackQuery?.data;
  if (!action || !action.startsWith('delete_key_msg')) return;

  try {
    await ctx.deleteMessage();
    await ctx.answerCallbackQuery('🧹 Message deleted');
  } catch {
    await ctx.answerCallbackQuery('❌ Failed to delete');
  }
}

// ================= START KEY CREATION =================
export async function startOutlineKeyCreation(ctx: BotContext): Promise<void> {
  await ctx.editMessageText(
    '📝 Please enter a Telegram ID of the user for whom you want to create a new Outline key:\n\n(Use /cancel to abort)',
    { reply_markup: { inline_keyboard: BUTTONS.cancelOutlineKey() } }
  );
  ctx.session.creatingOutlineKey = true;
}
