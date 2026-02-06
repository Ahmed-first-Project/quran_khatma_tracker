/**
 * دالة لتوليد رابط مباشر لجزء معين في مصحف قرآن فلاش
 * @param juzNumber رقم الجزء (1-30)
 * @returns رابط مباشر للجزء في قرآن فلاش
 */
export function getQuranJuzLink(juzNumber: number): string {
  // صفحات بداية كل جزء في مصحف المدينة النبوية
  const juzStartPages: Record<number, number> = {
    1: 1,
    2: 22,
    3: 42,
    4: 62,
    5: 82,
    6: 102,
    7: 122,
    8: 142,
    9: 162,
    10: 182,
    11: 202,
    12: 222,
    13: 242,
    14: 262,
    15: 282,
    16: 302,
    17: 322,
    18: 342,
    19: 362,
    20: 382,
    21: 402,
    22: 422,
    23: 442,
    24: 462,
    25: 482,
    26: 502,
    27: 522,
    28: 542,
    29: 562,
    30: 582,
  };

  const startPage = juzStartPages[juzNumber];
  
  if (!startPage) {
    throw new Error(`رقم الجزء غير صحيح: ${juzNumber}`);
  }

  // رابط قرآن فلاش مع رقم الصفحة
  return `https://app.quranflash.com/book/Medina1?ar&startpage=${startPage}#/reader`;
}

/**
 * دالة للحصول على اسم الجزء بالعربية
 * @param juzNumber رقم الجزء (1-30)
 * @returns اسم الجزء بالعربية
 */
export function getJuzName(juzNumber: number): string {
  const arabicNumbers = [
    'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس',
    'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
    'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر',
    'السادس عشر', 'السابع عشر', 'الثامن عشر', 'التاسع عشر', 'العشرون',
    'الحادي والعشرون', 'الثاني والعشرون', 'الثالث والعشرون', 'الرابع والعشرون', 'الخامس والعشرون',
    'السادس والعشرون', 'السابع والعشرون', 'الثامن والعشرون', 'التاسع والعشرون', 'الثلاثون'
  ];

  if (juzNumber < 1 || juzNumber > 30) {
    throw new Error(`رقم الجزء غير صحيح: ${juzNumber}`);
  }

  return `الجزء ${arabicNumbers[juzNumber - 1]}`;
}
