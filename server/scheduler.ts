import { CronJob } from 'cron';
import { sendRemindersForFriday, shouldSendAutomaticReminders } from './notificationService';
import { getAllAdmins } from './db';
import { sendTelegramMessage } from './telegram';

/**
 * نظام الجدولة التلقائية لإرسال التذكيرات
 * 
 * يعمل كل يوم خميس الساعة 6 مساءً (بتوقيت GMT+3)
 * ويرسل تذكيرات للمشاركين الذين لم يسجلوا قراءاتهم
 */

let reminderJob: CronJob | null = null;

/**
 * تشغيل نظام الجدولة التلقائية
 */
export function startScheduler() {
  // إيقاف الجدولة السابقة إن وجدت
  if (reminderJob) {
    reminderJob.stop();
  }

  // إنشاء مهمة جديدة: كل يوم خميس الساعة 6 مساءً
  // Cron format: second minute hour day-of-month month day-of-week
  // 0 0 18 * * 4 = كل خميس الساعة 6 مساءً
  reminderJob = new CronJob(
    '0 0 18 * * 4', // كل خميس الساعة 6 مساءً
    async () => {
      console.log('[Scheduler] Running automatic reminder job...');
      await runAutomaticReminders();
    },
    null, // onComplete
    true, // start immediately
    'Asia/Riyadh' // timezone (GMT+3)
  );

  console.log('[Scheduler] Automatic reminder scheduler started (Every Thursday at 6 PM)');
}

/**
 * إيقاف نظام الجدولة التلقائية
 */
export function stopScheduler() {
  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
    console.log('[Scheduler] Automatic reminder scheduler stopped');
  }
}

/**
 * تنفيذ إرسال التذكيرات التلقائية
 */
async function runAutomaticReminders() {
  try {
    // التحقق من تفعيل الإشعارات التلقائية
    const { shouldSend, fridayNumber } = await shouldSendAutomaticReminders();

    if (!shouldSend || !fridayNumber) {
      console.log('[Scheduler] Automatic reminders are disabled or no friday number set');
      return;
    }

    console.log(`[Scheduler] Sending automatic reminders for Friday ${fridayNumber}...`);

    // إرسال التذكيرات
    const results = await sendRemindersForFriday(fridayNumber, 'scheduled');

    console.log('[Scheduler] Automatic reminders sent:', results);

    // إرسال تقرير للمشرفين
    await sendReportToAdmins(fridayNumber, results);

  } catch (error) {
    console.error('[Scheduler] Error running automatic reminders:', error);
  }
}

/**
 * إرسال تقرير للمشرفين عن نتائج الإرسال
 */
async function sendReportToAdmins(
  fridayNumber: number,
  results: {
    total: number;
    sent: number;
    failed: number;
    errors: Array<{ name: string; error: string }>;
  }
) {
  const admins = await getAllAdmins();

  const reportMessage = `
📊 <b>تقرير التذكيرات التلقائية</b>

📅 <b>الجمعة:</b> ${fridayNumber}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}

📈 <b>النتائج:</b>
• إجمالي المتأخرين: ${results.total}
• تم الإرسال بنجاح: ${results.sent}
• فشل الإرسال: ${results.failed}

${results.errors.length > 0 ? `
⚠️ <b>الأخطاء:</b>
${results.errors.slice(0, 10).map(e => `• ${e.name}: ${e.error}`).join('\n')}
${results.errors.length > 10 ? `\n... و ${results.errors.length - 10} أخطاء أخرى` : ''}
` : ''}
`.trim();

  for (const admin of admins) {
    if (admin.telegramChatId) {
      await sendTelegramMessage(admin.telegramChatId, reportMessage);
    }
  }
}

/**
 * إرسال تذكيرات يدوية فوراً (للاختبار)
 */
export async function sendManualRemindersNow(fridayNumber: number) {
  console.log(`[Scheduler] Sending manual reminders for Friday ${fridayNumber}...`);
  const results = await sendRemindersForFriday(fridayNumber, 'manual');
  console.log('[Scheduler] Manual reminders sent:', results);
  return results;
}
