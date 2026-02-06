/**
 * Telegram Callback Query Handler
 * معالج الأزرار التفاعلية في البوت
 */

import * as db from "./db";
import { sendTelegramMessage, answerCallbackQuery } from "./telegram";
import {
  getStartKeyboard,
  getMainMenuKeyboard,
  getConfirmLinkKeyboard,
  getBackToMenuKeyboard,
  getHelpKeyboard,
  getAboutKeyboard,
  getQuranKeyboard
} from "./telegramKeyboards";
import { getMotivationalMessage, MotivationalContext } from "./motivationalMessages";

/**
 * معالج callback queries
 */
export async function handleCallbackQuery(
  callbackQueryId: string,
  chatId: string,
  data: string,
  firstName: string
): Promise<void> {
  // الرد على callback query لإزالة علامة التحميل
  await answerCallbackQuery(callbackQueryId);
  
  // معالجة القائمة الرئيسية
  if (data === "main_menu") {
    await sendMainMenu(chatId, firstName);
    return;
  }

  // معالجة "ابدأ الآن"
  if (data === "start_journey") {
    await sendTelegramMessage(
      chatId,
      `🕌 <b>مرحباً بك في بوت ختمة الروضة الشاذلية!</b>\n\n` +
        `للانضمام إلى الختمة، أرسل اسمك الكامل كما هو مسجل في قائمة المشاركين.\n\n` +
        `<b>مثال:</b> أحمد محمد العلي\n\n` +
        `💡 <b>تأكد من كتابة اسمك بالضبط كما هو في القائمة.</b>`,
      { reply_markup: getBackToMenuKeyboard() }
    );
    return;
  }

  // معالجة "عن البرنامج"
  if (data === "about") {
    await sendTelegramMessage(
      chatId,
      `📖 <b>عن برنامج ختمة الروضة الشاذلية</b>\n\n` +
        `برنامج قرآني مبارك يهدف إلى ختم القرآن الكريم بشكل جماعي كل جمعة.\n\n` +
        `🎯 <b>الهدف:</b>\n` +
        `• ختم القرآن الكريم كاملاً كل أسبوع\n` +
        `• تقسيم الأجزاء على 60 مجموعة (3 أشخاص لكل مجموعة)\n` +
        `• كل شخص يقرأ جزءاً واحداً في الأسبوع\n\n` +
        `🌟 <b>الفوائد:</b>\n` +
        `• الأجر الجماعي لختم القرآن\n` +
        `• التشجيع المتبادل بين المشاركين\n` +
        `• تتبع سهل للقراءات عبر البوت\n\n` +
        `جعلنا الله وإياكم من أهل القرآن 🤲`,
      { reply_markup: getAboutKeyboard() }
    );
    return;
  }

  // معالجة "المساعدة"
  if (data === "help") {
    await sendHelpMessage(chatId);
    return;
  }

  // معالجة "سجّل قراءتك"
  if (data === "mark_done") {
    await handleMarkDone(chatId);
    return;
  }

  // معالجة "إحصائياتي"
  if (data === "my_status") {
    await handleMyStatus(chatId);
    return;
  }

  // معالجة "افتح المصحف"
  if (data === "open_quran") {
    await handleOpenQuran(chatId);
    return;
  }

  // معالجة "دعاء ختم القرآن"
  if (data === "dua") {
    await sendDuaMessage(chatId);
    return;
  }

  // معالجة "نصائح القراءة"
  if (data === "tips") {
    await sendTipsMessage(chatId);
    return;
  }

  // معالجة تأكيد الربط
  if (data.startsWith("confirm_link:")) {
    const personName = data.replace("confirm_link:", "");
    await confirmLink(chatId, personName);
    return;
  }

  // معالجة إلغاء الربط
  if (data === "cancel_link") {
    await sendTelegramMessage(
      chatId,
      `تم إلغاء عملية الربط. يمكنك المحاولة مرة أخرى بإرسال اسمك الصحيح.`,
      { reply_markup: getBackToMenuKeyboard() }
    );
    return;
  }
}

/**
 * إرسال القائمة الرئيسية
 */
async function sendMainMenu(chatId: string, firstName: string): Promise<void> {
  const person = await db.getPersonByChatId(chatId);
  
  if (!person) {
    await sendTelegramMessage(
      chatId,
      `🕌 <b>مرحباً ${firstName}!</b>\n\n` +
        `للبدء، أرسل اسمك الكامل كما هو مسجل في قائمة المشاركين.`,
      { reply_markup: getStartKeyboard() }
    );
  } else {
    // الحصول على الجمعة الحالية حسب التاريخ
    const currentFriday = await db.getCurrentFriday();
    
    let message = `🕌 <b>القائمة الرئيسية</b>\n\n`;
    message += `مرحباً <b>${person.name}</b>!\n\n`;
    
    if (currentFriday) {
      // الحصول على القراءة المطلوبة للجمعة الحالية
      const currentReading = await db.getReadingForPersonAndFriday(person.name, currentFriday.fridayNumber);
      
      if (currentReading) {
        message += `📅 <b>الجمعة:</b> ${currentReading.fridayNumber} (${currentFriday.dateGregorian})\n`;
        message += `👥 <b>المجموعة:</b> ${currentReading.groupNumber}\n`;
        message += `📖 <b>الجزء المخصص:</b> ${currentReading.juzNumber}\n`;
        message += `📚 <b>الختمة:</b> ${currentReading.juzNumber <= 15 ? 'الأولى' : 'الثانية'}\n\n`;
        
        if (currentReading.isCompleted) {
          message += `✅ <b>تم التسجيل!</b> بارك الله فيك 🌟`;
        } else {
          message += `⏳ <b>لم يتم التسجيل بعد</b>\n`;
          message += `لتسجيل قراءتك، اضغط "سجّل قراءتك" 👇`;
        }
      } else {
        message += `⚠️ لم يتم العثور على قراءة لهذه الجمعة.\n`;
        message += `يرجى التواصل مع المشرف.`;
      }
    } else {
      message += `⚠️ لم يتم العثور على بيانات الجمعة.\n`;
      message += `يرجى التواصل مع المشرف.`;
    }
    
    await sendTelegramMessage(
      chatId,
      message,
      { reply_markup: getMainMenuKeyboard() }
    );
  }
}

/**
 * معالجة "سجّل قراءتك"
 */
async function handleMarkDone(chatId: string): Promise<void> {
  const person = await db.getPersonByChatId(chatId);
  
  if (!person) {
    await sendTelegramMessage(
      chatId,
      `❌ لم يتم ربط حسابك بعد!\n\n` +
        `لاستخدام هذه الميزة، يجب عليك أولاً ربط حسابك بإرسال اسمك الكامل.`,
      { reply_markup: getBackToMenuKeyboard() }
    );
    return;
  }

  // الحصول على الجمعة الحالية
  const currentFriday = await db.getCurrentFriday();
  
  if (!currentFriday) {
    await sendTelegramMessage(
      chatId,
      `⚠️ حدث خطأ في تحديد الجمعة الحالية.\n` +
        `يرجى التواصل مع المشرف.`,
      { reply_markup: getMainMenuKeyboard() }
    );
    return;
  }
  
  // الحصول على القراءة المطلوبة للجمعة الحالية
  const currentReading = await db.getReadingForPersonAndFriday(person.name, currentFriday.fridayNumber);
  
  if (!currentReading) {
    await sendTelegramMessage(
      chatId,
      `⚠️ لم يتم العثور على قراءة لك في هذه الجمعة.\n` +
        `يرجى التواصل مع المشرف.`,
      { reply_markup: getMainMenuKeyboard() }
    );
    return;
  }
  
  // التحقق من أن القراءة لم يتم تسجيلها بعد
  if (currentReading.isCompleted) {
    await sendTelegramMessage(
      chatId,
      `✅ <b>تم التسجيل مسبقاً!</b>\n\n` +
        `لقد سجّلت قراءة الجزء ${currentReading.juzNumber} للجمعة ${currentReading.fridayNumber} من قبل.\n\n` +
        `بارك الله فيك! 🌟`,
      { reply_markup: getMainMenuKeyboard() }
    );
    return;
  }

  // تسجيل القراءة
  const success = await db.updateReadingStatus(
    currentReading.id,
    currentReading.personPosition,
    true,
    new Date()
  );

  if (!success) {
    await sendTelegramMessage(
      chatId,
      `❌ حدث خطأ أثناء تسجيل القراءة. حاول مرة أخرى.`,
      { reply_markup: getMainMenuKeyboard() }
    );
    return;
  }

  // حساب الإحصائيات للرسالة التحفيزية
  const consecutiveReadings = await db.getConsecutiveReadings(person.name);
  const completionRate = await db.getCompletionRate(person.name);
  const totalCompleted = await db.getTotalCompletedReadings(person.name);

  const context: MotivationalContext = {
    consecutiveReadings,
    completionRate,
    totalCompleted,
    isFirstInGroup: false,
    isFirstOverall: false,
    weekNumber: currentReading.fridayNumber
  };

  const motivationalMessage = getMotivationalMessage(context);

  await sendTelegramMessage(
    chatId,
    `✅ <b>تم تسجيل قراءتك بنجاح!</b>\n\n` +
      `👤 <b>الاسم:</b> ${person.name}\n` +
      `📅 <b>الجمعة:</b> ${currentReading.fridayNumber}\n` +
      `👥 <b>المجموعة:</b> ${currentReading.groupNumber}\n` +
      `📖 <b>الجزء:</b> ${currentReading.juzNumber}\n\n` +
      `${motivationalMessage}\n\n` +
      `جزاك الله خيراً على المواظبة! 🌟`,
    { reply_markup: getMainMenuKeyboard() }
  );
}

/**
 * معالجة "إحصائياتي"
 */
async function handleMyStatus(chatId: string): Promise<void> {
  const person = await db.getPersonByChatId(chatId);
  
  if (!person) {
    await sendTelegramMessage(
      chatId,
      `❌ لم يتم ربط حسابك بعد!`,
      { reply_markup: getBackToMenuKeyboard() }
    );
    return;
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
    statusMessage += `📌 لديك ${pendingCount} قراءة منتظرة.\n`;
  }
  
  statusMessage += `\nجزاك الله خيراً 🤲`;

  await sendTelegramMessage(chatId, statusMessage, {
    reply_markup: getMainMenuKeyboard()
  });
}

/**
 * معالجة "افتح المصحف"
 */
async function handleOpenQuran(chatId: string): Promise<void> {
  const person = await db.getPersonByChatId(chatId);
  
  if (!person) {
    await sendTelegramMessage(
      chatId,
      `📖 <b>افتح المصحف الشريف</b>\n\n` +
        `يمكنك قراءة القرآن الكريم بالرسم العثماني (مصحف المدينة) مجاناً.`,
      { reply_markup: getQuranKeyboard() }
    );
    return;
  }

  // الحصول على الجمعة الحالية
  const currentFriday = await db.getCurrentFriday();
  
  if (!currentFriday) {
    await sendTelegramMessage(
      chatId,
      `📖 <b>افتح المصحف الشريف</b>\n\n` +
        `يمكنك قراءة القرآن الكريم بالرسم العثماني (مصحف المدينة) مجاناً.`,
      { reply_markup: getQuranKeyboard() }
    );
    return;
  }
  
  // الحصول على القراءة المطلوبة للجمعة الحالية
  const currentReading = await db.getReadingForPersonAndFriday(person.name, currentFriday.fridayNumber);
  
  if (currentReading) {
    await sendTelegramMessage(
      chatId,
      `📖 <b>افتح المصحف الشريف</b>\n\n` +
        `جزؤك المطلوب هذا الأسبوع:\n` +
        `📅 الجمعة: ${currentReading.fridayNumber} (${currentFriday.dateGregorian})\n` +
        `👥 المجموعة: ${currentReading.groupNumber}\n` +
        `📖 الجزء: ${currentReading.juzNumber}\n\n` +
        `اضغط الزر أدناه لفتح المصحف مباشرة على جزئك.`,
      { reply_markup: getQuranKeyboard(currentReading.juzNumber) }
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `📖 <b>افتح المصحف الشريف</b>\n\n` +
        `يمكنك قراءة القرآن الكريم بالرسم العثماني (مصحف المدينة) مجاناً.`,
      { reply_markup: getQuranKeyboard() }
    );
  }
}

/**
 * إرسال دعاء ختم القرآن
 */
async function sendDuaMessage(chatId: string): Promise<void> {
  await sendTelegramMessage(
    chatId,
    `🤲 <b>دعاء ختم القرآن الكريم</b>\n\n` +
      `اللَّهُمَّ ارْحَمْنِي بالقُرْءَانِ وَاجْعَلهُ لِي إِمَامًا وَنُورًا وَهُدًى وَرَحْمَةً.\n\n` +
      `اللَّهُمَّ ذَكِّرْنِي مِنْهُ مَا نُسِّيتُ وَعَلِّمْنِي مِنْهُ مَا جَهِلْتُ وَارْزُقْنِي تِلاَوَتَهُ آنَاءَ اللَّيْلِ وَأَطْرَافَ النَّهَارِ وَاجْعَلْهُ لِي حُجَّةً يَا رَبَّ العَالَمِينَ.\n\n` +
      `اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ وَاجْعَلِ المَوْتَ رَاحَةً لِي مِنْ كُلِّ شَرٍّ.\n\n` +
      `اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ وَخَيْرَ عَمَلِي خَوَاتِمَهُ وَخَيْرَ أَيَّامِي يَوْمَ أَلْقَاكَ فِيهِ.\n\n` +
      `آمين يا رب العالمين 🤲`,
    { reply_markup: getMainMenuKeyboard() }
  );
}

/**
 * إرسال نصائح القراءة
 */
async function sendTipsMessage(chatId: string): Promise<void> {
  await sendTelegramMessage(
    chatId,
    `💬 <b>نصائح لقراءة القرآن الكريم</b>\n\n` +
      `1️⃣ <b>الإخلاص:</b> اجعل نيتك خالصة لله تعالى\n\n` +
      `2️⃣ <b>الطهارة:</b> احرص على الوضوء قبل القراءة\n\n` +
      `3️⃣ <b>الخشوع:</b> تدبر معاني الآيات وتأمل فيها\n\n` +
      `4️⃣ <b>الترتيل:</b> اقرأ بتأنٍ وترتيل كما أمر الله\n\n` +
      `5️⃣ <b>الاستعاذة:</b> ابدأ بالاستعاذة من الشيطان الرجيم\n\n` +
      `6️⃣ <b>المكان:</b> اختر مكاناً هادئاً بعيداً عن المشتتات\n\n` +
      `7️⃣ <b>الاستمرار:</b> اجعل لك ورداً يومياً ثابتاً\n\n` +
      `8️⃣ <b>الدعاء:</b> ادعُ الله أن يرزقك فهم القرآن والعمل به\n\n` +
      `﴿وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا﴾`,
    { reply_markup: getMainMenuKeyboard() }
  );
}

/**
 * إرسال رسالة المساعدة
 */
async function sendHelpMessage(chatId: string): Promise<void> {
  await sendTelegramMessage(
    chatId,
    `❓ <b>كيفية استخدام البوت</b>\n\n` +
      `🕌 <b>للمشاركين الجدد:</b>\n` +
      `1️⃣ اضغط "ابدأ الآن"\n` +
      `2️⃣ أرسل اسمك الكامل (كما هو في القائمة)\n` +
      `3️⃣ انتظر رسالة التأكيد\n\n` +
      `✅ <b>لتسجيل قراءتك:</b>\n` +
      `• اضغط زر "سجّل قراءتك" من القائمة\n` +
      `• أو أرسل الأمر: /تم\n\n` +
      `📊 <b>لمعرفة إحصائياتك:</b>\n` +
      `• اضغط زر "إحصائياتي" من القائمة\n` +
      `• أو أرسل الأمر: /حالتي\n\n` +
      `📖 <b>لفتح المصحف:</b>\n` +
      `• اضغط زر "افتح المصحف" من القائمة\n\n` +
      `💡 <b>نصيحة:</b> استخدم الأزرار التفاعلية لتجربة أسهل وأسرع!`,
    { reply_markup: getHelpKeyboard() }
  );
}

/**
 * تأكيد ربط الحساب
 */
async function confirmLink(chatId: string, personName: string): Promise<void> {
  const success = await db.linkTelegramAccount(personName, chatId);
  
  if (success) {
    await sendTelegramMessage(
      chatId,
      `🎉 <b>تم ربط حسابك بنجاح!</b>\n\n` +
        `مرحباً ${personName}!\n\n` +
        `من الآن فصاعداً ستصلك:\n` +
        `• ✅ تأكيد عند تسجيل قراءتك\n` +
        `• 🔔 تذكير أسبوعي بموعد القراءة\n` +
        `• 📊 تحديثات عن تقدم الختمة\n\n` +
        `بارك الله فيك ووفقك لما يحب ويرضى 🤲`,
      { reply_markup: getMainMenuKeyboard() }
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `❌ حدث خطأ أثناء ربط الحساب. حاول مرة أخرى.`,
      { reply_markup: getBackToMenuKeyboard() }
    );
  }
}
