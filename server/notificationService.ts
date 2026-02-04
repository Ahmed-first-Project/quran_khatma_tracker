import { sendTelegramMessage } from "./telegram";
import {
  getPendingReadings,
  saveNotification,
  getNotificationSetting,
  getFridayByNumber,
} from "./db";

/**
 * إرسال تذكير لمشارك واحد
 */
export async function sendReminderToParticipant(params: {
  name: string;
  chatId: string;
  juzNumber: number;
  groupNumber: number;
  fridayNumber: number;
  notificationType: 'reminder' | 'manual' | 'scheduled';
}): Promise<{ success: boolean; error?: string }> {
  const { name, chatId, juzNumber, groupNumber, fridayNumber, notificationType } = params;

  // الحصول على معلومات الجمعة
  const friday = await getFridayByNumber(fridayNumber);
  const fridayDate = friday?.dateGregorian || `الجمعة ${fridayNumber}`;

  // إنشاء نص الرسالة
  const messageText = `
🔔 <b>تذكير: قراءة القرآن</b>

السلام عليكم ${name}،

نذكرك بقراءة الجزء المخصص لك:
📖 <b>الجزء:</b> ${juzNumber}
👥 <b>المجموعة:</b> ${groupNumber}
📅 <b>الجمعة:</b> ${fridayDate}

بعد إتمام القراءة، يرجى إرسال الأمر:
/تم

جزاك الله خيراً 🤲
`.trim();

  try {
    // إرسال الرسالة عبر Telegram
    const sent = await sendTelegramMessage(chatId, messageText);

    // حفظ الإشعار في قاعدة البيانات
    await saveNotification({
      fridayNumber,
      recipientName: name,
      recipientChatId: chatId,
      messageText,
      notificationType,
      status: sent ? 'sent' : 'failed',
      errorMessage: sent ? undefined : 'فشل إرسال الرسالة',
      sentAt: sent ? new Date() : undefined,
    });

    return { success: sent };
  } catch (error: any) {
    console.error("[NotificationService] Error sending reminder:", error);

    // حفظ الإشعار الفاشل
    await saveNotification({
      fridayNumber,
      recipientName: name,
      recipientChatId: chatId,
      messageText,
      notificationType,
      status: 'failed',
      errorMessage: error.message || 'خطأ غير معروف',
    });

    return { success: false, error: error.message };
  }
}

/**
 * إرسال تذكيرات لجميع المشاركين المتأخرين في جمعة معينة
 */
export async function sendRemindersForFriday(
  fridayNumber: number,
  notificationType: 'reminder' | 'manual' | 'scheduled' = 'manual'
): Promise<{
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ name: string; error: string }>;
}> {
  // الحصول على المشاركين المتأخرين
  const pendingReadings = await getPendingReadings(fridayNumber);

  const results = {
    total: pendingReadings.length,
    sent: 0,
    failed: 0,
    errors: [] as Array<{ name: string; error: string }>,
  };

  // إرسال تذكير لكل مشارك
  for (const reading of pendingReadings) {
    if (!reading.chatId) {
      results.failed++;
      results.errors.push({
        name: reading.name,
        error: 'لا يوجد حساب Telegram مرتبط',
      });
      continue;
    }

    const result = await sendReminderToParticipant({
      name: reading.name,
      chatId: reading.chatId,
      juzNumber: reading.juzNumber,
      groupNumber: reading.groupNumber,
      fridayNumber,
      notificationType,
    });

    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({
        name: reading.name,
        error: result.error || 'فشل الإرسال',
      });
    }

    // تأخير صغير بين الرسائل لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * التحقق من حاجة إرسال تذكيرات تلقائية
 */
export async function shouldSendAutomaticReminders(): Promise<{
  shouldSend: boolean;
  fridayNumber?: number;
}> {
  // الحصول على إعدادات الإشعارات
  const enabledSetting = await getNotificationSetting('auto_reminders_enabled');
  const fridayNumberSetting = await getNotificationSetting('current_friday_number');

  if (!enabledSetting || enabledSetting.settingValue !== 'true') {
    return { shouldSend: false };
  }

  if (!fridayNumberSetting) {
    return { shouldSend: false };
  }

  const fridayNumber = parseInt(fridayNumberSetting.settingValue);
  if (isNaN(fridayNumber)) {
    return { shouldSend: false };
  }

  return { shouldSend: true, fridayNumber };
}
