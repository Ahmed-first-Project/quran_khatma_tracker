/**
 * Telegram Inline Keyboards - أزرار تفاعلية إيمانية احترافية
 * تعريف جميع الأزرار التفاعلية المستخدمة في البوت
 */

export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

/**
 * لوحة مفاتيح البداية - تظهر عند /start
 */
export function getStartKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🕌 ابدأ الآن", callback_data: "start_journey" }
      ],
      [
        { text: "📖 عن البرنامج", callback_data: "about" },
        { text: "❓ المساعدة", callback_data: "help" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح القائمة الرئيسية - تظهر بعد الربط
 */
export function getMainMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✅ سجّل قراءتك", callback_data: "mark_done" }
      ],
      [
        { text: "📖 افتح المصحف", callback_data: "open_quran" },
        { text: "📊 إحصائياتي", callback_data: "my_status" }
      ],
      [
        { text: "🔄 تحديث القائمة", callback_data: "main_menu" },
        { text: "❓ مساعدة", callback_data: "help" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح تأكيد الربط
 */
export function getConfirmLinkKeyboard(personName: string): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "✅ نعم، هذا أنا", callback_data: `confirm_link:${personName}` }
      ],
      [
        { text: "❌ لا، إلغاء", callback_data: "cancel_link" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح العودة للقائمة الرئيسية
 */
export function getBackToMenuKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🏠 العودة للقائمة الرئيسية", callback_data: "main_menu" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح المساعدة
 */
export function getHelpKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🕌 ابدأ الآن", callback_data: "start_journey" }
      ],
      [
        { text: "🏠 القائمة الرئيسية", callback_data: "main_menu" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح "عن البرنامج"
 */
export function getAboutKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "🕌 ابدأ الآن", callback_data: "start_journey" }
      ],
      [
        { text: "❓ المساعدة", callback_data: "help" }
      ]
    ]
  };
}

/**
 * لوحة مفاتيح اختيار المصحف
 */
export function getQuranKeyboard(juzNumber?: number): InlineKeyboardMarkup {
  if (juzNumber) {
    // إذا كان لديه جزء محدد
    // حساب رقم الصفحة: كل جزء = 20 صفحة
    const pageNumber = (juzNumber - 1) * 20 + 1;
    return {
      inline_keyboard: [
        [
          { text: `📖 افتح الجزء ${juzNumber}`, url: `https://quran.ksu.edu.sa/index.php?l=ar&pg=${pageNumber}` }
        ],
        [
          { text: "🏠 القائمة الرئيسية", callback_data: "main_menu" }
        ]
      ]
    };
  } else {
    // إذا لم يكن لديه جزء محدد
    return {
      inline_keyboard: [
        [
          { text: "📖 افتح المصحف", url: "https://quran.ksu.edu.sa/index.php?l=ar&pg=1" }
        ],
        [
          { text: "🏠 القائمة الرئيسية", callback_data: "main_menu" }
        ]
      ]
    };
  }
}
