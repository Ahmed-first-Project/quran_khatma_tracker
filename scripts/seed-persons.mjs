import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, text, timestamp } from "drizzle-orm/mysql-core";
import dotenv from "dotenv";

dotenv.config();

// تعريف جدول persons
const persons = mysqlTable("persons", {
  id: int("id").autoincrement().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const db = drizzle(process.env.DATABASE_URL);

async function seedPersons() {
  console.log("🔄 بدء إضافة بيانات الأشخاص...");
  
  try {
    // التحقق من وجود بيانات
    const existing = await db.select().from(persons);
    if (existing.length > 0) {
      console.log(`✅ يوجد بالفعل ${existing.length} شخص في قاعدة البيانات`);
      return;
    }
    
    // إنشاء قائمة الأشخاص (180 شخص = 60 مجموعة × 3 أشخاص)
    const personsData = [];
    
    for (let group = 1; group <= 60; group++) {
      for (let person = 1; person <= 3; person++) {
        personsData.push({
          name: `شخص ${group}-${person}`,
        });
      }
    }
    
    console.log(`📝 إضافة ${personsData.length} شخص...`);
    
    // إضافة البيانات على دفعات
    const batchSize = 50;
    for (let i = 0; i < personsData.length; i += batchSize) {
      const batch = personsData.slice(i, i + batchSize);
      await db.insert(persons).values(batch);
      console.log(`   ✓ تمت إضافة ${Math.min(i + batchSize, personsData.length)} من ${personsData.length}`);
    }
    
    console.log("✅ تم إضافة جميع الأشخاص بنجاح!");
    
    // عرض عينة
    const sample = await db.select().from(persons).limit(5);
    console.log("\n📋 عينة من الأشخاص:");
    sample.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
    
  } catch (error) {
    console.error("❌ خطأ أثناء إضافة البيانات:", error);
    throw error;
  }
}

seedPersons()
  .then(() => {
    console.log("\n✨ اكتملت العملية بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 فشلت العملية:", error);
    process.exit(1);
  });
