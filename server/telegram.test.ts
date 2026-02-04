import { describe, expect, it } from "vitest";
import { verifyBotToken } from "./telegram";

describe("Telegram Bot Integration", () => {
  it("should verify bot token is valid", async () => {
    const result = await verifyBotToken();

    expect(result.valid).toBe(true);
    expect(result.botInfo).toBeDefined();
    
    if (result.botInfo) {
      expect(result.botInfo.username).toBeDefined();
      expect(result.botInfo.is_bot).toBe(true);
      
      console.log(`✅ Bot verified: @${result.botInfo.username}`);
    }
  }, 10000); // 10 seconds timeout for API call
});
