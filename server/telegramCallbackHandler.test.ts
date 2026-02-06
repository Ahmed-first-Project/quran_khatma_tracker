import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db.js";

// Mock sendTelegramMessage
vi.mock("./telegram", () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue(undefined),
  answerCallbackQuery: vi.fn().mockResolvedValue(undefined)
}));

describe("Telegram Callback Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("handleCallbackQuery", () => {
    it("should handle main_menu callback for unlinked account", async () => {
      // Mock person doesn't exist
      vi.spyOn(db, "getPersonByChatId").mockResolvedValue(null);
      
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "main_menu", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("مرحباً");
    });

    it("should handle main_menu callback for linked account", async () => {
      // Mock person exists
      vi.spyOn(db, "getPersonByChatId").mockResolvedValue({
        id: 1,
        name: "أحمد محمد",
        telegramChatId: "123456",
        telegramUsername: "ahmad",
        groupNumber: 1
      });
      
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "main_menu", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("القائمة الرئيسية");
    });

    it("should handle help callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "help", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("كيفية استخدام البوت");
    });

    it("should handle open_quran callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      // Mock person doesn't exist
      vi.spyOn(db, "getPersonByChatId").mockResolvedValue(null);
      
      await handleCallbackQuery("callback123", "123456", "open_quran", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
    });

    it("should handle dua callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "dua", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("دعاء ختم القرآن");
    });

    it("should handle tips callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "tips", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("نصائح");
    });

    it("should handle mark_done for unlinked account", async () => {
      // Mock person doesn't exist
      vi.spyOn(db, "getPersonByChatId").mockResolvedValue(null);

      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "mark_done", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[1]).toContain("لم يتم ربط حسابك");
    });

    it("should handle my_status for unlinked account", async () => {
      // Mock person doesn't exist
      vi.spyOn(db, "getPersonByChatId").mockResolvedValue(null);

      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "my_status", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[1]).toContain("لم يتم ربط حسابك");
    });

    it("should handle about callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "about", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("عن برنامج");
    });

    it("should handle start_journey callback", async () => {
      const { handleCallbackQuery } = await import("./telegramCallbackHandler");
      const { sendTelegramMessage } = await import("./telegram");
      
      await handleCallbackQuery("callback123", "123456", "start_journey", "أحمد");
      
      expect(sendTelegramMessage).toHaveBeenCalled();
      const callArgs = vi.mocked(sendTelegramMessage).mock.calls[0];
      expect(callArgs[0]).toBe("123456");
      expect(callArgs[1]).toContain("مرحباً بك");
    });
  });
});
