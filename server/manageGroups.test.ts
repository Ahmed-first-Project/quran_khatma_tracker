import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { getDb } from "./db";
import { persons, readings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Manage Groups - Add Person", () => {
  it("should add a new person successfully", async () => {
    const result = await db.addPerson("شخص تجريبي جديد", 1);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain("تمت إضافة المشارك بنجاح");
    expect(result.personId).toBeDefined();
  });

  it("should add person with personId", async () => {
    const personName = "شخص تجريبي للمجموعة 5";
    const groupNumber = 5;
    
    const result = await db.addPerson(personName, groupNumber);
    expect(result.success).toBe(true);
    expect(result.personId).toBeDefined();
    expect(typeof result.personId).toBe("number");
  });
});

describe("Manage Groups - Delete Person", () => {
  it("should delete a person successfully", async () => {
    // إضافة شخص للحذف
    const addResult = await db.addPerson("شخص للحذف", 10);
    expect(addResult.success).toBe(true);
    
    const personId = addResult.personId!;
    
    // حذف الشخص
    const deleteResult = await db.deletePerson(personId);
    expect(deleteResult.success).toBe(true);
    expect(deleteResult.message).toBe("تم حذف المشارك بنجاح");
  });

  it("should delete person from persons table", async () => {
    // إضافة شخص
    const addResult = await db.addPerson("شخص للحذف من الجدول", 15);
    expect(addResult.success).toBe(true);
    
    const personId = addResult.personId!;
    
    // حذف الشخص
    const deleteResult = await db.deletePerson(personId);
    expect(deleteResult.success).toBe(true);
    
    // التحقق من حذف الشخص من الجدول
    const person = await db.getPersonById(personId);
    expect(person).toBeUndefined();
  });

  it("should return error when deleting non-existent person", async () => {
    const result = await db.deletePerson(999999);
    expect(result.success).toBe(false);
    expect(result.message).toBe("الشخص غير موجود");
  });
});

describe("Manage Groups - Update Person Name", () => {
  it("should update person name successfully", async () => {
    // إضافة شخص
    const addResult = await db.addPerson("اسم قديم", 20);
    expect(addResult.success).toBe(true);
    
    const personId = addResult.personId!;
    
    // تحديث الاسم
    const updateResult = await db.updatePersonName(personId, "اسم جديد");
    expect(updateResult.success).toBe(true);
    expect(updateResult.message).toBe("تم تحديث الاسم بنجاح");
  });

  it("should update person name and reflect in database", async () => {
    // استخدام شخص موجود في القراءات
    const allPersons = await db.getAllPersons();
    expect(allPersons.length).toBeGreaterThan(0);
    
    // أخذ أول شخص للاختبار
    const testPerson = allPersons[0];
    const oldName = testPerson.name;
    const newName = oldName + " - محدث";
    
    // التحقق من وجود قراءات بالاسم القديم
    const oldReadings = await db.getReadingsByPerson(oldName);
    const oldReadingsCount = oldReadings.length;
    
    // تحديث الاسم
    const updateResult = await db.updatePersonName(testPerson.id, newName);
    expect(updateResult.success).toBe(true);
    
    // التحقق من تحديث القراءات
    const newReadings = await db.getReadingsByPerson(newName);
    expect(newReadings.length).toBe(oldReadingsCount);
    
    // إعادة الاسم القديم للحفاظ على البيانات
    await db.updatePersonName(testPerson.id, oldName);
  });
});

describe("Manage Groups - Get All Persons", () => {
  it("should return all persons", async () => {
    const allPersons = await db.getAllPersons();
    expect(allPersons).toBeDefined();
    expect(Array.isArray(allPersons)).toBe(true);
    expect(allPersons.length).toBeGreaterThan(0);
  });

  it("should return persons with correct structure", async () => {
    const allPersons = await db.getAllPersons();
    
    if (allPersons.length > 0) {
      const person = allPersons[0];
      expect(person).toHaveProperty("id");
      expect(person).toHaveProperty("name");
      expect(person).toHaveProperty("telegramChatId");
      expect(person).toHaveProperty("telegramUsername");
      expect(person).toHaveProperty("isAdmin");
    }
  });
});
