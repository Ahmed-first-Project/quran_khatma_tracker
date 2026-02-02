import { eq, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, fridays, readings, persons } from "../drizzle/schema";
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
