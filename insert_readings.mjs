#!/usr/bin/env node
/**
 * إدراج القراءات لجميع الجمعات
 */
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.js';
import fs from 'fs';

// قراءة الأسماء من JSON
const participantsData = JSON.parse(fs.readFileSync('/home/ubuntu/participants_list.json', 'utf-8'));

// تجميع حسب المجموعات
const groups = {};
for (const p of participantsData) {
  if (!groups[p.group]) groups[p.group] = [];
  groups[p.group].push(p.name);
}

console.log(`تم تحميل ${participantsData.length} اسم`);
console.log(`عدد المجموعات: ${Object.keys(groups).length}`);

// الاتصال بقاعدة البيانات
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

console.log('\nإدراج القراءات...');

// إدراج القراءات على دفعات
const batchSize = 500;
let totalInserted = 0;

for (let fridayNum = 181; fridayNum <= 210; fridayNum++) {
  const fridayId = fridayNum - 180; // الجمعة 181 = ID 1
  
  const readingsBatch = [];
  
  for (const groupNum of Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b))) {
    const groupMembers = groups[groupNum];
    
    // حساب رقم الجزء
    const juzOffset = (fridayNum - 181) % 30;
    const juzNumber = juzOffset + 1;
    
    // إضافة قراءة لكل شخص
    for (const personName of groupMembers) {
      readingsBatch.push({
        fridayId,
        personName,
        groupNumber: parseInt(groupNum),
        juzNumber,
        isCompleted: false,
        completedAt: null
      });
    }
  }
  
  // إدراج الدفعة
  for (let i = 0; i < readingsBatch.length; i += batchSize) {
    const batch = readingsBatch.slice(i, i + batchSize);
    await db.insert(schema.readings).values(batch);
    totalInserted += batch.length;
  }
  
  if (fridayNum % 5 === 0) {
    console.log(`  تم إنشاء القراءات للجمعة ${fridayNum} (${totalInserted} قراءة)`);
  }
}

console.log(`\n✅ تم إدراج ${totalInserted} قراءة بنجاح!`);

await connection.end();
