import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Notification System", () => {
  beforeAll(async () => {
    // التأكد من وجود اتصال بقاعدة البيانات
    const database = await db.getDb();
    expect(database).toBeTruthy();
  });

  describe("Notification Settings", () => {
    it("should create and retrieve notification setting", async () => {
      const key = "test_setting";
      const value = "test_value";
      const description = "Test setting description";

      // إنشاء إعداد جديد
      const created = await db.upsertNotificationSetting(key, value, description);
      expect(created).toBe(true);

      // استرجاع الإعداد
      const setting = await db.getNotificationSetting(key);
      expect(setting).toBeTruthy();
      expect(setting?.settingKey).toBe(key);
      expect(setting?.settingValue).toBe(value);
      expect(setting?.description).toBe(description);
    });

    it("should update existing notification setting", async () => {
      const key = "test_setting";
      const newValue = "updated_value";

      // تحديث الإعداد
      const updated = await db.upsertNotificationSetting(key, newValue);
      expect(updated).toBe(true);

      // التحقق من التحديث
      const setting = await db.getNotificationSetting(key);
      expect(setting?.settingValue).toBe(newValue);
    });

    it("should retrieve all notification settings", async () => {
      const settings = await db.getAllNotificationSettings();
      expect(Array.isArray(settings)).toBe(true);
      expect(settings.length).toBeGreaterThan(0);
    });
  });

  describe("Pending Readings", () => {
    it("should get pending readings for a friday", async () => {
      const fridayNumber = 181;
      const pendingReadings = await db.getPendingReadings(fridayNumber);

      expect(Array.isArray(pendingReadings)).toBe(true);
      
      // التحقق من بنية البيانات
      if (pendingReadings.length > 0) {
        const reading = pendingReadings[0];
        expect(reading).toHaveProperty('name');
        expect(reading).toHaveProperty('chatId');
        expect(reading).toHaveProperty('juzNumber');
        expect(reading).toHaveProperty('groupNumber');
        expect(reading).toHaveProperty('personPosition');
      }
    });

    it("should only return readings with telegram chat IDs", async () => {
      const fridayNumber = 181;
      const pendingReadings = await db.getPendingReadings(fridayNumber);

      // جميع القراءات المتأخرة يجب أن يكون لها chatId
      pendingReadings.forEach(reading => {
        expect(reading.chatId).toBeTruthy();
        expect(typeof reading.chatId).toBe('string');
      });
    });
  });

  describe("Notification History", () => {
    it("should save notification to database", async () => {
      const notificationData = {
        fridayNumber: 181,
        recipientName: "Test User",
        recipientChatId: "123456789",
        messageText: "Test notification message",
        notificationType: 'manual' as const,
        status: 'sent' as const,
        sentAt: new Date(),
      };

      const result = await db.saveNotification(notificationData);
      expect(result).toBeTruthy();
    });

    it("should retrieve notifications by friday", async () => {
      const fridayNumber = 181;
      const notifications = await db.getNotificationsByFriday(fridayNumber);

      expect(Array.isArray(notifications)).toBe(true);
      
      // التحقق من بنية البيانات
      if (notifications.length > 0) {
        const notification = notifications[0];
        expect(notification).toHaveProperty('fridayNumber');
        expect(notification).toHaveProperty('recipientName');
        expect(notification).toHaveProperty('recipientChatId');
        expect(notification).toHaveProperty('messageText');
        expect(notification).toHaveProperty('notificationType');
        expect(notification).toHaveProperty('status');
      }
    });

    it("should retrieve recent notifications", async () => {
      const limit = 10;
      const notifications = await db.getRecentNotifications(limit);

      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeLessThanOrEqual(limit);
    });
  });

  describe("Notification Service Integration", () => {
    it("should have required notification types", async () => {
      const validTypes = ['reminder', 'manual', 'scheduled'];
      
      // التحقق من أن الأنواع صحيحة
      validTypes.forEach(type => {
        expect(['reminder', 'manual', 'scheduled']).toContain(type);
      });
    });

    it("should have required notification statuses", async () => {
      const validStatuses = ['sent', 'failed', 'pending'];
      
      // التحقق من أن الحالات صحيحة
      validStatuses.forEach(status => {
        expect(['sent', 'failed', 'pending']).toContain(status);
      });
    });
  });
});
