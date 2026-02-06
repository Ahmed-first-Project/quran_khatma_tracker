import { describe, it, expect } from "vitest";
import { 
  getMainMenuKeyboard, 
  getStartKeyboard, 
  getHelpKeyboard 
} from "./telegramKeyboards";

describe("Telegram Keyboards", () => {
  describe("getMainMenuKeyboard", () => {
    it("should return inline keyboard with all main menu buttons", () => {
      const keyboard = getMainMenuKeyboard();
      
      expect(keyboard).toHaveProperty("inline_keyboard");
      expect(keyboard.inline_keyboard).toBeInstanceOf(Array);
      expect(keyboard.inline_keyboard.length).toBeGreaterThan(0);
      
      // التحقق من وجود الأزرار الرئيسية
      const allButtons = keyboard.inline_keyboard.flat();
      const buttonTexts = allButtons.map(btn => btn.text);
      
      expect(buttonTexts).toContain("✅ سجّل قراءتك");
      expect(buttonTexts).toContain("📊 إحصائياتي");
      expect(buttonTexts).toContain("📖 افتح المصحف");
      expect(buttonTexts).toContain("❓ المساعدة");
    });

    it("should have callback_data for each button", () => {
      const keyboard = getMainMenuKeyboard();
      const allButtons = keyboard.inline_keyboard.flat();
      
      allButtons.forEach(button => {
        expect(button).toHaveProperty("callback_data");
        expect(button.callback_data).toBeTruthy();
      });
    });
  });

  describe("getStartKeyboard", () => {
    it("should return inline keyboard with start button", () => {
      const keyboard = getStartKeyboard();
      
      expect(keyboard).toHaveProperty("inline_keyboard");
      expect(keyboard.inline_keyboard).toBeInstanceOf(Array);
      
      const allButtons = keyboard.inline_keyboard.flat();
      expect(allButtons.length).toBeGreaterThan(0);
      
      // التحقق من وجود زر "ابدأ الآن"
      const buttonTexts = allButtons.map(btn => btn.text);
      expect(buttonTexts).toContain("🕌 ابدأ الآن");
    });
  });

  describe("getHelpKeyboard", () => {
    it("should return inline keyboard with help-related buttons", () => {
      const keyboard = getHelpKeyboard();
      
      expect(keyboard).toHaveProperty("inline_keyboard");
      expect(keyboard.inline_keyboard).toBeInstanceOf(Array);
      
      const allButtons = keyboard.inline_keyboard.flat();
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Keyboard Structure", () => {
    it("all keyboards should follow Telegram inline keyboard format", () => {
      const keyboards = [
        getMainMenuKeyboard(),
        getStartKeyboard(),
        getHelpKeyboard()
      ];

      keyboards.forEach(keyboard => {
        expect(keyboard).toHaveProperty("inline_keyboard");
        expect(Array.isArray(keyboard.inline_keyboard)).toBe(true);
        
        keyboard.inline_keyboard.forEach(row => {
          expect(Array.isArray(row)).toBe(true);
          row.forEach(button => {
            expect(button).toHaveProperty("text");
            expect(typeof button.text).toBe("string");
            // يجب أن يحتوي الزر على callback_data أو url
            expect(
              button.hasOwnProperty("callback_data") || 
              button.hasOwnProperty("url")
            ).toBe(true);
          });
        });
      });
    });
  });
});
