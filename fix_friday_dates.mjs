import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🔧 تحديث تواريخ الجمعات...\n');

// تاريخ البداية الصحيح: الخميس 21 نوفمبر 2025 (الجمعة 181)
const startDate = new Date(2025, 10, 21); // Month is 0-indexed (10 = November)

// تحديث جميع الجمعات (181-210)
for (let fridayNum = 181; fridayNum <= 210; fridayNum++) {
  const weekOffset = fridayNum - 181;
  const fridayDate = new Date(startDate);
  fridayDate.setDate(fridayDate.getDate() + (weekOffset * 7));
  
  const day = String(fridayDate.getDate()).padStart(2, '0');
  const month = String(fridayDate.getMonth() + 1).padStart(2, '0');
  const year = fridayDate.getFullYear();
  const dateGregorian = `${day}-${month}-${year}`;
  
  await connection.query(`
    UPDATE fridays 
    SET dateGregorian = ? 
    WHERE fridayNumber = ?
  `, [dateGregorian, fridayNum]);
  
  const dayName = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][fridayDate.getDay()];
  console.log(`✅ الجمعة ${fridayNum}: ${dateGregorian} (${dayName})`);
}

console.log('\n🎉 تم تحديث جميع التواريخ بنجاح!');

await connection.end();
