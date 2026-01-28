import { Context } from 'grammy';

export async function showMainMenu(ctx: Context): Promise<void> {
  const message = `
👋 Welcome to the Telegram Bot!

Choose an action:
  `;

  await ctx.reply(message.trim(), {
    reply_markup: {
      inline_keyboard: [
        [{ text: '👨‍💼 Admin Panel', callback_data: 'admin_menu' }],
        [{ text: '📚 Help', callback_data: 'help' }],
        [{ text: '❓ About', callback_data: 'about' }],
      ],
    },
  });
}

export async function showHelp(ctx: Context): Promise<void> {
  const message = `
📚 <b>Help</b>

<b>Available Commands:</b>
/start - Show main menu
/admin - Open admin panel
/help - Show this help message
/about - Show about information

<b>Admin Features:</b>
• Monitor server resources (CPU, memory, disk, uptime)
• Create and manage Outline VPN access keys
• View API configuration

<b>Tips:</b>
• Use inline buttons to navigate
• Only admins can access the admin panel
• Commands can be used anytime
  `;

  await ctx.editMessageText(message.trim(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Back', callback_data: 'main_menu' }],
      ],
    },
  });
}

export async function showAbout(ctx: Context): Promise<void> {
  const message = `
❓ <b>About This Bot</b>

<b>Shaddy VPN Bot</b>
Version: 1.0.0

<b>Features:</b>
✅ Admin panel for server management
✅ Outline VPN key generation
✅ Real-time server monitoring
✅ API configuration management

<b>Technologies:</b>
• TypeScript
• Grammy (Telegram Bot API)
• Node.js

<b>Support:</b>
For issues or suggestions, contact the administrator.
  `;

  await ctx.editMessageText(message.trim(), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔙 Back', callback_data: 'main_menu' }],
      ],
    },
  });
}
