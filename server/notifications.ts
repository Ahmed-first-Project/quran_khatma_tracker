import * as db from "./db";
import { sendTelegramMessage } from "./telegram";

/**
 * إرسال تنبيه عند تسجيل قراءة
 */
export async function notifyReadingCompleted(
  readingId: number,
  personName: string,
  personNumber: 1 | 2 | 3
) {
  try {
    // الحصول على معلومات القراءة
    const reading = await db.getReadingById(readingId);
    if (!reading) {
      console.error("[Notifications] Reading not found:", readingId);
      return;
    }

    // الحصول على معلومات الشخص من جدول persons
    const allPersons = await db.getAllPersons();
    const person = allPersons.find((p) => p.name === personName);
    
    if (!person || !person.telegramChatId) {
      console.log("[Notifications] Person not linked to Telegram:", personName);
      return;
    }

    // إرسال تنبيه للشخص
    const message =
      `✅ تم تسجيل قراءتك بنجاح!\n\n` +
      `📖 الجزء: ${reading.juzNumber}\n` +
      `🕌 الختمة: ${reading.khatmaNumber}\n` +
      `📅 الجمعة: ${reading.fridayNumber}\n` +
      `👥 المجموعة: ${reading.groupNumber}\n\n` +
      `بارك الله فيك! 🤲`;

    await sendTelegramMessage(person.telegramChatId, message);

    // إرسال تنبيه للمشرفين
    await notifyAdminsReadingCompleted(reading, personName, personNumber);
  } catch (error) {
    console.error("[Notifications] Error sending reading notification:", error);
  }
}

/**
 * إرسال تنبيه للمشرفين عند اكتمال قراءة
 */
async function notifyAdminsReadingCompleted(
  reading: any,
  personName: string,
  personNumber: 1 | 2 | 3
) {
  try {
    // الحصول على جميع المشرفين المرتبطين بـ Telegram
    const admins = await db.getLinkedAdmins();

    if (admins.length === 0) {
      console.log("[Notifications] No admins linked to Telegram");
      return;
    }

    const message =
      `🔔 تنبيه جديد: قراءة مكتملة\n\n` +
      `👤 الاسم: ${personName}\n` +
      `📖 الجزء: ${reading.juzNumber}\n` +
      `🕌 الختمة: ${reading.khatmaNumber}\n` +
      `📅 الجمعة: ${reading.fridayNumber}\n` +
      `👥 المجموعة: ${reading.groupNumber}`;

    // إرسال لجميع المشرفين
    for (const admin of admins) {
      if (admin.telegramChatId) {
        await sendTelegramMessage(admin.telegramChatId, message);
      }
    }
  } catch (error) {
    console.error("[Notifications] Error sending admin notification:", error);
  }
}

/**
 * إرسال تقرير يومي للمشرفين
 */
export async function sendDailyReportToAdmins() {
  try {
    const admins = await db.getLinkedAdmins();
    
    if (admins.length === 0) {
      console.log("[Notifications] No admins linked to Telegram");
      return;
    }
    
    // الحصول على إحصائيات اليوم
    const today = new Date();
    const todayReadings = await db.getReadingsByDate(today);
    
    // حساب عدد القراءات المكتملة
    let completedCount = 0;
    todayReadings.forEach((r) => {
      if (r.person1Status) completedCount++;
      if (r.person2Status) completedCount++;
      if (r.person3Status) completedCount++;
    });
    
    const message =
      `📊 التقرير اليومي - ${today.toLocaleDateString("ar-EG")}\n\n` +
      `✅ القراءات المكتملة اليوم: ${completedCount}\n` +
      `📈 نسبة الإنجاز: ${((completedCount / 180) * 100).toFixed(1)}%\n\n` +
      `بارك الله في الجميع! 🤲`;

    for (const admin of admins) {
      if (admin.telegramChatId) {
        await sendTelegramMessage(admin.telegramChatId, message);
      }
    }
  } catch (error) {
    console.error("[Notifications] Error sending daily report:", error);
  }
}

/**
 * إرسال تذكير أسبوعي للمشاركين
 */
export async function sendWeeklyReminder(fridayNumber: number) {
  try {
    // الحصول على جميع المشاركين المرتبطين بـ Telegram
    const linkedPersons = await db.getAllLinkedPersons();

    if (linkedPersons.length === 0) {
      console.log("[Notifications] No persons linked to Telegram");
      return;
    }

    const message =
      `🌙 تذكير: موعد الختمة القادم\n\n` +
      `📅 الجمعة رقم: ${fridayNumber}\n` +
      `⏰ الموعد: غداً بإذن الله\n\n` +
      `لا تنسى قراءة جزئك! 📖\n` +
      `بارك الله فيك 🤲`;

    for (const person of linkedPersons) {
      if (person.telegramChatId) {
        await sendTelegramMessage(person.telegramChatId, message);
      }
    }
  } catch (error) {
    console.error("[Notifications] Error sending weekly reminder:", error);
  }
}

/**
 * إرسال رسالة مخصصة لجميع المشاركين
 */
export async function sendCustomMessageToAll(message: string) {
  try {
    const linkedPersons = await db.getAllLinkedPersons();

    for (const person of linkedPersons) {
      if (person.telegramChatId) {
        await sendTelegramMessage(person.telegramChatId, message);
      }
    }

    return { success: true, count: linkedPersons.length };
  } catch (error) {
    console.error("[Notifications] Error sending custom message:", error);
    return { success: false, error };
  }
}

/**
 * إرسال رسالة مخصصة للمشرفين فقط
 */
export async function sendCustomMessageToAdmins(message: string) {
  try {
    const admins = await db.getLinkedAdmins();

    for (const admin of admins) {
      if (admin.telegramChatId) {
        await sendTelegramMessage(admin.telegramChatId, message);
      }
    }

    return { success: true, count: admins.length };
  } catch (error) {
    console.error("[Notifications] Error sending custom message to admins:", error);
    return { success: false, error };
  }
}
