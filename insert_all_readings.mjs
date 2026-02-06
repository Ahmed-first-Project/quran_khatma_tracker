import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// قراءة ملف الأسماء
const persons = JSON.parse(fs.readFileSync('/home/ubuntu/persons_list.json', 'utf8'));

console.log(`عدد المشتركين: ${persons.length}`);

// تقسيم المشتركين إلى مجموعات (كل مجموعة 3 أشخاص أو أقل)
const groups = [];
for (let i = 0; i < persons.length; i += 3) {
  const group = persons.slice(i, i + 3);
  groups.push(group);
}

console.log(`عدد المجموعات: ${groups.length}`);

// إدراج القراءات
let insertedCount = 0;
const startFriday = 181;
const endFriday = 210;

for (let fridayNum = startFriday; fridayNum <= endFriday; fridayNum++) {
  console.log(`\nمعالجة الجمعة ${fridayNum}...`);
  
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
    const group = groups[groupIndex];
    const groupNumber = groupIndex + 1;
    
    // تحديد الختمة (1-30 = ختمة أولى، 31-60 = ختمة ثانية)
    const khatmaNumber = groupNumber <= 30 ? 1 : 2;
    
    // حساب رقم الجزء لكل شخص في المجموعة
    const fridayOffset = fridayNum - startFriday; // 0, 1, 2, ...
    
    // الشخص الأول: يبدأ من 30 وينزل (30, 29, 28, ...)
    const juz1 = 30 - fridayOffset;
    const finalJuz1 = juz1 <= 0 ? juz1 + 30 : juz1;
    
    // الشخص الثاني: يبدأ من 1 ويدور (1, 30, 29, ...)
    const juz2 = fridayOffset === 0 ? 1 : (30 - fridayOffset + 1);
    const finalJuz2 = juz2 <= 0 ? juz2 + 30 : juz2;
    
    // الشخص الثالث: يبدأ من 2 ويدور (2, 1, 30, ...)
    const juz3 = fridayOffset === 0 ? 2 : (fridayOffset === 1 ? 1 : (30 - fridayOffset + 2));
    const finalJuz3 = juz3 <= 0 ? juz3 + 30 : juz3;
    
    // إدراج القراءة
    const person1Name = group[0]?.name || 'شخص أول';
    const person2Name = group[1]?.name || 'شخص ثاني';
    const person3Name = group[2]?.name || 'شخص ثالث';
    
    await connection.query(`
      INSERT INTO readings (
        fridayNumber,
        juzNumber,
        groupNumber,
        khatmaNumber,
        person1Name,
        person1Status,
        person1Date,
        person2Name,
        person2Status,
        person2Date,
        person3Name,
        person3Status,
        person3Date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fridayNum,
      finalJuz1, // نستخدم جزء الشخص الأول كرقم الجزء الرئيسي
      groupNumber,
      khatmaNumber,
      person1Name,
      false,
      null,
      person2Name,
      false,
      null,
      person3Name,
      false,
      null
    ]);
    
    insertedCount++;
  }
  
  console.log(`تم إدراج ${groups.length} قراءة للجمعة ${fridayNum}`);
}

console.log(`\n✅ تم إدراج ${insertedCount} قراءة بنجاح!`);

await connection.end();
