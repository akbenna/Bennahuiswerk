import { cfg, log } from './config.js';

export async function notify(text) {
  if (!cfg.telegramToken || !cfg.telegramChat) return;
  try {
    await fetch(`https://api.telegram.org/bot${cfg.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: cfg.telegramChat, text, disable_web_page_preview: true }),
    });
  } catch (e) {
    log(`Telegram-melding mislukt: ${e.message}`);
  }
}
