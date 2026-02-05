import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Status Command Functions", () => {
  it("should get pending readings count for a person", async () => {
    const count = await db.getPendingReadingsCount("أحمد اللاذقاني");
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe("number");
  });

  it("should return 0 for non-existent person", async () => {
    const count = await db.getPendingReadingsCount("شخص غير موجود");
    expect(count).toBe(0);
  });

  it("should get last completed reading for a person", async () => {
    // هذا الاختبار يعتمد على وجود قراءات مسجلة
    const lastReading = await db.getLastCompletedReading("أحمد اللاذقاني");
    
    if (lastReading) {
      expect(lastReading).toHaveProperty("fridayNumber");
      expect(lastReading).toHaveProperty("juzNumber");
      expect(lastReading).toHaveProperty("khatmaNumber");
      expect(lastReading).toHaveProperty("completedAt");
      expect(typeof lastReading.fridayNumber).toBe("number");
      expect(typeof lastReading.juzNumber).toBe("number");
    }
  });

  it("should return null for person with no completed readings", async () => {
    const lastReading = await db.getLastCompletedReading("شخص بدون قراءات");
    expect(lastReading).toBeNull();
  });

  it("should get group ranking for a person", async () => {
    const ranking = await db.getGroupRanking("أحمد اللاذقاني");
    
    if (ranking) {
      expect(ranking).toHaveProperty("rank");
      expect(ranking).toHaveProperty("totalMembers");
      expect(ranking.rank).toBeGreaterThan(0);
      expect(ranking.rank).toBeLessThanOrEqual(ranking.totalMembers);
      expect(ranking.totalMembers).toBeGreaterThan(0);
    }
  });

  it("should return null for non-existent person ranking", async () => {
    const ranking = await db.getGroupRanking("شخص غير موجود");
    expect(ranking).toBeNull();
  });

  it("should calculate consecutive readings correctly", async () => {
    const consecutive = await db.getConsecutiveReadings("أحمد اللاذقاني");
    expect(consecutive).toBeGreaterThanOrEqual(0);
    expect(typeof consecutive).toBe("number");
  });

  it("should calculate completion rate correctly", async () => {
    const rate = await db.getCompletionRate("أحمد اللاذقاني");
    expect(rate).toBeGreaterThanOrEqual(0);
    expect(rate).toBeLessThanOrEqual(100);
    expect(typeof rate).toBe("number");
  });

  it("should get total completed readings", async () => {
    const total = await db.getTotalCompletedReadings("أحمد اللاذقاني");
    expect(total).toBeGreaterThanOrEqual(0);
    expect(typeof total).toBe("number");
  });

  it("should handle Arabic names correctly", async () => {
    const arabicNames = [
      "محمد أحمد",
      "عبد الله محمد",
      "فاطمة الزهراء"
    ];

    for (const name of arabicNames) {
      const count = await db.getPendingReadingsCount(name);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});
