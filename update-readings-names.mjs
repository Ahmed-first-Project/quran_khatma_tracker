import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import { mysqlTable, int, varchar, boolean, datetime } from 'drizzle-orm/mysql-core';

// تعريف جدول readings
const readings = mysqlTable('readings', {
  id: int('id').primaryKey().autoincrement(),
  fridayNumber: int('friday_number').notNull(),
  groupNumber: int('group_number').notNull(),
  juzNumber: int('juz_number').notNull(),
  khatmaNumber: int('khatma_number').notNull(),
  person1Name: varchar('person1_name', { length: 255 }).notNull(),
  person2Name: varchar('person2_name', { length: 255 }).notNull(),
  person3Name: varchar('person3_name', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: datetime('completed_at'),
  completedBy: varchar('completed_by', { length: 255 }),
});

// قراءة ملف المجموعات
const groupMembers = JSON.parse(fs.readFileSync('./group_members.json', 'utf-8'));

async function updateReadingsWithRealNames() {
  console.log('🔄 بدء تحديث جدول القراءات بالأسماء الحقيقية...\n');

  // الاتصال بقاعدة البيانات
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  let updatedCount = 0;
  let errorCount = 0;

  // تحديث كل مجموعة
  for (let groupNum = 1; groupNum <= 60; groupNum++) {
    const members = groupMembers[groupNum.toString()];
    
    if (!members || members.length === 0) {
      console.log(`⚠️  المجموعة ${groupNum}: لا توجد أسماء`);
      continue;
    }

    const [person1, person2, person3] = members;

    try {
      // تحديث جميع القراءات لهذه المجموعة
      const result = await db
        .update(readings)
        .set({
          person1Name: person1 || 'شخص أول',
          person2Name: person2 || 'شخص ثاني',
          person3Name: person3 || 'شخص ثالث'
        })
        .where(eq(readings.groupNumber, groupNum));

      updatedCount++;
      console.log(`✅ المجموعة ${groupNum}: ${person1} - ${person2} - ${person3}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ خطأ في المجموعة ${groupNum}:`, error.message);
    }
  }

  await connection.end();

  console.log(`\n📊 النتائج:`);
  console.log(`   ✅ تم التحديث: ${updatedCount} مجموعة`);
  console.log(`   ❌ فشل: ${errorCount} مجموعة`);
  console.log(`\n✨ اكتمل التحديث بنجاح!`);
}

// تشغيل السكريبت
updateReadingsWithRealNames().catch(console.error);
