import { Bot, Context, session, SessionFlavor } from 'grammy';
import { showMainMenu, showHelp, showAbout } from './handlers/menu';
import {
  showAdminMenu,
  handleServerInfo,
  handleOutlineKeys,
  handleAPIInfo,
  startOutlineKeyCreation,
  listOutlineKeys,
} from './handlers/admin';
import { createOutlineAccessKey } from './utils/outline';
import { CALLBACK_DATA, BUTTONS } from './utils/buttons';
import { loadUsers } from './utils/database';
import dotenv from 'dotenv';
import {loadApiUrl} from './utils/api-config';
import {ensureDbExists} from './utils/database';
dotenv.config();

ensureDbExists();

// Session type for managing conversation state
interface SessionData {
  creatingOutlineKey: boolean;
  keyName?: string; // временное хранение названия ключа
}

type BotContext = Context & SessionFlavor<SessionData>;

// Initialize bot with token from environment
const bot = new Bot<BotContext>(process.env.BOT_TOKEN || '');

// Session middleware
bot.use(session({ initial: () => ({ }) }));

// Start command - show main menu
bot.command('start', async (ctx) => {
  await showMainMenu(ctx);
});

// Admin command - show admin menu
bot.command('admin', async (ctx) => {
  await showAdminMenu(ctx);
});

// Help command
bot.command('help', async (ctx) => {
  await showHelp(ctx);
});

// About command
bot.command('about', async (ctx) => {
  await showAbout(ctx);
});

// Cancel command
bot.command('cancel', async (ctx) => {
  ctx.session.creatingOutlineKey = false;
  delete ctx.session.keyName;
  await ctx.reply('❌ Operation cancelled.');
});

// Supported Outline encryptions
const OUTLINE_CIPHERS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
];

// Callback query handlers
bot.on('callback_query:data', async (ctx) => {
  const action = ctx.callbackQuery.data;

  // Handle per-key show request: show_key:<id>
  if (action && action.startsWith('show_key:')) {
    const parts = action.split(':');
    const id = Number(parts[1]);
    const users = loadUsers() ?? [];
    const user = users.find(u => Number(u.id) === id);
    if (user) {
      await ctx.answerCallbackQuery({ text: `Access key for ${user.username}: ${user.apiKey}`, show_alert: true });
    } else {
      await ctx.answerCallbackQuery('Key not found');
    }

    return;
  }

  // Handle cipher selection
  if (action && action.startsWith('select_cipher:') && ctx.session.creatingOutlineKey) {
    const cipher = action.split(':')[1];
    const keyName = ctx.session.keyName!;
    const username = ctx.from?.username || `user_${ctx.from?.id}`;

    try {
      await ctx.reply('⏳ Creating Outline access key with selected encryption...');
      const apiKey = await createOutlineAccessKey(username, cipher);

      const users = loadUsers() ?? [];
      const saved = users.find(u => u.username === username);
      const masked = apiKey ? `${apiKey.slice(0,6)}...${apiKey.slice(-6)}` : 'N/A';

      const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
      if (saved) keyboard.push([{ text: '📋 Copy key', callback_data: `show_key:${saved.id}` }]);
      keyboard.push(...BUTTONS.backToOutlineMenu());

      await ctx.reply(
        `✅ <b>Outline Access Key Created Successfully!</b>\n\n` +
          `<b>Key Name:</b> ${keyName}\n` +
          `<b>Encryption:</b> ${cipher}\n` +
          `<b>API Key:</b> <code>${masked}</code>\n\n` +
          `Click the button below to view and copy the full key.`,
        {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: keyboard },
        }
      );

      ctx.session.creatingOutlineKey = false;
      delete ctx.session.keyName;
    } catch (error) {
      console.error('Error creating access key:', error);
      await ctx.reply('❌ Error creating access key. Please try again.', {
        reply_markup: { inline_keyboard: BUTTONS.backToOutlineMenu() },
      });
      ctx.session.creatingOutlineKey = false;
      delete ctx.session.keyName;
    }

    await ctx.answerCallbackQuery();
    return;
  }

  try {
    switch (action) {
      case CALLBACK_DATA.MAIN_MENU:
      case CALLBACK_DATA.BACK:
        await showMainMenu(ctx);
        break;

      case CALLBACK_DATA.ADMIN_MENU:
        await showAdminMenu(ctx);
        break;

      case CALLBACK_DATA.HELP:
        await showHelp(ctx);
        break;

      case CALLBACK_DATA.ABOUT:
        await showAbout(ctx);
        break;

      case CALLBACK_DATA.ADMIN_SERVER_INFO:
        await handleServerInfo(ctx);
        break;

      case CALLBACK_DATA.ADMIN_OUTLINE_KEYS:
        await handleOutlineKeys(ctx);
        break;

      case CALLBACK_DATA.ADMIN_API_INFO:
        await handleAPIInfo(ctx, {
          environment: process.env.NODE_ENV || 'development',
          apiVersion: '1.0.0',
          outlineApiUrl: process.env.API_URL || '',
          adminIds: [BigInt(process.env.ADMIN_ID || '0')],
        });
        break;

      case CALLBACK_DATA.OUTLINE_CREATE_KEY:
        await startOutlineKeyCreation(ctx);
        break;

      case CALLBACK_DATA.OUTLINE_LIST_KEYS:
        await listOutlineKeys(ctx);
        break;

      default:
        if (action.startsWith('show_key:')) {
          await handleShowKey(ctx);
        } else if (action.startsWith('delete_key_msg')) {
          await handleDeleteKeyMsg(ctx);
        } else {
          await ctx.answerCallbackQuery('Unknown action');
        }
    }

    await ctx.answerCallbackQuery();
  } catch (error) {
    console.error('Error handling callback query:', error);
    await ctx.answerCallbackQuery('An error occurred');
  }
});

// Message handler for creating Outline keys
bot.on('message:text', async (ctx) => {
  // Step 1: user enters key name
  if (ctx.session.creatingOutlineKey && !ctx.session.keyName) {
    const keyName = ctx.message.text;
    ctx.session.keyName = keyName;

    // Show encryption selection menu
    const keyboard = OUTLINE_CIPHERS.map(cipher => [
      { text: cipher, callback_data: `select_cipher:${cipher}` },
    ]);
    keyboard.push([{ text: 'Skip (use chacha)', callback_data: 'select_cipher:chacha20-ietf-poly1305' }]);

    await ctx.reply('🔐 Choose encryption for your Outline key:', {
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  // Default message handler
  await ctx.reply('👋 Hello! Use /start to open the main menu or /help for available commands.');
});

// Error handler
bot.catch((error) => {
  console.error('Bot error:', error);
});

// Start the bot
bot.start({
  onStart: async (botInfo) => {
    console.log(`✅ Bot started: @${botInfo.username}`);
  },
});
