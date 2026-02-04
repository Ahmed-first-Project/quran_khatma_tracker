import { drizzle } from "drizzle-orm/mysql2";
// import { persons } from "../drizzle/schema.ts";
const persons = { id: 'id', name: 'name', groupNumber: 'groupNumber', position: 'position' };
import { eq } from "drizzle-orm";

const allNames = [
  // المجموعة 1
  { groupNum: 1, position: 1, name: "محمود أبو تيم" },
  { groupNum: 1, position: 2, name: "احمد الجبسري" },
  { groupNum: 1, position: 3, name: "حسن الحمد" },
  
  // المجموعة 2
  { groupNum: 2, position: 1, name: "محمود يونسو" },
  { groupNum: 2, position: 2, name: "عمر الجبسري" },
  { groupNum: 2, position: 3, name: "محمد المقداد" },
  
  // المجموعة 3
  { groupNum: 3, position: 1, name: "ياسين فياض" },
  { groupNum: 3, position: 2, name: "سامي طقاطقة" },
  { groupNum: 3, position: 3, name: "احمد الباشا" },
  
  // المجموعة 4
  { groupNum: 4, position: 1, name: "عبد العزيز الخزار" },
  { groupNum: 4, position: 2, name: "احمد اللاذقاني" },
  { groupNum: 4, position: 3, name: "عبد الحليم عبدالدقني" },
  
  // المجموعة 5
  { groupNum: 5, position: 1, name: "حسين العقلة" },
  { groupNum: 5, position: 2, name: "محمد حافظ" },
  { groupNum: 5, position: 3, name: "ميخوت اليمني" },
  
  // المجموعة 6
  { groupNum: 6, position: 1, name: "محمود الحريري" },
  { groupNum: 6, position: 2, name: "همام طقاطقة" },
  { groupNum: 6, position: 3, name: "علاء رياض" },
  
  // المجموعة 7
  { groupNum: 7, position: 1, name: "احمد الحمصي" },
  { groupNum: 7, position: 2, name: "ناصر الجبسري" },
  { groupNum: 7, position: 3, name: "أنس العمر" },
  
  // المجموعة 8
  { groupNum: 8, position: 1, name: "احمد اليحيى" },
  { groupNum: 8, position: 2, name: "إبراهيم طقاطقة" },
  { groupNum: 8, position: 3, name: "عثمان عثمان" },
  
  // المجموعة 9
  { groupNum: 9, position: 1, name: "عمر طالب" },
  { groupNum: 9, position: 2, name: "نور الدين طقاطقة" },
  { groupNum: 9, position: 3, name: "محمد إسماعيل" },
  
  // المجموعة 10
  { groupNum: 10, position: 1, name: "أبو محمود يونسو" },
  { groupNum: 10, position: 2, name: "محمد طقاطقة" },
  { groupNum: 10, position: 3, name: "زياد أغا" },
  
  // المجموعة 11
  { groupNum: 11, position: 1, name: "عدنان الشامي" },
  { groupNum: 11, position: 2, name: "وائل طقاطقة" },
  { groupNum: 11, position: 3, name: "احمد ابيش" },
  
  // المجموعة 12
  { groupNum: 12, position: 1, name: "محي الدين طقاطقة" },
  { groupNum: 12, position: 2, name: "يوسف الجبسري" },
  { groupNum: 12, position: 3, name: "احمد مدراتي" },
  
  // المجموعة 13
  { groupNum: 13, position: 1, name: "محمود الحافظ" },
  { groupNum: 13, position: 2, name: "علي الحافظ" },
  { groupNum: 13, position: 3, name: "صهيب الحماد" },
  
  // المجموعة 14
  { groupNum: 14, position: 1, name: "نور الدين الحريري" },
  { groupNum: 14, position: 2, name: "أبو سامي طقاطقة" },
  { groupNum: 14, position: 3, name: "مازن طرابيشي" },
  
  // المجموعة 15
  { groupNum: 15, position: 1, name: "وائل المقداد" },
  { groupNum: 15, position: 2, name: "احمد عبد الفتاح" },
  { groupNum: 15, position: 3, name: "زاهر" },
  
  // المجموعة 16
  { groupNum: 16, position: 1, name: "وهيب" },
  { groupNum: 16, position: 2, name: "عبد الله العداي" },
  { groupNum: 16, position: 3, name: "احمد سليمان" },
  
  // المجموعة 17
  { groupNum: 17, position: 1, name: "خالد الحريري" },
  { groupNum: 17, position: 2, name: "زياد الحريري" },
  { groupNum: 17, position: 3, name: "" }, // فارغ
  
  // المجموعة 18
  { groupNum: 18, position: 1, name: "أبو زهير النوبة" },
  { groupNum: 18, position: 2, name: "أبو هشام سفسع" },
  { groupNum: 18, position: 3, name: "" }, // فارغ
  
  // المجموعة 19
  { groupNum: 19, position: 1, name: "محمد رامي بكور" },
  { groupNum: 19, position: 2, name: "بشير ديري" },
  { groupNum: 19, position: 3, name: "سمير داغستاني" },
  
  // المجموعة 20
  { groupNum: 20, position: 1, name: "محمد حاج عبد الله" },
  { groupNum: 20, position: 2, name: "وليد طقاطقة" },
  { groupNum: 20, position: 3, name: "" }, // فارغ
  
  // المجموعة 21
  { groupNum: 21, position: 1, name: "محمد اورفه لي" },
  { groupNum: 21, position: 2, name: "أبو الموتسي" },
  { groupNum: 21, position: 3, name: "" }, // فارغ
  
  // المجموعة 22
  { groupNum: 22, position: 1, name: "محمد الرفاعي" },
  { groupNum: 22, position: 2, name: "ماهر الحريري" },
  { groupNum: 22, position: 3, name: "" }, // فارغ
  
  // المجموعة 23
  { groupNum: 23, position: 1, name: "ملا احمد" },
  { groupNum: 23, position: 2, name: "سيد معشوق" },
  { groupNum: 23, position: 3, name: "حمزة الحريري" },
  
  // المجموعة 24
  { groupNum: 24, position: 1, name: "احمد الكلعان" },
  { groupNum: 24, position: 2, name: "عبد السلام" },
  { groupNum: 24, position: 3, name: "محمد شحنة" },
  
  // المجموعة 25
  { groupNum: 25, position: 1, name: "محمد السيسي" },
  { groupNum: 25, position: 2, name: "أبو يحيى طقاطقة" },
  { groupNum: 25, position: 3, name: "" }, // فارغ
  
  // المجموعة 26
  { groupNum: 26, position: 1, name: "يحيى سليمان" },
  { groupNum: 26, position: 2, name: "يحيى طقاطقة" },
  { groupNum: 26, position: 3, name: "" }, // فارغ
  
  // المجموعة 27
  { groupNum: 27, position: 1, name: "سعيد الارض" },
  { groupNum: 27, position: 2, name: "بهاء طقاطقة" },
  { groupNum: 27, position: 3, name: "" }, // فارغ
  
  // المجموعة 28
  { groupNum: 28, position: 1, name: "منهل الشبلاق" },
  { groupNum: 28, position: 2, name: "بلال الحريري" },
  { groupNum: 28, position: 3, name: "" }, // فارغ
  
  // المجموعة 29
  { groupNum: 29, position: 1, name: "ملا عز الدين" },
  { groupNum: 29, position: 2, name: "ايدا معري" },
  { groupNum: 29, position: 3, name: "معتصم الرفاعي" },
  
  // المجموعة 30
  { groupNum: 30, position: 1, name: "أنس العداي" },
  { groupNum: 30, position: 2, name: "عمر نور الحريري" },
  { groupNum: 30, position: 3, name: "محمد حمدو" },
  
  // المجموعة 31
  { groupNum: 31, position: 1, name: "مريف سارة" },
  { groupNum: 31, position: 2, name: "عبد القادر جزماتي" },
  { groupNum: 31, position: 3, name: "هشام المغربي" },
  
  // المجموعة 32
  { groupNum: 32, position: 1, name: "علي إبراهيم طقاطقة" },
  { groupNum: 32, position: 2, name: "عثمان أظهر" },
  { groupNum: 32, position: 3, name: "مهالك اليوسف" },
  
  // المجموعة 33
  { groupNum: 33, position: 1, name: "مهند ثوابتة" },
  { groupNum: 33, position: 2, name: "سيف الدين الزور" },
  { groupNum: 33, position: 3, name: "احمد اليوسف" },
  
  // المجموعة 34
  { groupNum: 34, position: 1, name: "عبد الكريم الطرابيشي" },
  { groupNum: 34, position: 2, name: "حسين درويش" },
  { groupNum: 34, position: 3, name: "احمد الأشقر" },
  
  // المجموعة 35
  { groupNum: 35, position: 1, name: "مصطفى الجبسري" },
  { groupNum: 35, position: 2, name: "عبد الجليل عبود" },
  { groupNum: 35, position: 3, name: "حمزة عبد الله حافظ" },
  
  // المجموعة 36
  { groupNum: 36, position: 1, name: "بسام الأحمد" },
  { groupNum: 36, position: 2, name: "عبادة قصايب" },
  { groupNum: 36, position: 3, name: "احمد عبد الله حافظ" },
  
  // المجموعة 37
  { groupNum: 37, position: 1, name: "محمد الطرابيشي" },
  { groupNum: 37, position: 2, name: "مروان عبد المللك" },
  { groupNum: 37, position: 3, name: "أبو احمد حافظ" },
  
  // المجموعة 38
  { groupNum: 38, position: 1, name: "عبد الباري" },
  { groupNum: 38, position: 2, name: "معاذ الحلواني" },
  { groupNum: 38, position: 3, name: "محمد هشام القيسي" },
  
  // المجموعة 39
  { groupNum: 39, position: 1, name: "راغب أبو شعبان" },
  { groupNum: 39, position: 2, name: "يوسف بهاء الدين" },
  { groupNum: 39, position: 3, name: "" }, // فارغ
  
  // المجموعة 40
  { groupNum: 40, position: 1, name: "بكر الأحمد" },
  { groupNum: 40, position: 2, name: "برهام جريد" },
  { groupNum: 40, position: 3, name: "حسين الحريري" },
  
  // المجموعة 41
  { groupNum: 41, position: 1, name: "شعبان راغب عمار" },
  { groupNum: 41, position: 2, name: "قاه باش" },
  { groupNum: 41, position: 3, name: "أنور الحريري" },
  
  // المجموعة 42
  { groupNum: 42, position: 1, name: "عبد الرحمن جمعة" },
  { groupNum: 42, position: 2, name: "محمد هنداوي" },
  { groupNum: 42, position: 3, name: "عمر محمد الحريري" },
  
  // المجموعة 43
  { groupNum: 43, position: 1, name: "عامر طقاطقة" },
  { groupNum: 43, position: 2, name: "عبد القادر السليمان" },
  { groupNum: 43, position: 3, name: "علاء الحريري" },
  
  // المجموعة 44
  { groupNum: 44, position: 1, name: "مصطفى محمود" },
  { groupNum: 44, position: 2, name: "خالد أبو حطب" },
  { groupNum: 44, position: 3, name: "ناصر الرفاعي" },
  
  // المجموعة 45
  { groupNum: 45, position: 1, name: "خليل ثوابتة" },
  { groupNum: 45, position: 2, name: "طارق الشبلاق" },
  { groupNum: 45, position: 3, name: "أسامة حافظ" },
  
  // المجموعة 46
  { groupNum: 46, position: 1, name: "احمد هاني طقاطقة" },
  { groupNum: 46, position: 2, name: "حازم الجاسم" },
  { groupNum: 46, position: 3, name: "احمد حسكور" },
  
  // المجموعة 47
  { groupNum: 47, position: 1, name: "أبو كرم الحريري" },
  { groupNum: 47, position: 2, name: "احمد تلمساني" },
  { groupNum: 47, position: 3, name: "منتصر الرفاعي" },
  
  // المجموعة 48
  { groupNum: 48, position: 1, name: "مصطفى قطان" },
  { groupNum: 48, position: 2, name: "سعد زعين" },
  { groupNum: 48, position: 3, name: "عروة الرفاعي" },
  
  // المجموعة 49
  { groupNum: 49, position: 1, name: "احمد إبراهيم طقاطقة" },
  { groupNum: 49, position: 2, name: "مجد شلبي" },
  { groupNum: 49, position: 3, name: "يوسف اليوسف" },
  
  // المجموعة 50
  { groupNum: 50, position: 1, name: "حسن البرهو" },
  { groupNum: 50, position: 2, name: "محمد عبد الكريم" },
  { groupNum: 50, position: 3, name: "زياد قصايب" },
  
  // المجموعة 51
  { groupNum: 51, position: 1, name: "يونس العاشق" },
  { groupNum: 51, position: 2, name: "ريان ياسوطين" },
  { groupNum: 51, position: 3, name: "حمزة زرعين" },
  
  // المجموعة 52
  { groupNum: 52, position: 1, name: "محمد امانة" },
  { groupNum: 52, position: 2, name: "عاصم الكاف" },
  { groupNum: 52, position: 3, name: "أبو خلود" },
  
  // المجموعة 53
  { groupNum: 53, position: 1, name: "معتصم الجبسري" },
  { groupNum: 53, position: 2, name: "مصطفى قطان" },
  { groupNum: 53, position: 3, name: "عبد الغالب" },
  
  // المجموعة 54
  { groupNum: 54, position: 1, name: "عبد الكريم الصغير" },
  { groupNum: 54, position: 2, name: "هاني احمد طقاطقة" },
  { groupNum: 54, position: 3, name: "شيخ عبد الله حافظ" },
  
  // المجموعة 55
  { groupNum: 55, position: 1, name: "امير عمر" },
  { groupNum: 55, position: 2, name: "علاء يونس طقاطقة" },
  { groupNum: 55, position: 3, name: "يوسف العبيد الله" },
  
  // المجموعة 56
  { groupNum: 56, position: 1, name: "الفا سيسي" },
  { groupNum: 56, position: 2, name: "مصعب رشيد" },
  { groupNum: 56, position: 3, name: "علي يونس" },
  
  // المجموعة 57
  { groupNum: 57, position: 1, name: "عبد الرحمن طرابيشي" },
  { groupNum: 57, position: 2, name: "حجم رضا" },
  { groupNum: 57, position: 3, name: "احمد الحافظ" },
  
  // المجموعة 58
  { groupNum: 58, position: 1, name: "احمد يونس طقاطقة" },
  { groupNum: 58, position: 2, name: "محمد الحلبي" },
  { groupNum: 58, position: 3, name: "عبد المنعم قرموز" },
  
  // المجموعة 59
  { groupNum: 59, position: 1, name: "أبو عبيدة الصياد" },
  { groupNum: 59, position: 2, name: "خالد الغانم" },
  { groupNum: 59, position: 3, name: "عمر يونس" },
  
  // المجموعة 60
  { groupNum: 60, position: 1, name: "محمد احمد طقاطقة" },
  { groupNum: 60, position: 2, name: "احمد يوسف" },
  { groupNum: 60, position: 3, name: "ماهر الحسن" },
];

async function updateAllNames() {
  const db = drizzle(process.env.DATABASE_URL);
  
  console.log("بدء تحديث جميع الأسماء...");
  
  for (const person of allNames) {
    const id = (person.groupNum - 1) * 3 + person.position;
    
    if (person.name) {
      await db.update(persons)
        .set({ name: person.name })
        .where(eq(persons.id, id));
      
      console.log(`✓ تم تحديث: ${person.name} (المجموعة ${person.groupNum}، الموضع ${person.position})`);
    }
  }
  
  console.log("\n✅ تم تحديث جميع الأسماء بنجاح!");
  process.exit(0);
}

updateAllNames().catch(console.error);
