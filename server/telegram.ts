import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * إرسال رسالة نصية عبر Telegram
 */
export async function sendTelegramMessage(
  chatId: string | number, 
  text: string,
  options?: {
    reply_markup?: {
      inline_keyboard?: Array<Array<{ text: string; url?: string; callback_data?: string }>>;
    };
  }
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[Telegram] Bot token not configured");
    return false;
  }

  try {
    const response = await axios.post(`${TELEGRAM_API_URL}/sendMessage`, {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      ...options,
    });

    return response.data.ok;
  } catch (error: any) {
    console.error("[Telegram] Error sending message:", error.response?.data || error.message);
    return false;
  }
}

/**
 * التحقق من صحة Token البوت
 */
export async function verifyBotToken(): Promise<{ valid: boolean; botInfo?: any }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { valid: false };
  }

  try {
    const response = await axios.get(`${TELEGRAM_API_URL}/getMe`);
    
    if (response.data.ok) {
      return {
        valid: true,
        botInfo: response.data.result,
      };
    }

    return { valid: false };
  } catch (error) {
    console.error("[Telegram] Error verifying bot token:", error);
    return { valid: false };
  }
}

/**
 * إرسال تنبيه بتسجيل قراءة جديدة
 */
export async function sendReadingCompletedNotification(
  chatId: string | number,
  personName: string,
  fridayNumber: number,
  juzNumber: number
): Promise<boolean> {
  const message = `
✅ <b>تم تسجيل قراءتك بنجاح!</b>

👤 الاسم: ${personName}
📅 الجمعة: ${fridayNumber}
📖 الجزء: ${juzNumber}

جزاك الله خيراً على المواظبة! 🌟
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

/**
 * إرسال تذكير أسبوعي للمشاركين
 */
export async function sendWeeklyReminder(
  chatId: string | number,
  personName: string,
  fridayNumber: number,
  juzNumber: number
): Promise<boolean> {
  const message = `
🔔 <b>تذكير بموعد القراءة</b>

السلام عليكم ${personName}،

هذا تذكير بقراءة الجزء المخصص لك:
📅 الجمعة: ${fridayNumber}
📖 الجزء: ${juzNumber}

نسأل الله أن يتقبل منا ومنكم صالح الأعمال 🤲
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

/**
 * إرسال تقرير يومي للمشرفين
 */
export async function sendDailyReportToAdmins(
  adminChatIds: (string | number)[],
  stats: {
    fridayNumber: number;
    completed: number;
    pending: number;
    percentage: number;
  }
): Promise<void> {
  const message = `
📊 <b>التقرير اليومي - الجمعة ${stats.fridayNumber}</b>

✅ المكتمل: ${stats.completed}
⏳ المنتظر: ${stats.pending}
📈 النسبة: ${stats.percentage.toFixed(1)}%

${stats.percentage >= 80 ? "🎉 أداء ممتاز!" : stats.percentage >= 50 ? "👍 أداء جيد" : "⚠️ يحتاج متابعة"}
  `.trim();

  for (const chatId of adminChatIds) {
    await sendTelegramMessage(chatId, message);
  }
}

/**
 * إرسال تنبيه للمتأخرين عن القراءة
 */
export async function sendLateReadingAlert(
  chatId: string | number,
  personName: string,
  fridayNumber: number,
  juzNumber: number,
  daysLate: number
): Promise<boolean> {
  const message = `
⚠️ <b>تنبيه: قراءة متأخرة</b>

عزيزي ${personName}،

لم يتم تسجيل قراءتك بعد:
📅 الجمعة: ${fridayNumber}
📖 الجزء: ${juzNumber}
⏰ متأخر: ${daysLate} ${daysLate === 1 ? "يوم" : "أيام"}

نرجو منك إتمام القراءة في أقرب وقت 🙏
  `.trim();

  return await sendTelegramMessage(chatId, message);
}

/**
 * إرسال رسالة ترحيب عند ربط الحساب
 */
export async function sendWelcomeMessage(
  chatId: string | number,
  personName: string
): Promise<boolean> {
  const message = `
🎉 <b>مرحباً بك في بوت ختمة الروضة الشاذلية!</b>

تم ربط حسابك بنجاح يا ${personName}

من الآن فصاعداً ستصلك:
• ✅ تأكيد عند تسجيل قراءتك
• 🔔 تذكير أسبوعي بموعد القراءة
• 📊 تحديثات عن تقدم الختمة

بارك الله فيك ووفقك لما يحب ويرضى 🤲
  `.trim();

  return await sendTelegramMessage(chatId, message);
}
