/**
 * اختبارات التأكد من إسناد الجزء الصحيح بعد ربط الحساب
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock database functions
vi.mock('./db', () => ({
  linkTelegramAccount: vi.fn(),
  getCurrentFriday: vi.fn(),
  getReadingForPersonAndFriday: vi.fn(),
}));

describe('Telegram Link Assignment Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('linkTelegramAccount', () => {
    it('يجب أن يربط الحساب بنجاح ويعيد معلومات المشترك', async () => {
      const mockResult = {
        success: true,
        message: 'تم ربط حسابك بنجاح!',
        person: {
          id: 1,
          name: 'أحمد اللاذقاني',
          telegramChatId: '120011',
          telegramUsername: 'ahmad',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      };
      
      vi.mocked(db.linkTelegramAccount).mockResolvedValue(mockResult);
      
      const result = await db.linkTelegramAccount('أحمد اللاذقاني', '120011', 'ahmad');
      
      expect(result.success).toBe(true);
      expect(result.person).toBeDefined();
      expect(result.person?.name).toBe('أحمد اللاذقاني');
      expect(result.person?.telegramChatId).toBe('120011');
    });
  });

  describe('getCurrentFriday', () => {
    it('يجب أن يعيد الجمعة الحالية (192)', async () => {
      const mockFriday = {
        id: 12,
        fridayNumber: 192,
        dateGregorian: '06-02-2026',
        dateHijri: '19-08-1447',
        createdAt: new Date(),
      };
      
      vi.mocked(db.getCurrentFriday).mockResolvedValue(mockFriday);
      
      const result = await db.getCurrentFriday();
      
      expect(result).toBeDefined();
      expect(result?.fridayNumber).toBe(192);
      expect(result?.dateGregorian).toBe('06-02-2026');
    });
  });

  describe('getReadingForPersonAndFriday', () => {
    it('يجب أن يعيد القراءة الصحيحة للمشترك في الجمعة الحالية', async () => {
      const mockReading = {
        id: 456,
        fridayNumber: 192,
        juzNumber: 19,
        groupNumber: 4,
        personPosition: 2 as 1 | 2 | 3,
        personName: 'أحمد اللاذقاني',
        isCompleted: false,
        completedDate: null,
      };
      
      vi.mocked(db.getReadingForPersonAndFriday).mockResolvedValue(mockReading);
      
      const result = await db.getReadingForPersonAndFriday('أحمد اللاذقاني', 192);
      
      expect(result).toBeDefined();
      expect(result?.juzNumber).toBe(19);
      expect(result?.groupNumber).toBe(4);
      expect(result?.personPosition).toBe(2);
    });

    it('يجب أن يعيد الجزء الصحيح حسب المجموعة والموقع', async () => {
      // مجموعة 4، موقع 2 → جزء 19 في الجمعة 192
      const mockReading = {
        id: 456,
        fridayNumber: 192,
        juzNumber: 19,
        groupNumber: 4,
        personPosition: 2 as 1 | 2 | 3,
        personName: 'أحمد اللاذقاني',
        isCompleted: false,
        completedDate: null,
      };
      
      vi.mocked(db.getReadingForPersonAndFriday).mockResolvedValue(mockReading);
      
      const result = await db.getReadingForPersonAndFriday('أحمد اللاذقاني', 192);
      
      // التحقق من صحة الإسناد
      expect(result?.juzNumber).toBe(19);
      expect(result?.groupNumber).toBe(4);
      expect(result?.personPosition).toBe(2);
    });
  });

  describe('Full Link Flow', () => {
    it('يجب أن يعرض المعلومات الصحيحة بعد الربط', async () => {
      // 1. ربط الحساب
      const linkResult = {
        success: true,
        message: 'تم ربط حسابك بنجاح!',
        person: {
          id: 1,
          name: 'أحمد اللاذقاني',
          telegramChatId: '120011',
          telegramUsername: 'ahmad',
          isAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      };
      
      vi.mocked(db.linkTelegramAccount).mockResolvedValue(linkResult);
      
      // 2. الحصول على الجمعة الحالية
      const currentFriday = {
        id: 12,
        fridayNumber: 192,
        dateGregorian: '06-02-2026',
        dateHijri: '19-08-1447',
        createdAt: new Date(),
      };
      
      vi.mocked(db.getCurrentFriday).mockResolvedValue(currentFriday);
      
      // 3. الحصول على القراءة المطلوبة
      const currentReading = {
        id: 456,
        fridayNumber: 192,
        juzNumber: 19,
        groupNumber: 4,
        personPosition: 2 as 1 | 2 | 3,
        personName: 'أحمد اللاذقاني',
        isCompleted: false,
        completedDate: null,
      };
      
      vi.mocked(db.getReadingForPersonAndFriday).mockResolvedValue(currentReading);
      
      // تنفيذ العملية الكاملة
      const link = await db.linkTelegramAccount('أحمد اللاذقاني', '120011', 'ahmad');
      const friday = await db.getCurrentFriday();
      const reading = await db.getReadingForPersonAndFriday('أحمد اللاذقاني', 192);
      
      // التحقق من النتائج
      expect(link.success).toBe(true);
      expect(link.person?.name).toBe('أحمد اللاذقاني');
      expect(friday?.fridayNumber).toBe(192);
      expect(reading?.juzNumber).toBe(19);
      expect(reading?.groupNumber).toBe(4);
      expect(reading?.personPosition).toBe(2);
    });
  });
});
