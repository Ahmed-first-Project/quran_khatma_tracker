import { Router } from "express";
import * as db from "./db";
import { sendTelegramMessage } from "./telegram";

const router = Router();

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

/**
 * Webhook endpoint لاستقبال رسائل Telegram
 */
router.post("/api/telegram/webhook", async (req, res) => {
  try {
    const update: TelegramUpdate = req.body;

    if (!update.message || !update.message.text) {
      return res.sendStatus(200);
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text.trim();
    const username = update.message.from.username;
    const firstName = update.message.from.first_name;

    // معالجة أمر /start
    if (text === "/start") {
      await sendTelegramMessage(
        chatId,
        `🌙 مرحباً بك في بوت ختمة الروضة الشاذلية!\n\n` +
          `للربط بحسابك، أرسل اسمك الكامل كما هو مسجل في قائمة المشاركين.\n\n` +
          `مثال: أحمد اللاذقاني`
      );
      return res.sendStatus(200);
    }

    // محاولة ربط الحساب بالاسم المرسل
    const result = await db.linkTelegramAccount(text, chatId, username);

    if (result.success) {
      await sendTelegramMessage(
        chatId,
        `✅ تم ربط حسابك بنجاح!\n\n` +
          `الاسم: ${result.person?.name}\n\n` +
          `ستصلك الآن جميع التنبيهات والتذكيرات. بارك الله فيك! 🤲`
      );
    } else {
      // إذا فشل الربط، إرسال رسالة توضيحية
      await sendTelegramMessage(
        chatId,
        `❌ ${result.message}\n\n` +
          `تأكد من كتابة اسمك بالضبط كما هو في القائمة.\n\n` +
          `إذا كنت متأكداً من الاسم، تواصل مع المشرف.`
      );
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    res.sendStatus(500);
  }
});

export default router;
