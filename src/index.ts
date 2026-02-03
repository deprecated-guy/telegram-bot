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
import { ensureDbExists } from './utils/database';

dotenv.config();
ensureDbExists();

// ================= SESSION =================
interface SessionData {
  creatingOutlineKey: boolean;
  keyName?: string;
}

type BotContext = Context & SessionFlavor<SessionData>;
const bot = new Bot<BotContext>(process.env.BOT_TOKEN || '');
bot.use(session({ initial: () => ({  }) }));

// ================= UTILS =================
const ADMIN_ID = Number(process.env.ADMIN_ID);
const isAdmin = (ctx: BotContext) => ctx.from?.id === ADMIN_ID;

const OUTLINE_CIPHERS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
  'xchacha20-ietf-poly1305',
];

// ================= COMMANDS =================
bot.command('start', async (ctx) => {
  if (isAdmin(ctx)) {
    await showAdminMenu(ctx);
  } else {
    // обычный пользователь видит только кнопку Create Key
    await ctx.reply('👋 Welcome! Click to create your Outline key:', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Create Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY }]],
      },
    });
  }
});
bot.command('help', showHelp);
bot.command('about', showAbout);

bot.command('admin', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.reply('⛔ Access denied');
    return;
  }
  await showAdminMenu(ctx);
});

bot.command('cancel', async (ctx) => {
  ctx.session.creatingOutlineKey = false;
  delete ctx.session.keyName;
  await ctx.reply('❌ Operation cancelled.');
});

// ================= CALLBACKS =================
bot.on('callback_query:data', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const userId = ctx.from?.id ?? 0;

  // ===== COPY KEY (SEND TO OWNER) =====
  if (action?.startsWith('send_key:')) {
    const keyOwnerId = Number(action.split(':')[1]);
    const users = loadUsers() ?? [];
    const owner = users.find(u => Number(u.telegramId) === keyOwnerId);

    if (!owner) {
      await ctx.answerCallbackQuery('❌ User not found');
      return;
    }

    try {
      await ctx.api.sendMessage(
        owner.telegramId,
        `🔐 <b>Вот твой ключ:</b>\n\n<code>${owner.apiKey}</code>`,
        { parse_mode: 'HTML' }
      );
      await ctx.answerCallbackQuery('✅ Key sent to user');
    } catch (err) {
      console.error(err);
      await ctx.answerCallbackQuery('❌ Failed to send key');
    }
    return;
  }

  // ===== SELECT CIPHER =====
  if (action?.startsWith('select_cipher:') && ctx.session.creatingOutlineKey) {
    const cipher = action.split(':')[1];
    const username = ctx.from?.username || `user_${userId}`;

    const users = loadUsers() ?? [];
    const alreadyExists = users.find(u => u.telegramId === userId);

    if (!isAdmin(ctx) && alreadyExists) {
      await ctx.reply('❌ You already have an Outline key.');
      ctx.session.creatingOutlineKey = false;
      return;
    }

    try {
      const apiKey = await createOutlineAccessKey(username, userId, cipher);
      await ctx.reply(
        `✅ <b>Your Outline key has been created!</b>\n\n<code>${apiKey}</code>`,
        { parse_mode: 'HTML' }
      );
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Error creating key');
    }

    ctx.session.creatingOutlineKey = false;
    delete ctx.session.keyName;
    await ctx.answerCallbackQuery();
    return;
  }

  // ===== MENU ROUTING =====
  try {
    switch (action) {
      case CALLBACK_DATA.MAIN_MENU:
      case CALLBACK_DATA.BACK:
        if (isAdmin(ctx)) {
          await showAdminMenu(ctx);
        } else {
          // обычный пользователь видит только Create Key
          await ctx.reply('👋 Click to create your Outline key:', {
            reply_markup: {
              inline_keyboard: [[{ text: 'Create Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY }]],
            },
          });
        }
        break;

      case CALLBACK_DATA.ADMIN_MENU:
        await showAdminMenu(ctx);
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
        ctx.session.creatingOutlineKey = true;
        await ctx.reply('✏️ Enter a name for your Outline key:');
        break;

      case CALLBACK_DATA.OUTLINE_LIST_KEYS:
        await listOutlineKeys(ctx);
        break;

      default:
        await ctx.answerCallbackQuery('Unknown action');
    }

    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error(err);
    await ctx.answerCallbackQuery('Error');
  }
});

// ================= MESSAGE =================
bot.on('message:text', async (ctx) => {
  if (ctx.session.creatingOutlineKey && !ctx.session.keyName) {
    ctx.session.keyName = ctx.message.text;

    const keyboard = OUTLINE_CIPHERS.map((c) => [
      { text: c, callback_data: `select_cipher:${c}` },
    ]);

    keyboard.push([{ text: 'Skip (use chacha)', callback_data: 'select_cipher:chacha20-ietf-poly1305' }]);

    await ctx.reply('🔐 Choose encryption for your key:', {
      reply_markup: { inline_keyboard: keyboard },
    });
    return;
  }

  await ctx.reply('Use /start');
});

// ================= START =================
bot.catch(console.error);

bot.start({
  onStart: (info) => {
    console.log(`🤖 Bot started: @${info.username}`);
  },
});
