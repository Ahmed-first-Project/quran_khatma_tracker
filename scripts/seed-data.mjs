import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, timestamp, text, boolean, datetime } from "drizzle-orm/mysql-core";
import dotenv from "dotenv";

dotenv.config();

// تعريف الجداول محلياً
const fridays = mysqlTable("fridays", {
  id: int("id").autoincrement().primaryKey(),
  fridayNumber: int("fridayNumber").notNull().unique(),
  dateGregorian: varchar("dateGregorian", { length: 20 }).notNull(),
  dateHijri: varchar("dateHijri", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const readings = mysqlTable("readings", {
  id: int("id").autoincrement().primaryKey(),
  fridayNumber: int("fridayNumber").notNull(),
  juzNumber: int("juzNumber").notNull(),
  khatmaNumber: int("khatmaNumber").notNull(),
  groupNumber: int("groupNumber").notNull(),
  person1Name: text("person1Name").notNull(),
  person1Status: boolean("person1Status").default(false).notNull(),
  person1Date: datetime("person1Date"),
  person2Name: text("person2Name").notNull(),
  person2Status: boolean("person2Status").default(false).notNull(),
  person2Date: datetime("person2Date"),
  person3Name: text("person3Name").notNull(),
  person3Status: boolean("person3Status").default(false).notNull(),
  person3Date: datetime("person3Date"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const db = drizzle(process.env.DATABASE_URL);

// توليد تواريخ الجمعات من 21-11-2025 إلى 12-06-2026
function generateFridays() {
  const fridaysData = [];
  const startDate = new Date("2025-11-21");
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + (i * 7));
    
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = currentDate.getFullYear();
    
    fridaysData.push({
      fridayNumber: 181 + i,
      dateGregorian: `${day}-${month}-${year}`,
      dateHijri: null,
    });
  }
  
  return fridaysData;
}

// أسماء افتراضية للأشخاص (180 شخص = 60 مجموعة × 3 أشخاص)
function generatePersonNames() {
  const names = [];
  for (let group = 1; group <= 60; group++) {
    names.push(`شخص ${group}-1`);
    names.push(`شخص ${group}-2`);
    names.push(`شخص ${group}-3`);
  }
  return names;
}

// توليد القراءات لكل جمعة
function generateReadings() {
  const readingsData = [];
  const personNames = generatePersonNames();
  
  // لكل جمعة من 181 إلى 210
  for (let fridayNum = 181; fridayNum <= 210; fridayNum++) {
    // المجموعات 1-30: الختمة الأولى (الأجزاء 1-30)
    for (let group = 1; group <= 30; group++) {
      const baseIndex = (group - 1) * 3;
      readingsData.push({
        fridayNumber: fridayNum,
        juzNumber: group,
        khatmaNumber: 1,
        groupNumber: group,
        person1Name: personNames[baseIndex],
        person1Status: false,
        person1Date: null,
        person2Name: personNames[baseIndex + 1],
        person2Status: false,
        person2Date: null,
        person3Name: personNames[baseIndex + 2],
        person3Status: false,
        person3Date: null,
      });
    }
    
    // المجموعات 31-60: الختمة الثانية (الأجزاء 1-30)
    for (let group = 31; group <= 60; group++) {
      const baseIndex = (group - 1) * 3;
      const juzNum = group - 30;
      readingsData.push({
        fridayNumber: fridayNum,
        juzNumber: juzNum,
        khatmaNumber: 2,
        groupNumber: group,
        person1Name: personNames[baseIndex],
        person1Status: false,
        person1Date: null,
        person2Name: personNames[baseIndex + 1],
        person2Status: false,
        person2Date: null,
        person3Name: personNames[baseIndex + 2],
        person3Status: false,
        person3Date: null,
      });
    }
  }
  
  return readingsData;
}

async function seed() {
  try {
    console.log("🌱 بدء إضافة البيانات الأولية...");
    
    // إضافة الجمعات
    console.log("📅 إضافة بيانات الجمعات...");
    const fridaysData = generateFridays();
    await db.insert(fridays).values(fridaysData);
    console.log(`✅ تم إضافة ${fridaysData.length} جمعة`);
    
    // إضافة القراءات
    console.log("📖 إضافة بيانات القراءات...");
    const readingsData = generateReadings();
    
    // إضافة القراءات على دفعات (1000 صف في كل دفعة)
    const batchSize = 1000;
    for (let i = 0; i < readingsData.length; i += batchSize) {
      const batch = readingsData.slice(i, i + batchSize);
      await db.insert(readings).values(batch);
      console.log(`✅ تم إضافة دفعة ${Math.floor(i / batchSize) + 1} (${batch.length} صف)`);
    }
    
    console.log(`✅ تم إضافة ${readingsData.length} قراءة بنجاح`);
    console.log("🎉 اكتملت عملية إضافة البيانات الأولية!");
    
  } catch (error) {
    console.error("❌ خطأ في إضافة البيانات:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seed();
