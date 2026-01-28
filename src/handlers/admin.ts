import { Context } from 'grammy';
import { getServerInfo, formatUptime, formatBytes } from '../utils/server';
import { isAdmin } from '../utils/api-config';

function isAdmin(id: bigint) {
  return process.env.ADMIN_ID!.toString() === id.toString()
}
export async function showAdminMenu(ctx: Context, apiConfig: APIConfig): Promise<void> {
  if (!isAdmin(ctx.from?.id || 0, apiConfig)) {
    await ctx.reply('❌ You do not have admin access.');
    return;
  }

  await ctx.reply('👨‍💼 Admin Panel', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📊 Server Info', callback_data: 'admin_server_info' }],
        [{ text: '🔑 Manage Outline Keys', callback_data: 'admin_outline_keys' }],
        [{ text: '⚙️ API Configuration', callback_data: 'admin_api_info' }],
        [{ text: '🔙 Back', callback_data: 'back' }],
      ],
    },
  });
}

export async function handleServerInfo(ctx: Context): Promise<void> {
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
        inline_keyboard: [
          [{ text: '🔄 Refresh', callback_data: 'admin_server_info' }],
          [{ text: '🔙 Back', callback_data: 'admin_menu' }],
        ],
      },
    });
  } catch (error) {
    console.error('Error getting server info:', error);
    await ctx.answerCallbackQuery('❌ Error loading server information', { show_alert: true });
  }
}

export async function handleOutlineKeys(ctx: Context): Promise<void> {
  await ctx.editMessageText('🔑 Outline Key Management', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '➕ Create New Key', callback_data: 'outline_create_key' }],
        [{ text: '📋 List Keys', callback_data: 'outline_list_keys' }],
        [{ text: '🔙 Back', callback_data: 'admin_menu' }],
      ],
    },
  });
}

export async function handleAPIInfo(ctx: Context, apiConfig: APIConfig): Promise<void> {
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
      inline_keyboard: [
        [{ text: '🔙 Back', callback_data: 'admin_menu' }],
      ],
    },
  });
}

export async function startOutlineKeyCreation(ctx: Context): Promise<void> {
  await ctx.editMessageText(
    '📝 Please enter a name for the new Outline access key:\n\n(Use /cancel to abort)',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Cancel', callback_data: 'admin_outline_keys' }],
        ],
      },
    }
  );
  ctx.session.creatingOutlineKey = true;
}

export async function listOutlineKeys(ctx: Context): Promise<void> {
  await ctx.editMessageText(
    '📋 <b>Outline Access Keys</b>\n\nKey listing functionality coming soon...',
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Back', callback_data: 'admin_outline_keys' }],
        ],
      },
    }
  );
}
