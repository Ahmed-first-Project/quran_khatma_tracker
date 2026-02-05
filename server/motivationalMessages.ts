/**
 * نظام الرسائل التحفيزية
 * يوفر رسائل تحفيزية مخصصة بناءً على إنجازات المشارك
 */

export interface MotivationalContext {
  consecutiveReadings: number; // عدد القراءات المتتالية
  totalCompleted: number; // إجمالي القراءات المكتملة
  completionRate: number; // نسبة الإنجاز (0-100)
  isFirstInGroup: boolean; // هل هو أول من سجل في المجموعة
  isFirstOverall: boolean; // هل هو أول من سجل في الجمعة
  weekNumber: number; // رقم الأسبوع/الجمعة
}

// رسائل القراءات المتتالية
const consecutiveMessages = {
  1: [
    "بارك الله فيك! بداية موفقة 🌟",
    "ماشاء الله! قراءة مباركة 📖",
    "جزاك الله خيراً على حرصك ✨",
  ],
  3: [
    "ماشاء الله! ثلاث قراءات متتالية 🔥",
    "استمر على هذا التميز! ثلاث قراءات متتالية 💪",
    "رائع! ثلاث قراءات متتالية، بارك الله فيك 🌟",
  ],
  5: [
    "ماشاء الله تبارك الله! خمس قراءات متتالية 🏆",
    "إنجاز رائع! خمس قراءات متتالية 🌟✨",
    "بارك الله في حرصك! خمس قراءات متتالية 💎",
  ],
  7: [
    "سبحان الله! سبع قراءات متتالية 🌙⭐",
    "التزام مميز! سبع قراءات متتالية 🏅",
    "ماشاء الله! أسبوع كامل من الالتزام 🎯",
  ],
  10: [
    "ماشاء الله! عشر قراءات متتالية 👑",
    "إنجاز استثنائي! عشر قراءات متتالية 🌟🌟",
    "بارك الله فيك! التزام رائع لعشر قراءات متتالية 💫",
  ],
  15: [
    "سبحان الله! خمسة عشر قراءة متتالية 🏆👑",
    "التزام نادر! خمسة عشر قراءة متتالية 💎✨",
    "ماشاء الله تبارك الله! إنجاز عظيم 🌟🌟🌟",
  ],
  20: [
    "الله أكبر! عشرون قراءة متتالية 🏆🏆",
    "إنجاز تاريخي! عشرون قراءة متتالية 👑💫",
    "ماشاء الله! التزام لا يُصدق 🌟🌟🌟🌟",
  ],
  30: [
    "سبحان الله العظيم! ختمة كاملة متتالية 🕌✨",
    "ماشاء الله تبارك الله! ختمة كاملة بلا انقطاع 📖👑",
    "بارك الله فيك! إنجاز عظيم - ختمة كاملة 🌟🌟🌟🌟🌟",
  ],
};

// رسائل نسبة الإنجاز
const completionRateMessages = {
  25: [
    "ربع الطريق! استمر بارك الله فيك 🎯",
    "25% من الختمة! بداية موفقة ✨",
  ],
  50: [
    "نصف الختمة! ماشاء الله 🌟",
    "50% من الطريق! إنجاز رائع 💪",
    "نصف الختمة اكتمل! بارك الله فيك 📖",
  ],
  75: [
    "ثلاثة أرباع الختمة! قريب جداً من النهاية 🎯✨",
    "75% اكتمل! الله يعينك على الإتمام 🌟",
    "ماشاء الله! أوشكت على إتمام الختمة 💎",
  ],
  100: [
    "مبروك! اكتملت الختمة بفضل الله 🎉🏆",
    "الله أكبر! ختمة كاملة، تقبل الله منك 🕌✨",
    "ماشاء الله تبارك الله! ختمة كاملة 📖👑",
  ],
};

// رسائل الإنجازات الخاصة
const specialAchievements = {
  firstInGroup: [
    "ماشاء الله! أول من سجل في مجموعتك 🥇",
    "رائع! أنت الأول في مجموعتك 🌟",
    "بارك الله فيك! أول من بادر في المجموعة 💫",
  ],
  firstOverall: [
    "سبحان الله! أول من سجل في هذه الجمعة 🏆🥇",
    "ماشاء الله! أنت السباق لهذا الأسبوع 👑",
    "الله يبارك فيك! أول من بادر في الجمعة 🌟✨",
  ],
  earlyBird: [
    "ماشاء الله! تسجيل مبكر، بارك الله فيك 🌅",
    "رائع! حرص على التسجيل المبكر 🌟",
  ],
};

// رسائل عامة تحفيزية
const generalMessages = [
  "جزاك الله خيراً على حرصك 🌟",
  "بارك الله فيك وفي قراءتك 📖",
  "تقبل الله منك 🤲✨",
  "الله يعينك على إتمام الختمة 💪",
  "ماشاء الله! استمر على هذا الحرص 🌟",
];

/**
 * اختيار رسالة عشوائية من مجموعة
 */
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * الحصول على رسالة تحفيزية بناءً على السياق
 */
export function getMotivationalMessage(context: MotivationalContext): string {
  const messages: string[] = [];

  // رسائل الإنجازات الخاصة (أولوية عالية)
  if (context.isFirstOverall) {
    messages.push(getRandomMessage(specialAchievements.firstOverall));
  } else if (context.isFirstInGroup) {
    messages.push(getRandomMessage(specialAchievements.firstInGroup));
  }

  // رسائل القراءات المتتالية
  if (context.consecutiveReadings >= 30) {
    messages.push(getRandomMessage(consecutiveMessages[30]));
  } else if (context.consecutiveReadings >= 20) {
    messages.push(getRandomMessage(consecutiveMessages[20]));
  } else if (context.consecutiveReadings >= 15) {
    messages.push(getRandomMessage(consecutiveMessages[15]));
  } else if (context.consecutiveReadings >= 10) {
    messages.push(getRandomMessage(consecutiveMessages[10]));
  } else if (context.consecutiveReadings >= 7) {
    messages.push(getRandomMessage(consecutiveMessages[7]));
  } else if (context.consecutiveReadings >= 5) {
    messages.push(getRandomMessage(consecutiveMessages[5]));
  } else if (context.consecutiveReadings >= 3) {
    messages.push(getRandomMessage(consecutiveMessages[3]));
  }

  // رسائل نسبة الإنجاز
  if (context.completionRate >= 100) {
    messages.push(getRandomMessage(completionRateMessages[100]));
  } else if (context.completionRate >= 75) {
    messages.push(getRandomMessage(completionRateMessages[75]));
  } else if (context.completionRate >= 50) {
    messages.push(getRandomMessage(completionRateMessages[50]));
  } else if (context.completionRate >= 25) {
    messages.push(getRandomMessage(completionRateMessages[25]));
  }

  // إذا لم تكن هناك رسائل خاصة، استخدم رسالة عامة
  if (messages.length === 0) {
    messages.push(getRandomMessage(generalMessages));
  }

  // دمج جميع الرسائل
  return messages.join("\n");
}

/**
 * الحصول على رسالة تحفيزية مختصرة (سطر واحد)
 */
export function getShortMotivationalMessage(context: MotivationalContext): string {
  if (context.isFirstOverall) {
    return getRandomMessage(specialAchievements.firstOverall);
  }
  
  if (context.isFirstInGroup) {
    return getRandomMessage(specialAchievements.firstInGroup);
  }

  if (context.consecutiveReadings >= 10) {
    return getRandomMessage(consecutiveMessages[10]);
  } else if (context.consecutiveReadings >= 5) {
    return getRandomMessage(consecutiveMessages[5]);
  } else if (context.consecutiveReadings >= 3) {
    return getRandomMessage(consecutiveMessages[3]);
  }

  return getRandomMessage(generalMessages);
}
