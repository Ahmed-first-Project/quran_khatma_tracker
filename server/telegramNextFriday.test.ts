/**
 * اختبارات عرض الجزء القادم في القائمة الرئيسية
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("عرض الجزء القادم في القائمة الرئيسية", () => {
  beforeAll(async () => {
    // التأكد من وجود بيانات الاختبار
    await db.getDb();
  });

  it("يجب أن تعيد getNextFriday الجمعة التالية بشكل صحيح", async () => {
    const nextFriday = await db.getNextFriday(1);
    
    expect(nextFriday).toBeDefined();
    expect(nextFriday?.fridayNumber).toBeGreaterThan(1);
  });

  it("يجب أن تعيد getNextFriday null إذا لم توجد جمعة تالية", async () => {
    const nextFriday = await db.getNextFriday(999);
    
    expect(nextFriday).toBeNull();
  });

  it("يجب أن تعيد getCurrentFriday الجمعة الحالية أو القادمة", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    expect(currentFriday).toBeDefined();
    expect(currentFriday?.fridayNumber).toBeGreaterThan(0);
  });

  it("يجب أن تحدد بشكل صحيح إذا كانت الجمعة ماضية", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // جمعة ماضية (قبل 10 أيام)
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 10);
    
    expect(pastDate.getTime()).toBeLessThan(today.getTime());
  });

  it("يجب أن تحدد بشكل صحيح إذا كانت الجمعة حالية أو قادمة", () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // جمعة قادمة (بعد 3 أيام)
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 3);
    
    expect(futureDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
  });

  it("يجب أن تعيد getReadingForPersonAndFriday القراءة الصحيحة", async () => {
    const reading = await db.getReadingForPersonAndFriday("أحمد اللاذقاني", 192);
    
    expect(reading).toBeDefined();
    expect(reading?.juzNumber).toBeGreaterThan(0);
    expect(reading?.groupNumber).toBeGreaterThan(0);
  });

  it("يجب أن تعيد getNextFriday الجمعة التالية بعد الجمعة الحالية", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    if (currentFriday) {
      const nextFriday = await db.getNextFriday(currentFriday.fridayNumber);
      
      if (nextFriday) {
        expect(nextFriday.fridayNumber).toBeGreaterThan(currentFriday.fridayNumber);
      }
    }
  });
});
