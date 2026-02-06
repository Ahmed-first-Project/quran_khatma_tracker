import { Router } from "express";
import * as db from "./db";
import { sendTelegramMessage } from "./telegram";
import { getMotivationalMessage, MotivationalContext } from "./motivationalMessages";

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
  callback_query?: {
    id: string;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
    };
    data?: string;
  };
}

/**
 * Webhook endpoint لاستقبال رسائل Telegram
 */
router.post("/api/telegram/webhook", async (req, res) => {
  try {
    const update: TelegramUpdate = req.body;

    // معالجة callback queries (الأزرار التفاعلية)
    if (update.callback_query) {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const callbackQuery = update.callback_query;
      const chatId = callbackQuery.message?.chat.id.toString() || callbackQuery.from.id.toString();
      const data = callbackQuery.data || "";
      const firstName = callbackQuery.from.first_name;
      
      await handleCallbackQuery(callbackQuery.id, chatId, data, firstName);
      return res.sendStatus(200);
    }

    if (!update.message || !update.message.text) {
      return res.sendStatus(200);
    }

    const chatId = update.message.chat.id.toString();
    const text = update.message.text.trim();
    const username = update.message.from.username;
    const firstName = update.message.from.first_name;

    // معالجة أمر /help
    if (text === "/help" || text === "/مساعدة") {
      const { getHelpKeyboard } = await import("./telegramKeyboards");
      const helpMessage = `❓ <b>كيفية استخدام البوت</b>\n\n` +
        `🕋 <b>للمشاركين الجدد:</b>\n` +
        `1️⃣ اضغط "ابدأ الآن"\n` +
        `2️⃣ أرسل اسمك الكامل (كما هو في القائمة)\n` +
        `3️⃣ انتظر رسالة التأكيد\n\n` +
        `✅ <b>لتسجيل قراءتك:</b>\n` +
        `• اضغط زر "سجّل قراءتك" من القائمة\n` +
        `• أو أرسل الأمر: /تم\n\n` +
        `📊 <b>لمعرفة إحصائياتك:</b>\n` +
        `• اضغط زر "إحصائياتي" من القائمة\n` +
        `• أو أرسل الأمر: /حالتي\n\n` +
        `💡 <b>نصيحة:</b> استخدم الأزرار التفاعلية لتجربة أسهل وأسرع!`;
      await sendTelegramMessage(chatId, helpMessage, { reply_markup: getHelpKeyboard() });
      return res.sendStatus(200);
    }

    // معالجة أمر /start
    if (text === "/start") {
      const { getStartKeyboard } = await import("./telegramKeyboards");
      await sendTelegramMessage(
        chatId,
        `🕋 <b>مرحباً ${firstName}!</b>\n\n` +
          `أهلاً بك في <b>بوت ختمة الروضة الشاذلية</b>\n\n` +
          `🌟 برنامج قرآني مبارك لختم القرآن الكريم بشكل جماعي كل جمعة.\n\n` +
          `📚 <b>الهدف:</b> ختم القرآن كاملاً كل أسبوع\n` +
          `👥 <b>المشاركون:</b> 60 مجموعة (3 أشخاص لكل مجموعة)\n` +
          `📝 <b>المهمة:</b> كل شخص يقرأ جزءاً واحداً في الأسبوع\n\n` +
          `جعلنا الله وإياكم من أهل القرآن 🤲`,
        { reply_markup: getStartKeyboard() }
      );
      return res.sendStatus(200);
    }

    // معالجة أمر /حالتي لعرض حالة المشارك
    if (text === "/حالتي" || text === "/status") {
      // التحقق من ربط الحساب
      const person = await db.getPersonByChatId(chatId);
      
      if (!person) {
        await sendTelegramMessage(
          chatId,
          `❌ لم يتم ربط حسابك بعد!\n\n` +
            `لاستخدام هذا الأمر، يجب عليك أولاً ربط حسابك بإرسال اسمك الكامل.\n\n` +
            `مثال: أحمد اللاذقاني`
        );
        return res.sendStatus(200);
      }
      
      // حساب الإحصائيات
      const consecutiveReadings = await db.getConsecutiveReadings(person.name);
      const completionRate = await db.getCompletionRate(person.name);
      const totalCompleted = await db.getTotalCompletedReadings(person.name);
      const pendingCount = await db.getPendingReadingsCount(person.name);
      const lastReading = await db.getLastCompletedReading(person.name);
      const groupRanking = await db.getGroupRanking(person.name);
      
      // بناء رسالة الحالة
      let statusMessage = `📊 <b>حالة قراءاتك</b>\n\n`;
      statusMessage += `👤 الاسم: ${person.name}\n`;
      statusMessage += `───────────────\n\n`;
      
      // إحصائيات القراءات
      statusMessage += `✅ <b>قراءات مكتملة:</b> ${totalCompleted}\n`;
      statusMessage += `⏳ <b>قراءات منتظرة:</b> ${pendingCount}\n`;
      statusMessage += `🔥 <b>قراءات متتالية:</b> ${consecutiveReadings}\n`;
      statusMessage += `💯 <b>نسبة الإنجاز:</b> ${completionRate}%\n\n`;
      
      // آخر قراءة
      if (lastReading) {
        const lastReadingDate = new Date(lastReading.completedAt);
        const formattedDate = lastReadingDate.toLocaleDateString('ar-SA', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        statusMessage += `📖 <b>آخر قراءة:</b>\n`;
        statusMessage += `   • الجمعة: ${lastReading.fridayNumber}\n`;
        statusMessage += `   • الجزء: ${lastReading.juzNumber}\n`;
        statusMessage += `   • التاريخ: ${formattedDate}\n\n`;
      } else {
        statusMessage += `📖 <b>آخر قراءة:</b> لم تسجل بعد\n\n`;
      }
      
      // ترتيب المجموعة
      if (groupRanking) {
        const rankEmoji = groupRanking.rank === 1 ? '🥇' : groupRanking.rank === 2 ? '🥈' : groupRanking.rank === 3 ? '🥉' : '🏅';
        statusMessage += `${rankEmoji} <b>ترتيبك في المجموعة:</b> ${groupRanking.rank} من ${groupRanking.totalMembers}\n\n`;
      }
      
      // رسائل تحفيزية
      if (consecutiveReadings >= 10) {
        statusMessage += `🌟 ماشاء الله! التزام مميز!\n`;
      } else if (consecutiveReadings >= 5) {
        statusMessage += `💪 رائع! استمر على هذا التميز!\n`;
      } else if (pendingCount > 0) {
        statusMessage += `📌 لديك ${pendingCount} قراءة منتظرة. أرسل /تم لتسجيلها!\n`;
      }
      
      statusMessage += `\nجزاك الله خيراً 🤲`;
      
      const { getMainMenuKeyboard } = await import("./telegramKeyboards");
      await sendTelegramMessage(chatId, statusMessage, { reply_markup: getMainMenuKeyboard() });
      return res.sendStatus(200);
    }

    // معالجة أمر /تم لتسجيل القراءة
    if (text === "/تم" || text === "/done") {
      // التحقق من ربط الحساب
      const person = await db.getPersonByChatId(chatId);
      
      if (!person) {
        await sendTelegramMessage(
          chatId,
          `❌ لم يتم ربط حسابك بعد!\n\n` +
            `لاستخدام هذا الأمر، يجب عليك أولاً ربط حسابك بإرسال اسمك الكامل.\n\n` +
            `مثال: أحمد اللاذقاني`
        );
        return res.sendStatus(200);
      }
      
      // البحث عن آخر قراءة منتظرة للمشارك
      const allReadings = await db.getReadingsByPerson(person.name);
      
      // فلترة القراءات المنتظرة فقط
      const pendingReadings = allReadings.filter(reading => {
        if (reading.person1Name === person.name && !reading.person1Status) return true;
        if (reading.person2Name === person.name && !reading.person2Status) return true;
        if (reading.person3Name === person.name && !reading.person3Status) return true;
        return false;
      });
      
      if (pendingReadings.length === 0) {
        await sendTelegramMessage(
          chatId,
          `✅ ماشاء الله!\n\n` +
            `لا توجد قراءات منتظرة لك حالياً.\n` +
            `جميع قراءاتك مسجلة بنجاح! 🎉`
        );
        return res.sendStatus(200);
      }
      
      // أخذ أول قراءة منتظرة
      const nextReading = pendingReadings[0];
      
      // تحديد رقم الشخص (1, 2, أو 3)
      let personNumber: 1 | 2 | 3 = 1;
      if (nextReading.person2Name === person.name && !nextReading.person2Status) {
        personNumber = 2;
      } else if (nextReading.person3Name === person.name && !nextReading.person3Status) {
        personNumber = 3;
      }
      
      // تسجيل القراءة
      const success = await db.updateReadingStatus(
        nextReading.id,
        personNumber,
        true,
        new Date()
      );
      
      if (success) {
        // حساب الإنجازات للرسائل التحفيزية
        const consecutiveReadings = await db.getConsecutiveReadings(person.name);
        const completionRate = await db.getCompletionRate(person.name);
        const totalCompleted = await db.getTotalCompletedReadings(person.name);
        const isFirstInGroupResult = await db.isFirstInGroup(person.name, nextReading.fridayNumber, nextReading.groupNumber);
        const isFirstOverallResult = await db.isFirstOverall(person.name, nextReading.fridayNumber);
        
        // إنشاء سياق الرسائل التحفيزية
        const motivationalContext: MotivationalContext = {
          consecutiveReadings,
          totalCompleted,
          completionRate,
          isFirstInGroup: isFirstInGroupResult,
          isFirstOverall: isFirstOverallResult,
          weekNumber: nextReading.fridayNumber,
        };
        
        // الحصول على الرسالة التحفيزية
        const motivationalMessage = getMotivationalMessage(motivationalContext);
        
        const { getMainMenuKeyboard } = await import("./telegramKeyboards");
        const remainingCount = pendingReadings.length - 1;
        await sendTelegramMessage(
          chatId,
          `✅ <b>تم تسجيل قراءتك بنجاح!</b>\n\n` +
            `👤 <b>الاسم:</b> ${person.name}\n` +
            `📅 <b>الجمعة:</b> ${nextReading.fridayNumber}\n` +
            `📖 <b>الجزء:</b> ${nextReading.juzNumber}\n` +
            `📚 <b>الختمة:</b> ${nextReading.khatmaNumber}\n\n` +
            `${motivationalMessage}\n\n` +
            (remainingCount > 0 
              ? `📋 باقي لديك <b>${remainingCount}</b> قراءة منتظرة.`
              : `🎉 ممتاز! جميع قراءاتك مسجلة بنجاح!`),
          { reply_markup: getMainMenuKeyboard() }
        );
      } else {
        await sendTelegramMessage(
          chatId,
          `❌ حدث خطأ أثناء تسجيل القراءة.\n\n` +
            `يرجى المحاولة مرة أخرى أو التواصل مع المشرف.`
        );
      }
      
      return res.sendStatus(200);
    }

    // محاولة ربط الحساب بالاسم المرسل
    const result = await db.linkTelegramAccount(text, chatId, username);

    if (result.success) {
      const { getMainMenuKeyboard } = await import("./telegramKeyboards");
      await sendTelegramMessage(
        chatId,
        `✅ <b>تم ربط حسابك بنجاح!</b>\n\n` +
          `👤 <b>الاسم:</b> ${result.person?.name}\n\n` +
          `🔔 ستصلك الآن جميع التنبيهات والتذكيرات.\n\n` +
          `📚 استخدم القائمة أدناه للتفاعل مع البوت:\n\n` +
          `بارك الله فيك 🤲`,
        { reply_markup: getMainMenuKeyboard() }
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
