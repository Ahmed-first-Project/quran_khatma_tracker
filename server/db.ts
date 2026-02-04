import { eq, and, or, like, sql, isNotNull, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, fridays, readings, persons, Person } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== دوال الجمعات =====

export async function getAllFridays() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(fridays).orderBy(fridays.fridayNumber);
  return result;
}

export async function getFridayByNumber(fridayNumber: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(fridays).where(eq(fridays.fridayNumber, fridayNumber)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== دوال القراءات =====

export async function getReadingsByFriday(fridayNumber: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(readings)
    .where(eq(readings.fridayNumber, fridayNumber))
    .orderBy(readings.khatmaNumber, readings.juzNumber);
  
  return result;
}

export async function getReadingsByPerson(personName: string) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(readings)
    .where(
      or(
        eq(readings.person1Name, personName),
        eq(readings.person2Name, personName),
        eq(readings.person3Name, personName)
      )
    )
    .orderBy(readings.fridayNumber, readings.khatmaNumber, readings.juzNumber);
  
  return result;
}

export async function searchReadingsByName(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  
  const searchPattern = `%${searchTerm}%`;
  const result = await db
    .select()
    .from(readings)
    .where(
      or(
        like(readings.person1Name, searchPattern),
        like(readings.person2Name, searchPattern),
        like(readings.person3Name, searchPattern)
      )
    )
    .orderBy(readings.fridayNumber, readings.khatmaNumber, readings.juzNumber);
  
  return result;
}

export async function updateReadingStatus(
  readingId: number,
  personNumber: 1 | 2 | 3,
  status: boolean,
  date: Date | null
) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const updateData: Record<string, any> = {};
    
    if (personNumber === 1) {
      updateData.person1Status = status;
      updateData.person1Date = date;
    } else if (personNumber === 2) {
      updateData.person2Status = status;
      updateData.person2Date = date;
    } else if (personNumber === 3) {
      updateData.person3Status = status;
      updateData.person3Date = date;
    }
    
    await db.update(readings).set(updateData).where(eq(readings.id, readingId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update reading status:", error);
    return false;
  }
}

// ===== دوال الإحصائيات =====

export async function getFridayStats(fridayNumber: number) {
  const db = await getDb();
  if (!db) return null;
  
  const fridayReadings = await getReadingsByFriday(fridayNumber);
  
  let completed = 0;
  const total = fridayReadings.length * 3; // كل قراءة فيها 3 أشخاص
  
  fridayReadings.forEach(reading => {
    if (reading.person1Status) completed++;
    if (reading.person2Status) completed++;
    if (reading.person3Status) completed++;
  });
  
  const pending = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  let status = "تحتاج متابعة";
  if (percentage >= 80) status = "ممتازة";
  else if (percentage >= 60) status = "جيدة";
  
  return {
    fridayNumber,
    completed,
    pending,
    total,
    percentage,
    status,
  };
}

export async function getAllFridaysStats() {
  const db = await getDb();
  if (!db) return [];
  
  const allFridays = await getAllFridays();
  const allReadings = await db.select().from(readings);
  
  // تجميع الإحصائيات لكل جمعة
  const fridayStatsMap: Record<number, { completed: number; total: number }> = {};
  
  allReadings.forEach(reading => {
    if (!fridayStatsMap[reading.fridayNumber]) {
      fridayStatsMap[reading.fridayNumber] = { completed: 0, total: 0 };
    }
    
    fridayStatsMap[reading.fridayNumber].total += 3;
    if (reading.person1Status) fridayStatsMap[reading.fridayNumber].completed++;
    if (reading.person2Status) fridayStatsMap[reading.fridayNumber].completed++;
    if (reading.person3Status) fridayStatsMap[reading.fridayNumber].completed++;
  });
  
  // إنشاء مصفوفة الإحصائيات
  const stats = allFridays.map(friday => {
    const fridayData = fridayStatsMap[friday.fridayNumber] || { completed: 0, total: 180 };
    const completed = fridayData.completed;
    const total = fridayData.total;
    const pending = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    let status = "تحتاج متابعة";
    if (percentage >= 80) status = "ممتازة";
    else if (percentage >= 60) status = "جيدة";
    
    return {
      fridayNumber: friday.fridayNumber,
      dateGregorian: friday.dateGregorian,
      completed,
      pending,
      total,
      percentage,
      status,
    };
  });
  
  return stats;
}

export async function getTopReaders(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const allReadings = await db.select().from(readings);
  
  // حساب إحصائيات كل شخص
  const personStats: Record<string, { completed: number; total: number }> = {};
  
  allReadings.forEach(reading => {
    // الشخص الأول
    if (!personStats[reading.person1Name]) {
      personStats[reading.person1Name] = { completed: 0, total: 0 };
    }
    personStats[reading.person1Name].total++;
    if (reading.person1Status) {
      personStats[reading.person1Name].completed++;
    }
    
    // الشخص الثاني
    if (!personStats[reading.person2Name]) {
      personStats[reading.person2Name] = { completed: 0, total: 0 };
    }
    personStats[reading.person2Name].total++;
    if (reading.person2Status) {
      personStats[reading.person2Name].completed++;
    }
    
    // الشخص الثالث
    if (!personStats[reading.person3Name]) {
      personStats[reading.person3Name] = { completed: 0, total: 0 };
    }
    personStats[reading.person3Name].total++;
    if (reading.person3Status) {
      personStats[reading.person3Name].completed++;
    }
  });
  
  // تحويل إلى مصفوفة وترتيب حسب النسبة المئوية
  const sortedReaders = Object.entries(personStats)
    .map(([name, stats]) => ({
      name,
      completed: stats.completed,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage || b.completed - a.completed)
    .slice(0, limit);
  
  return sortedReaders;
}

// دوال إدارة أسماء الأشخاص

export async function getAllPersons() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(persons);
}

export async function updatePersonName(personId: number, newName: string) {
  const db = await getDb();
  if (!db) return { success: false, message: "قاعدة البيانات غير متاحة" };
  
  try {
    // الحصول على الاسم القديم
    const person = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
    if (person.length === 0) {
      return { success: false, message: "الشخص غير موجود" };
    }
    
    const oldName = person[0].name;
    
    // تحديث الاسم في جدول persons
    await db.update(persons).set({ name: newName }).where(eq(persons.id, personId));
    
    // تحديث جميع القراءات باستخدام استعلامات محدثة متعددة
    // تحديث person1Name
    await db.update(readings)
      .set({ person1Name: newName })
      .where(eq(readings.person1Name, oldName));
    
    // تحديث person2Name
    await db.update(readings)
      .set({ person2Name: newName })
      .where(eq(readings.person2Name, oldName));
    
    // تحديث person3Name
    await db.update(readings)
      .set({ person3Name: newName })
      .where(eq(readings.person3Name, oldName));
    
    return { success: true, message: "تم تحديث الاسم بنجاح" };
  } catch (error) {
    console.error("[Database] Error updating person name:", error);
    return { success: false, message: "حدث خطأ أثناء التحديث" };
  }
}

export async function bulkUpdatePersonNames(updates: Array<{ id: number; name: string }>) {
  const db = await getDb();
  if (!db) return { success: false, message: "قاعدة البيانات غير متاحة" };
  
  try {
    let successCount = 0;
    
    for (const update of updates) {
      const result = await updatePersonName(update.id, update.name);
      if (result.success) successCount++;
    }
    
    return { 
      success: true, 
      message: `تم تحديث ${successCount} من ${updates.length} أسماء بنجاح`,
      count: successCount
    };
  } catch (error) {
    console.error("[Database] Error bulk updating person names:", error);
    return { success: false, message: "حدث خطأ أثناء التحديث الجماعي" };
  }
}


// ==================== Telegram Integration ====================

export async function linkTelegramAccount(
  personName: string,
  chatId: string,
  username?: string
): Promise<{ success: boolean; message: string; person?: Person }> {
  const db = await getDb();
  if (!db) return { success: false, message: "قاعدة البيانات غير متاحة" };

  try {
    // البحث عن الشخص بالاسم
    const matchingPersons = await db
      .select()
      .from(persons)
      .where(eq(persons.name, personName));

    if (matchingPersons.length === 0) {
      return {
        success: false,
        message: `لم يتم العثور على "${personName}" في قائمة المشاركين`,
      };
    }

    if (matchingPersons.length > 1) {
      return {
        success: false,
        message: `يوجد أكثر من شخص بنفس الاسم "${personName}". يرجى التواصل مع المشرف`,
      };
    }

    const person = matchingPersons[0];

    // التحقق من عدم ربط الحساب مسبقاً
    if (person.telegramChatId && person.telegramChatId !== chatId) {
      return {
        success: false,
        message: "هذا الحساب مرتبط بحساب Telegram آخر",
      };
    }

    // ربط الحساب
    await db
      .update(persons)
      .set({
        telegramChatId: chatId,
        telegramUsername: username || null,
      })
      .where(eq(persons.id, person.id));

    const updatedPerson = await db
      .select()
      .from(persons)
      .where(eq(persons.id, person.id))
      .limit(1);

    return {
      success: true,
      message: "تم ربط حسابك بنجاح!",
      person: updatedPerson[0],
    };
  } catch (error) {
    console.error("[Database] Error linking Telegram account:", error);
    return { success: false, message: "حدث خطأ أثناء ربط الحساب" };
  }
}

export async function getPersonByChatId(chatId: string): Promise<Person | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(persons)
    .where(eq(persons.telegramChatId, chatId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAdmins(): Promise<Person[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(persons)
    .where(eq(persons.isAdmin, true));
}

export async function setPersonAsAdmin(personId: number, isAdmin: boolean): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(persons)
      .set({ isAdmin })
      .where(eq(persons.id, personId));

    return true;
  } catch (error) {
    console.error("[Database] Error setting admin status:", error);
    return false;
  }
}

export async function getReadingById(readingId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(readings).where(eq(readings.id, readingId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPersonById(personId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getLinkedAdmins(): Promise<Person[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(persons)
    .where(and(eq(persons.isAdmin, true), isNotNull(persons.telegramChatId)));
}

export async function getAllLinkedPersons(): Promise<Person[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(persons)
    .where(isNotNull(persons.telegramChatId));
}

export async function getReadingsByDate(date: Date) {
  const db = await getDb();
  if (!db) return [];
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // إرجاع جميع القراءات التي تم تحديثها اليوم
  return await db
    .select()
    .from(readings)
    .where(
      and(
        gte(readings.updatedAt, startOfDay),
        lte(readings.updatedAt, endOfDay)
      )
    );
}

export async function addPerson(name: string, groupNumber: number) {
  const db = await getDb();
  if (!db) return { success: false, message: "قاعدة البيانات غير متاحة" };

  try {
    // إضافة الشخص إلى جدول persons فقط
    // لا نضيف إلى القراءات تلقائياً - يتم ذلك يدوياً من الواجهة
    const result = await db.insert(persons).values({ name });
    const personId = result[0].insertId;

    return { 
      success: true, 
      message: "تمت إضافة المشارك بنجاح. يمكنك الآن ربطه بالقراءات من صفحة إدارة المشاركين",
      personId 
    };
  } catch (error) {
    console.error("[Database] Error adding person:", error);
    return { success: false, message: "حدث خطأ أثناء إضافة المشارك" };
  }
}

export async function deletePerson(personId: number) {
  const db = await getDb();
  if (!db) return { success: false, message: "قاعدة البيانات غير متاحة" };

  try {
    // الحصول على اسم الشخص
    const person = await db.select().from(persons).where(eq(persons.id, personId)).limit(1);
    if (person.length === 0) {
      return { success: false, message: "الشخص غير موجود" };
    }

    const personName = person[0].name;

    // حذف جميع القراءات التي تحتوي على هذا الشخص
    // نحذف السطور التي يكون فيها الشخص person1, person2, أو person3
    await db.delete(readings).where(
      or(
        eq(readings.person1Name, personName),
        eq(readings.person2Name, personName),
        eq(readings.person3Name, personName)
      )
    );

    // حذف الشخص من جدول persons
    await db.delete(persons).where(eq(persons.id, personId));

    return { success: true, message: "تم حذف المشارك بنجاح" };
  } catch (error) {
    console.error("[Database] Error deleting person:", error);
    return { success: false, message: "حدث خطأ أثناء حذف المشارك" };
  }
}
