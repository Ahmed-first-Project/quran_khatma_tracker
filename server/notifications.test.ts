import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";

describe("Telegram Notifications System", () => {
  beforeAll(async () => {
    // التأكد من وجود قاعدة البيانات
    const database = await db.getDb();
    expect(database).toBeDefined();
  });

  it("should have telegram bot token configured", () => {
    expect(process.env.TELEGRAM_BOT_TOKEN).toBeDefined();
    expect(process.env.TELEGRAM_BOT_TOKEN).not.toBe("");
  });

  it("should get linked persons", async () => {
    const linkedPersons = await db.getAllLinkedPersons();
    expect(Array.isArray(linkedPersons)).toBe(true);
    // يجب أن يكون هناك على الأقل شخص واحد مرتبط (أحمد اللاذقاني)
    expect(linkedPersons.length).toBeGreaterThanOrEqual(1);
    
    // التحقق من أن كل شخص لديه telegramChatId
    linkedPersons.forEach((person) => {
      expect(person.telegramChatId).toBeDefined();
      expect(person.telegramChatId).not.toBeNull();
    });
  });

  it("should get linked admins", async () => {
    const admins = await db.getLinkedAdmins();
    expect(Array.isArray(admins)).toBe(true);
    
    // التحقق من أن كل مشرف لديه telegramChatId
    admins.forEach((admin) => {
      expect(admin.isAdmin).toBe(true);
      expect(admin.telegramChatId).toBeDefined();
    });
  });

  it("should get person by chat id", async () => {
    const linkedPersons = await db.getAllLinkedPersons();
    
    if (linkedPersons.length > 0) {
      const firstPerson = linkedPersons[0];
      const chatId = firstPerson.telegramChatId!;
      
      const person = await db.getPersonByChatId(chatId);
      expect(person).toBeDefined();
      expect(person?.telegramChatId).toBe(chatId);
    }
  });

  it("should get reading by id", async () => {
    const reading = await db.getReadingById(1);
    expect(reading).toBeDefined();
    expect(reading?.id).toBe(1);
  });

  it("should get person by id", async () => {
    const person = await db.getPersonById(1);
    expect(person).toBeDefined();
    expect(person?.id).toBe(1);
  });

  it("should get readings by date", async () => {
    const today = new Date();
    const readings = await db.getReadingsByDate(today);
    expect(Array.isArray(readings)).toBe(true);
  });
});
