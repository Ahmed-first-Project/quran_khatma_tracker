/**
 * اختبارات تحسينات البوت
 * - عرض الجزء المطلوب للجمعة الحالية
 * - رابط مباشر للمصحف
 * - تسجيل القراءة وتحديث قاعدة البيانات
 */

import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getQuranKeyboard } from "./telegramKeyboards";

describe("تحسينات البوت - عرض الجزء المطلوب", () => {
  it("يجب أن تعيد دالة getCurrentFriday الجمعة الحالية", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    expect(currentFriday).toBeDefined();
    expect(currentFriday).not.toBeNull();
    
    if (currentFriday) {
      expect(currentFriday.fridayNumber).toBeGreaterThanOrEqual(181);
      expect(currentFriday.fridayNumber).toBeLessThanOrEqual(210);
      expect(currentFriday.dateGregorian).toBeDefined();
    }
  });

  it("يجب أن تعيد دالة getReadingForPersonAndFriday القراءة الصحيحة", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    if (!currentFriday) {
      console.warn("لا توجد جمعة حالية - تخطي الاختبار");
      return;
    }
    
    // اختبار مع شخص موجود
    const reading = await db.getReadingForPersonAndFriday("محمود أبو تيم", currentFriday.fridayNumber);
    
    if (reading) {
      expect(reading.fridayNumber).toBe(currentFriday.fridayNumber);
      expect(reading.juzNumber).toBeGreaterThanOrEqual(1);
      expect(reading.juzNumber).toBeLessThanOrEqual(30);
      expect(reading.groupNumber).toBeGreaterThanOrEqual(1);
      expect(reading.groupNumber).toBeLessThanOrEqual(60);
      expect(reading.personPosition).toBeGreaterThanOrEqual(1);
      expect(reading.personPosition).toBeLessThanOrEqual(3);
    }
  });

  it("يجب أن تعيد null للشخص غير الموجود", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    if (!currentFriday) {
      console.warn("لا توجد جمعة حالية - تخطي الاختبار");
      return;
    }
    
    const reading = await db.getReadingForPersonAndFriday("شخص غير موجود", currentFriday.fridayNumber);
    expect(reading).toBeNull();
  });
});

describe("تحسينات البوت - رابط المصحف", () => {
  it("يجب أن تُنشئ getQuranKeyboard رابط صحيح للجزء المحدد", () => {
    const keyboard = getQuranKeyboard(12); // الجزء 12
    
    expect(keyboard).toBeDefined();
    expect(keyboard.inline_keyboard).toBeDefined();
    expect(keyboard.inline_keyboard.length).toBeGreaterThan(0);
    
    const firstButton = keyboard.inline_keyboard[0][0];
    expect(firstButton.text).toContain("12");
    expect(firstButton.url).toBeDefined();
    expect(firstButton.url).toContain("quranflash.com");
    
    // الجزء 12 يبدأ من الصفحة 221 = (12-1)*20+1
    const expectedPage = (12 - 1) * 20 + 1;
    expect(firstButton.url).toContain(`startpage=${expectedPage}`);
  });

  it("يجب أن تُنشئ getQuranKeyboard رابط عام بدون رقم جزء", () => {
    const keyboard = getQuranKeyboard();
    
    expect(keyboard).toBeDefined();
    expect(keyboard.inline_keyboard).toBeDefined();
    
    const firstButton = keyboard.inline_keyboard[0][0];
    expect(firstButton.url).toBeDefined();
    expect(firstButton.url).toContain("quranflash.com");
    expect(firstButton.url).not.toContain("startpage");
  });

  it("يجب أن تحسب الصفحة الصحيحة لكل جزء", () => {
    // الجزء 1 يبدأ من الصفحة 1
    const keyboard1 = getQuranKeyboard(1);
    expect(keyboard1.inline_keyboard[0][0].url).toContain("startpage=1");
    
    // الجزء 30 يبدأ من الصفحة 581 = (30-1)*20+1
    const keyboard30 = getQuranKeyboard(30);
    expect(keyboard30.inline_keyboard[0][0].url).toContain("startpage=581");
  });
});

describe("تحسينات البوت - تسجيل القراءة", () => {
  it("يجب أن تُحدّث updateReadingStatus حالة القراءة بشكل صحيح", async () => {
    const currentFriday = await db.getCurrentFriday();
    
    if (!currentFriday) {
      console.warn("لا توجد جمعة حالية - تخطي الاختبار");
      return;
    }
    
    // الحصول على قراءة للاختبار
    const reading = await db.getReadingForPersonAndFriday("محمود أبو تيم", currentFriday.fridayNumber);
    
    if (!reading) {
      console.warn("لا توجد قراءة للاختبار - تخطي");
      return;
    }
    
    // حفظ الحالة الأصلية
    const originalStatus = reading.isCompleted;
    
    // تغيير الحالة
    const success = await db.updateReadingStatus(
      reading.id,
      reading.personPosition,
      !originalStatus,
      new Date()
    );
    
    expect(success).toBe(true);
    
    // التحقق من التحديث
    const updatedReading = await db.getReadingForPersonAndFriday("محمود أبو تيم", currentFriday.fridayNumber);
    expect(updatedReading).toBeDefined();
    
    if (updatedReading) {
      expect(updatedReading.isCompleted).toBe(!originalStatus);
    }
    
    // إعادة الحالة الأصلية
    await db.updateReadingStatus(
      reading.id,
      reading.personPosition,
      originalStatus,
      originalStatus ? new Date() : null
    );
  });
});
