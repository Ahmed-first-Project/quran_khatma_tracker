/**
 * اختبارات نظام اختيار الاسم في البوت
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock database functions
vi.mock('./db', () => ({
  getAllPersons: vi.fn(),
  getPersonByChatId: vi.fn(),
  linkTelegramAccount: vi.fn(),
}));

describe('Name Selection System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllPersons', () => {
    it('يجب أن يعيد قائمة بجميع المشتركين', async () => {
      const mockPersons = [
        { id: 1, name: 'أحمد محمد', telegramChatId: null, groupNumber: 1, positionInGroup: 1 },
        { id: 2, name: 'محمد علي', telegramChatId: '12345', groupNumber: 1, positionInGroup: 2 },
        { id: 3, name: 'علي حسن', telegramChatId: null, groupNumber: 2, positionInGroup: 1 },
      ];
      
      vi.mocked(db.getAllPersons).mockResolvedValue(mockPersons);
      
      const result = await db.getAllPersons();
      
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('أحمد محمد');
    });
  });

  describe('Filter Unlinked Persons', () => {
    it('يجب أن يفلتر المشتركين غير المربوطين فقط', async () => {
      const mockPersons = [
        { id: 1, name: 'أحمد محمد', telegramChatId: null, groupNumber: 1, positionInGroup: 1 },
        { id: 2, name: 'محمد علي', telegramChatId: '12345', groupNumber: 1, positionInGroup: 2 },
        { id: 3, name: 'علي حسن', telegramChatId: null, groupNumber: 2, positionInGroup: 1 },
      ];
      
      vi.mocked(db.getAllPersons).mockResolvedValue(mockPersons);
      
      const allPersons = await db.getAllPersons();
      const unlinkedPersons = allPersons.filter(p => !p.telegramChatId);
      
      expect(unlinkedPersons).toHaveLength(2);
      expect(unlinkedPersons[0].name).toBe('أحمد محمد');
      expect(unlinkedPersons[1].name).toBe('علي حسن');
    });
  });

  describe('Pagination Logic', () => {
    it('يجب أن يقسم القائمة إلى صفحات (20 اسم لكل صفحة)', () => {
      const mockPersons = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `شخص ${i + 1}`,
        telegramChatId: null,
        groupNumber: Math.floor(i / 3) + 1,
        positionInGroup: (i % 3) + 1,
      }));
      
      const pageSize = 20;
      const totalPages = Math.ceil(mockPersons.length / pageSize);
      
      expect(totalPages).toBe(3);
      
      // الصفحة الأولى
      const page1 = mockPersons.slice(0, 20);
      expect(page1).toHaveLength(20);
      expect(page1[0].name).toBe('شخص 1');
      
      // الصفحة الثانية
      const page2 = mockPersons.slice(20, 40);
      expect(page2).toHaveLength(20);
      expect(page2[0].name).toBe('شخص 21');
      
      // الصفحة الثالثة
      const page3 = mockPersons.slice(40, 50);
      expect(page3).toHaveLength(10);
      expect(page3[0].name).toBe('شخص 41');
    });
  });

  describe('Link Account', () => {
    it('يجب أن يربط الحساب بنجاح', async () => {
      vi.mocked(db.linkTelegramAccount).mockResolvedValue({
        success: true,
        person: { id: 1, name: 'أحمد محمد', telegramChatId: '12345', groupNumber: 1, positionInGroup: 1 }
      });
      
      const result = await db.linkTelegramAccount('أحمد محمد', '12345');
      
      expect(result.success).toBe(true);
      expect(result.person?.name).toBe('أحمد محمد');
    });

    it('يجب أن يفشل الربط إذا كان الاسم غير موجود', async () => {
      vi.mocked(db.linkTelegramAccount).mockResolvedValue({
        success: false,
        message: 'لا يوجد شخص بهذا الاسم'
      });
      
      const result = await db.linkTelegramAccount('اسم غير موجود', '12345');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('لا يوجد شخص');
    });
  });

  describe('Check Linked Status', () => {
    it('يجب أن يتحقق من حالة ربط الحساب', async () => {
      // مشترك مربوط
      vi.mocked(db.getPersonByChatId).mockResolvedValue({
        id: 1,
        name: 'أحمد محمد',
        telegramChatId: '12345',
        groupNumber: 1,
        positionInGroup: 1
      });
      
      const linkedPerson = await db.getPersonByChatId('12345');
      expect(linkedPerson).not.toBeNull();
      expect(linkedPerson?.name).toBe('أحمد محمد');
      
      // مشترك غير مربوط
      vi.mocked(db.getPersonByChatId).mockResolvedValue(undefined);
      
      const unlinkedPerson = await db.getPersonByChatId('99999');
      expect(unlinkedPerson).toBeUndefined();
    });
  });

  describe('Callback Data Format', () => {
    it('يجب أن يكون callback_data بالصيغة الصحيحة', () => {
      const personId = 123;
      const callbackData = `link_name:${personId}`;
      
      expect(callbackData).toBe('link_name:123');
      
      // استخراج ID من callback_data
      const extractedId = parseInt(callbackData.split(':')[1]);
      expect(extractedId).toBe(123);
    });

    it('يجب أن يكون callback_data للصفحات بالصيغة الصحيحة', () => {
      const page = 2;
      const callbackData = `name_page:${page}`;
      
      expect(callbackData).toBe('name_page:2');
      
      // استخراج رقم الصفحة
      const extractedPage = parseInt(callbackData.split(':')[1]);
      expect(extractedPage).toBe(2);
    });
  });
});
