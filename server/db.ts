import { eq, and, or, like, sql, isNotNull, gte, lte, asc, gt } from "drizzle-orm";
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

// ==================== دوال الإشعارات ====================

import { notifications, notificationSettings } from "../drizzle/schema";
import { desc } from "drizzle-orm";

/**
 * الحصول على جميع المشاركين الذين لم يسجلوا قراءاتهم لجمعة معينة
 */
export async function getPendingReadings(fridayNumber: number) {
  const db = await getDb();
  if (!db) return [];

  // جلب جميع القراءات والأشخاص مرة واحدة
  const allReadings = await db
    .select()
    .from(readings)
    .where(eq(readings.fridayNumber, fridayNumber));

  const allPersons = await db
    .select()
    .from(persons)
    .where(isNotNull(persons.telegramChatId));

  // إنشاء خريطة للأشخاص للوصول السريع
  const personsMap = new Map<string, { chatId: string; username?: string | null }>();
  allPersons.forEach(person => {
    if (person.telegramChatId) {
      personsMap.set(person.name, {
        chatId: person.telegramChatId,
        username: person.telegramUsername,
      });
    }
  });

  const pending: Array<{
    name: string;
    chatId: string | null;
    juzNumber: number;
    groupNumber: number;
    personPosition: 1 | 2 | 3;
  }> = [];

  for (const reading of allReadings) {
    // الشخص الأول
    if (!reading.person1Status && reading.person1Name !== 'شخص أول') {
      const person = personsMap.get(reading.person1Name);
      if (person) {
        pending.push({
          name: reading.person1Name,
          chatId: person.chatId,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 1,
        });
      }
    }

    // الشخص الثاني
    if (!reading.person2Status && reading.person2Name !== 'شخص ثاني') {
      const person = personsMap.get(reading.person2Name);
      if (person) {
        pending.push({
          name: reading.person2Name,
          chatId: person.chatId,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 2,
        });
      }
    }

    // الشخص الثالث
    if (!reading.person3Status && reading.person3Name !== 'شخص ثالث') {
      const person = personsMap.get(reading.person3Name);
      if (person) {
        pending.push({
          name: reading.person3Name,
          chatId: person.chatId,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 3,
        });
      }
    }
  }

  return pending;
}

/**
 * حفظ إشعار في قاعدة البيانات
 */
export async function saveNotification(data: {
  fridayNumber: number;
  recipientName: string;
  recipientChatId: string;
  messageText: string;
  notificationType: 'reminder' | 'manual' | 'scheduled';
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
  sentAt?: Date;
}) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(notifications).values(data);
  return result;
}

/**
 * الحصول على جميع الإشعارات لجمعة معينة
 */
export async function getNotificationsByFriday(fridayNumber: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.fridayNumber, fridayNumber))
    .orderBy(desc(notifications.createdAt));
}

/**
 * الحصول على آخر N إشعار
 */
export async function getRecentNotifications(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * الحصول على إعداد معين
 */
export async function getNotificationSetting(key: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.settingKey, key))
    .limit(1);
  
  return result[0] || null;
}

/**
 * تحديث أو إنشاء إعداد
 */
export async function upsertNotificationSetting(
  key: string,
  value: string,
  description?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const existing = await getNotificationSetting(key);
    
    if (existing) {
      await db
        .update(notificationSettings)
        .set({ settingValue: value, description })
        .where(eq(notificationSettings.settingKey, key));
    } else {
      await db.insert(notificationSettings).values({
        settingKey: key,
        settingValue: value,
        description,
      });
    }
    return true;
  } catch (error) {
    console.error("[Database] Error upserting notification setting:", error);
    return false;
  }
}

/**
 * الحصول على جميع الإعدادات
 */
export async function getAllNotificationSettings() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notificationSettings);
}

/**
 * حساب عدد القراءات المتتالية للمشارك
 */
export async function getConsecutiveReadings(personName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // الحصول على جميع القراءات مرتبة حسب رقم الجمعة تنازلياً
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      )
      .orderBy(desc(readings.fridayNumber));

    let consecutive = 0;
    let lastFridayNumber: number | null = null;

    for (const reading of allReadings) {
      // تحديد أي شخص في القراءة
      let isCompleted = false;
      if (reading.person1Name === personName && reading.person1Status) {
        isCompleted = true;
      } else if (reading.person2Name === personName && reading.person2Status) {
        isCompleted = true;
      } else if (reading.person3Name === personName && reading.person3Status) {
        isCompleted = true;
      }

      // إذا كانت القراءة مكتملة
      if (isCompleted) {
        // إذا كانت أول قراءة أو متتالية مع السابقة
        if (lastFridayNumber === null || reading.fridayNumber === lastFridayNumber - 1) {
          consecutive++;
          lastFridayNumber = reading.fridayNumber;
        } else {
          // إذا كانت هناك فجوة، نتوقف
          break;
        }
      } else {
        // إذا كانت القراءة غير مكتملة، نتوقف
        break;
      }
    }

    return consecutive;
  } catch (error) {
    console.error("[Database] Error getting consecutive readings:", error);
    return 0;
  }
}

/**
 * حساب نسبة الإنجاز الإجمالية للمشارك
 */
export async function getCompletionRate(personName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    // الحصول على جميع القراءات
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      );

    if (allReadings.length === 0) return 0;

    // حساب عدد القراءات المكتملة
    let completed = 0;
    for (const reading of allReadings) {
      if (reading.person1Name === personName && reading.person1Status) completed++;
      else if (reading.person2Name === personName && reading.person2Status) completed++;
      else if (reading.person3Name === personName && reading.person3Status) completed++;
    }

    // حساب النسبة المئوية
    return Math.round((completed / allReadings.length) * 100);
  } catch (error) {
    console.error("[Database] Error getting completion rate:", error);
    return 0;
  }
}

/**
 * التحقق من أن المشارك هو الأول في مجموعته لهذه الجمعة
 */
export async function isFirstInGroup(personName: string, fridayNumber: number, groupNumber: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // الحصول على القراءة لهذه المجموعة في هذه الجمعة
    const groupReading = await db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.groupNumber, groupNumber),
          eq(readings.fridayNumber, fridayNumber)
        )
      )
      .limit(1);

    if (groupReading.length === 0) return false;

    const reading = groupReading[0];

    // التحقق من أول من سجل في المجموعة
    const completionDates: { name: string; date: Date | null }[] = [
      { name: reading.person1Name, date: reading.person1Date },
      { name: reading.person2Name, date: reading.person2Date },
      { name: reading.person3Name, date: reading.person3Date },
    ];

    // فلترة من أكملوا القراءة
    const completed = completionDates.filter((p) => p.date !== null);

    if (completed.length === 0) return false;

    // ترتيب حسب التاريخ
    completed.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });

    // التحقق من أن المشارك هو الأول
    return completed[0].name === personName;
  } catch (error) {
    console.error("[Database] Error checking first in group:", error);
    return false;
  }
}

/**
 * التحقق من أن المشارك هو الأول في الجمعة بشكل عام
 */
export async function isFirstOverall(personName: string, fridayNumber: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // الحصول على جميع القراءات في هذه الجمعة
    const allReadings = await db
      .select()
      .from(readings)
      .where(eq(readings.fridayNumber, fridayNumber));

    if (allReadings.length === 0) return false;

    // جمع جميع تواريخ الإكمال
    const completionDates: { name: string; date: Date | null }[] = [];

    for (const reading of allReadings) {
      if (reading.person1Status && reading.person1Date) {
        completionDates.push({ name: reading.person1Name, date: reading.person1Date });
      }
      if (reading.person2Status && reading.person2Date) {
        completionDates.push({ name: reading.person2Name, date: reading.person2Date });
      }
      if (reading.person3Status && reading.person3Date) {
        completionDates.push({ name: reading.person3Name, date: reading.person3Date });
      }
    }

    if (completionDates.length === 0) return false;

    // ترتيب حسب التاريخ
    completionDates.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return a.date.getTime() - b.date.getTime();
    });

    // التحقق من أن المشارك هو الأول
    return completionDates[0].name === personName;
  } catch (error) {
    console.error("[Database] Error checking first overall:", error);
    return false;
  }
}

/**
 * الحصول على إجمالي عدد القراءات المكتملة للمشارك
 */
export async function getTotalCompletedReadings(personName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      );

    let completed = 0;
    for (const reading of allReadings) {
      if (reading.person1Name === personName && reading.person1Status) completed++;
      else if (reading.person2Name === personName && reading.person2Status) completed++;
      else if (reading.person3Name === personName && reading.person3Status) completed++;
    }

    return completed;
  } catch (error) {
    console.error("[Database] Error getting total completed readings:", error);
    return 0;
  }
}

/**
 * حساب عدد القراءات المنتظرة للمشارك
 */
export async function getPendingReadingsCount(personName: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      );

    let pending = 0;
    for (const reading of allReadings) {
      if (reading.person1Name === personName && !reading.person1Status) pending++;
      else if (reading.person2Name === personName && !reading.person2Status) pending++;
      else if (reading.person3Name === personName && !reading.person3Status) pending++;
    }

    return pending;
  } catch (error) {
    console.error("[Database] Error getting pending readings count:", error);
    return 0;
  }
}

/**
 * الحصول على آخر قراءة مسجلة للمشارك
 */
export async function getLastCompletedReading(personName: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      )
      .orderBy(desc(readings.fridayNumber));

    for (const reading of allReadings) {
      if (reading.person1Name === personName && reading.person1Status && reading.person1Date) {
        return {
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          khatmaNumber: reading.khatmaNumber,
          completedAt: reading.person1Date,
        };
      } else if (reading.person2Name === personName && reading.person2Status && reading.person2Date) {
        return {
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          khatmaNumber: reading.khatmaNumber,
          completedAt: reading.person2Date,
        };
      } else if (reading.person3Name === personName && reading.person3Status && reading.person3Date) {
        return {
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          khatmaNumber: reading.khatmaNumber,
          completedAt: reading.person3Date,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[Database] Error getting last completed reading:", error);
    return null;
  }
}

/**
 * حساب ترتيب المشارك في مجموعته حسب عدد القراءات المكتملة
 */
export async function getGroupRanking(personName: string): Promise<{ rank: number; totalMembers: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // الحصول على معلومات المشارك
    const person = await db
      .select()
      .from(persons)
      .where(eq(persons.name, personName))
      .limit(1);

    if (person.length === 0) return null;

    // الحصول على رقم المجموعة من أول قراءة
    const firstReading = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      )
      .limit(1);

    if (firstReading.length === 0) return null;

    const groupNumber = firstReading[0].groupNumber;

    // الحصول على جميع القراءات في هذه المجموعة
    const groupReadings = await db
      .select()
      .from(readings)
      .where(eq(readings.groupNumber, groupNumber));

    if (groupReadings.length === 0) return null;

    // حساب عدد القراءات المكتملة لكل عضو
    const memberStats: { [name: string]: number } = {};

    for (const reading of groupReadings) {
      // الشخص الأول
      if (!memberStats[reading.person1Name]) memberStats[reading.person1Name] = 0;
      if (reading.person1Status) memberStats[reading.person1Name]++;

      // الشخص الثاني
      if (!memberStats[reading.person2Name]) memberStats[reading.person2Name] = 0;
      if (reading.person2Status) memberStats[reading.person2Name]++;

      // الشخص الثالث
      if (!memberStats[reading.person3Name]) memberStats[reading.person3Name] = 0;
      if (reading.person3Status) memberStats[reading.person3Name]++;
    }

    // ترتيب الأعضاء حسب عدد القراءات
    const sortedMembers = Object.entries(memberStats).sort((a, b) => b[1] - a[1]);

    // البحث عن ترتيب المشارك
    const rank = sortedMembers.findIndex(([name]) => name === personName) + 1;

    return {
      rank,
      totalMembers: sortedMembers.length,
    };
  } catch (error) {
    console.error("[Database] Error getting group ranking:", error);
    return null;
  }
}

/**
 * الحصول على أول قراءة منتظرة لشخص معين
 */
export async function getNextPendingReadingForPerson(personName: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        or(
          eq(readings.person1Name, personName),
          eq(readings.person2Name, personName),
          eq(readings.person3Name, personName)
        )
      )
      .orderBy(asc(readings.fridayNumber));

    for (const reading of allReadings) {
      if (reading.person1Name === personName && !reading.person1Status) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 1 as 1 | 2 | 3,
          personName: reading.person1Name
        };
      } else if (reading.person2Name === personName && !reading.person2Status) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 2 as 1 | 2 | 3,
          personName: reading.person2Name
        };
      } else if (reading.person3Name === personName && !reading.person3Status) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 3 as 1 | 2 | 3,
          personName: reading.person3Name
        };
      }
    }

    return null;
  } catch (error) {
    console.error("[Database] Error getting next pending reading:", error);
    return null;
  }
}

/**
 * الحصول على الجمعة الحالية حسب التاريخ
 */
export async function getCurrentFriday() {
  const db = await getDb();
  if (!db) return null;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // تصفير الوقت للمقارنة بالتاريخ فقط
    
    // الحصول على جميع الجمعات
    const allFridays = await db
      .select()
      .from(fridays)
      .orderBy(asc(fridays.fridayNumber));
    
    let currentOrNextFriday = null;
    
    // البحث عن الجمعة الحالية أو القادمة
    for (const friday of allFridays) {
      const [day, month, year] = friday.dateGregorian.split('-');
      const fridayDate = new Date(`${year}-${month}-${day}`);
      fridayDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((fridayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // إذا كانت الجمعة في المستقبل أو اليوم أو خلال 3 أيام ماضية
      if (diffDays >= -3) {
        currentOrNextFriday = friday;
        break; // نأخذ أول جمعة تحقق الشرط
      }
    }
    
    // إذا لم نجد جمعة، نرجع آخر جمعة
    const result = currentOrNextFriday || allFridays[allFridays.length - 1] || null;
    console.log(`[Database] getCurrentFriday: Today=${today.toISOString().split('T')[0]}, Result=${result ? `Friday ${result.fridayNumber} (${result.dateGregorian})` : 'null'}`);
    return result;
  } catch (error) {
    console.error("[Database] Error getting current Friday:", error);
    return null;
  }
}

/**
 * الحصول على الجمعة القادمة بعد جمعة محددة
 */
export async function getNextFriday(currentFridayNumber: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const nextFriday = await db
      .select()
      .from(fridays)
      .where(gt(fridays.fridayNumber, currentFridayNumber))
      .orderBy(asc(fridays.fridayNumber))
      .limit(1);
    
    return nextFriday[0] || null;
  } catch (error) {
    console.error("[Database] Error getting next Friday:", error);
    return null;
  }
}

/**
 * الحصول على القراءة المطلوبة لشخص معين في جمعة محددة
 */
export async function getReadingForPersonAndFriday(personName: string, fridayNumber: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const allReadings = await db
      .select()
      .from(readings)
      .where(
        and(
          eq(readings.fridayNumber, fridayNumber),
          or(
            eq(readings.person1Name, personName),
            eq(readings.person2Name, personName),
            eq(readings.person3Name, personName)
          )
        )
      );
    
    for (const reading of allReadings) {
      if (reading.person1Name === personName) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 1 as 1 | 2 | 3,
          personName: reading.person1Name,
          isCompleted: reading.person1Status,
          completedDate: reading.person1Date
        };
      } else if (reading.person2Name === personName) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 2 as 1 | 2 | 3,
          personName: reading.person2Name,
          isCompleted: reading.person2Status,
          completedDate: reading.person2Date
        };
      } else if (reading.person3Name === personName) {
        return {
          id: reading.id,
          fridayNumber: reading.fridayNumber,
          juzNumber: reading.juzNumber,
          groupNumber: reading.groupNumber,
          personPosition: 3 as 1 | 2 | 3,
          personName: reading.person3Name,
          isCompleted: reading.person3Status,
          completedDate: reading.person3Date
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error("[Database] Error getting reading for person and Friday:", error);
    return null;
  }
}

/**
 * حساب ترتيب المشارك بين جميع المشتركين حسب عدد القراءات المكتملة
 */
export async function getOverallRanking(personName: string): Promise<{ rank: number; totalParticipants: number; completedReadings: number } | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // الحصول على جميع القراءات
    const allReadings = await db.select().from(readings);

    if (allReadings.length === 0) return null;

    // حساب عدد القراءات المكتملة لكل مشارك
    const participantStats: { [name: string]: number } = {};

    for (const reading of allReadings) {
      // الشخص الأول
      if (!participantStats[reading.person1Name]) participantStats[reading.person1Name] = 0;
      if (reading.person1Status) participantStats[reading.person1Name]++;

      // الشخص الثاني
      if (!participantStats[reading.person2Name]) participantStats[reading.person2Name] = 0;
      if (reading.person2Status) participantStats[reading.person2Name]++;

      // الشخص الثالث
      if (!participantStats[reading.person3Name]) participantStats[reading.person3Name] = 0;
      if (reading.person3Status) participantStats[reading.person3Name]++;
    }

    // ترتيب المشاركين حسب عدد القراءات (تنازلياً)
    const sortedParticipants = Object.entries(participantStats).sort((a, b) => b[1] - a[1]);

    // البحث عن ترتيب المشارك
    const rankIndex = sortedParticipants.findIndex(([name]) => name === personName);
    
    if (rankIndex === -1) return null;

    return {
      rank: rankIndex + 1,
      totalParticipants: sortedParticipants.length,
      completedReadings: participantStats[personName] || 0,
    };
  } catch (error) {
    console.error("[Database] Error getting overall ranking:", error);
    return null;
  }
}
