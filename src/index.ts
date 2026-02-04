import { Bot, Context, session, SessionFlavor } from 'grammy';
import { showMainMenu, showHelp, showAbout } from './handlers/menu';
import {
  showAdminMenu,
  handleServerInfo,
  handleOutlineKeys,
  handleAPIInfo,
  startOutlineKeyCreation,
  handleSelectUser,
  handleShowKey,
  handleDeleteKeyMsg,
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
  targetUserId?: number;
}

export type BotContext = Context & SessionFlavor<SessionData>;
const bot = new Bot<BotContext>(process.env.BOT_TOKEN || '');
bot.use(session({ initial: () => ({}) }));

// ================= UTILS =================
const ADMIN_ID = Number(process.env.ADMIN_ID);
const isAdmin = (ctx: BotContext) => ctx.from?.id === ADMIN_ID;

const OUTLINE_CIPHERS = [
  'aes-128-gcm',
  'aes-256-gcm',
  'chacha20-ietf-poly1305',
];

// ================= INSTRUCTION =================
const showInstruction = async (ctx: BotContext) => {
  const instructionText = `
📌 How to use Outline key with apps:

(All systems) Karing: https://karing.app/en/download/
(iOS) Streisand: https://streisandapp.com
(All Systems, no iOS) v2rayNG: https://github.com/2dust/v2rayNG/releases/tag/1.10.32

1️⃣ Download the app you need

2️⃣ Add profile:
  2.1 Open the app

  Karing:
    - Click "Add profile" in menu
    - Click "Import from clipboard"
    - Click "Save"
    - Go to main menu, select the profile
    - Click arrow at bottom → your profile name → click "no name: 0"
    - Go to main menu, click DNS, and turn it on

  Streisand:
    - Click plus icon on top
    - Click "Import from clipboard"

  V2RayNG:
    - Ctrl+V (paste)

3️⃣ All done! Use it.
`;

  await ctx.reply(instructionText, { parse_mode: 'Markdown' });
};

// ================= COMMANDS =================
bot.command('start', async (ctx) => {
  if (isAdmin(ctx)) {
    await showAdminMenu(ctx);
  } else {
    await ctx.reply('👋 Welcome! Click to create your Outline key:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Create Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY }],
          [{ text: 'Instruction', callback_data: 'instructions' }],
        ],
      },
    });
  }
});

bot.command('help', showHelp);
bot.command('about', showAbout);
bot.command('instruction', showInstruction);

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
  delete ctx.session.targetUserId;
  await ctx.reply('❌ Operation cancelled.');
});

// ================= CALLBACKS =================
bot.on('callback_query:data', async (ctx) => {
  const action = ctx.callbackQuery.data;
  const userId = ctx.from?.id ?? 0;

  // ===== SHOW INSTRUCTION =====
  if (action === 'instructions') {
    await showInstruction(ctx);
    await ctx.answerCallbackQuery();
    return;
  }

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

  // ===== ADMIN CREATE KEY FLOW =====
  if (isAdmin(ctx) && action === CALLBACK_DATA.OUTLINE_CREATE_KEY) {
    ctx.session.creatingOutlineKey = true;
    ctx.session.keyName = undefined;
    ctx.session.targetUserId = undefined;

    await ctx.reply('✏️ Enter the Telegram ID of the user for whom you want to create a key:');
    await ctx.answerCallbackQuery();
    return;
  }

  // ===== SELECT CIPHER =====
  if (action?.startsWith('select_cipher:') && ctx.session.creatingOutlineKey && ctx.session.keyName) {
    const cipher = action.split(':')[1];
    const username = ctx.session.keyName;
    const targetId = ctx.session.targetUserId ?? userId;

    const users = loadUsers() ?? [];
    const alreadyExists = users.find(u => u.telegramId === targetId);

    if (!isAdmin(ctx) && alreadyExists) {
      await ctx.reply('❌ You already have an Outline key.');
      ctx.session.creatingOutlineKey = false;
      delete ctx.session.keyName;
      delete ctx.session.targetUserId;
      return;
    }

    try {
      const apiKey = await createOutlineAccessKey(username, targetId, cipher);
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
    delete ctx.session.targetUserId;
    await ctx.answerCallbackQuery();
    return;
  }

  // ===== MENU ROUTING =====
  try {
    if (!action) return;

    // кнопка для выбора пользователя
    if (action.startsWith('select_user:')) {
      await handleSelectUser(ctx);
      return;
    }

    // показать ключ пользователя
    if (action.startsWith('show_key:')) {
      await handleShowKey(ctx);
      return;
    }

    // удалить сообщение с ключом
    if (action.startsWith('delete_key_msg')) {
      await handleDeleteKeyMsg(ctx);
      return;
    }

    switch (action) {
      case CALLBACK_DATA.MAIN_MENU:
      case CALLBACK_DATA.BACK:
        if (isAdmin(ctx)) {
          await showAdminMenu(ctx);
        } else {
          await ctx.reply('👋 Click to create your Outline key:', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Create Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY }],
                [{ text: 'Instruction', callback_data: 'instructions' }],
              ],
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

      case CALLBACK_DATA.OUTLINE_LIST_KEYS:
        await handleOutlineKeys(ctx);
        break;

      default:
        await ctx.answerCallbackQuery('Unknown action');
    }
  } catch (err) {
    console.error(err);
    await ctx.answerCallbackQuery('Error');
  }
});

// ================= MESSAGE =================
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;

  // Админ вводит ID пользователя
  if (ctx.session.creatingOutlineKey && !ctx.session.targetUserId && isAdmin(ctx)) {
    const targetId = Number(text);
    if (isNaN(targetId)) {
      await ctx.reply('❌ Invalid user ID. Try again.');
      return;
    }

    ctx.session.targetUserId = targetId;
    await ctx.reply('✏️ Enter a name/username for this Outline key:');
    return;
  }

  // Ввод имени для ключа (обычный пользователь или админ после ID)
  if (ctx.session.creatingOutlineKey && !ctx.session.keyName) {
    ctx.session.keyName = text;

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
