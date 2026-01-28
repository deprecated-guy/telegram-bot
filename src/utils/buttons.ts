/**
 * Centralized callback data constants for inline buttons
 */

export const CALLBACK_DATA = {
  // Main menu
  MAIN_MENU: 'main_menu',
  BACK: 'back',

  // Admin
  ADMIN_MENU: 'admin_menu',
  ADMIN_SERVER_INFO: 'admin_server_info',
  ADMIN_OUTLINE_KEYS: 'admin_outline_keys',
  ADMIN_API_INFO: 'admin_api_info',

  // Help and About
  HELP: 'help',
  ABOUT: 'about',

  // Outline keys
  OUTLINE_CREATE_KEY: 'outline_create_key',
  OUTLINE_LIST_KEYS: 'outline_list_keys',
};

export type CallbackDataType = typeof CALLBACK_DATA[keyof typeof CALLBACK_DATA];

/**
 * Button builders - return inline keyboard button arrays
 */

export const BUTTONS = {
  mainMenu: () => [
    [{ text: '👨‍💼 Admin Panel', callback_data: CALLBACK_DATA.ADMIN_MENU }],
    [{ text: '📚 Help', callback_data: CALLBACK_DATA.HELP }],
    [{ text: '❓ About', callback_data: CALLBACK_DATA.ABOUT }],
  ],

  adminMenu: () => [
    [{ text: '📊 Server Info', callback_data: CALLBACK_DATA.ADMIN_SERVER_INFO }],
    [{ text: '🔑 Manage Outline Keys', callback_data: CALLBACK_DATA.ADMIN_OUTLINE_KEYS }],
    [{ text: '⚙️ API Configuration', callback_data: CALLBACK_DATA.ADMIN_API_INFO }],
    [{ text: '🔙 Back', callback_data: CALLBACK_DATA.BACK }],
  ],

  serverInfoActions: () => [
    [{ text: '🔄 Refresh', callback_data: CALLBACK_DATA.ADMIN_SERVER_INFO }],
    [{ text: '🔙 Back', callback_data: CALLBACK_DATA.ADMIN_MENU }],
  ],

  outlineKeysMenu: () => [
    [{ text: '➕ Create New Key', callback_data: CALLBACK_DATA.OUTLINE_CREATE_KEY }],
    [{ text: '📋 List Keys', callback_data: CALLBACK_DATA.OUTLINE_LIST_KEYS }],
    [{ text: '🔙 Back', callback_data: CALLBACK_DATA.ADMIN_MENU }],
  ],

  backToAdmin: () => [
    [{ text: '🔙 Back', callback_data: CALLBACK_DATA.ADMIN_MENU }],
  ],

  backToOutlineMenu: () => [
    [{ text: '🔙 Back to Outline Menu', callback_data: CALLBACK_DATA.ADMIN_OUTLINE_KEYS }],
  ],

  cancelOutlineKey: () => [
    [{ text: '❌ Cancel', callback_data: CALLBACK_DATA.ADMIN_OUTLINE_KEYS }],
  ],

  backToMainMenu: () => [
    [{ text: '🔙 Back', callback_data: CALLBACK_DATA.MAIN_MENU }],
  ],
};
