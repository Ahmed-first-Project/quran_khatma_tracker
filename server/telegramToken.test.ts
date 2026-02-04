import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("Telegram Bot Token Validation", () => {
  it("should have TELEGRAM_BOT_TOKEN in environment", () => {
    expect(ENV.telegramBotToken).toBeDefined();
    expect(ENV.telegramBotToken).not.toBe("");
  });

  it("should validate token format", () => {
    const token = ENV.telegramBotToken;
    // Token format: {bot_id}:{token_hash}
    expect(token).toMatch(/^\d+:[A-Za-z0-9_-]+$/);
  });

  it("should be able to call Telegram API with the token", async () => {
    const token = ENV.telegramBotToken;
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(data.result).toBeDefined();
    expect(data.result.is_bot).toBe(true);
    
    console.log("✅ Bot info:", data.result);
  }, 10000); // 10 seconds timeout
});
