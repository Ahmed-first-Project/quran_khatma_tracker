import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMockContext(): TrpcContext {
  return {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Quran Khatma Tracker - Readings API", () => {
  it("should fetch all fridays", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const fridays = await caller.fridays.getAll();

    expect(fridays).toBeDefined();
    expect(Array.isArray(fridays)).toBe(true);
    expect(fridays.length).toBeGreaterThan(0);
    
    // التحقق من أن الجمعة الأولى هي 181
    const firstFriday = fridays[0];
    expect(firstFriday?.fridayNumber).toBe(181);
  });

  it("should fetch readings for a specific friday", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const readings = await caller.readings.getByFriday({ fridayNumber: 181 });

    expect(readings).toBeDefined();
    expect(Array.isArray(readings)).toBe(true);
    
    // يجب أن يكون هناك 60 قراءة (30 مجموعة × 2 ختمة)
    expect(readings.length).toBe(60);
    
    // التحقق من بنية القراءة الأولى
    const firstReading = readings[0];
    expect(firstReading).toHaveProperty("fridayNumber");
    expect(firstReading).toHaveProperty("juzNumber");
    expect(firstReading).toHaveProperty("khatmaNumber");
    expect(firstReading).toHaveProperty("groupNumber");
    expect(firstReading).toHaveProperty("person1Name");
    expect(firstReading).toHaveProperty("person1Status");
    expect(firstReading).toHaveProperty("person2Name");
    expect(firstReading).toHaveProperty("person3Name");
  });

  it("should get friday stats correctly", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.stats.getFridayStats({ fridayNumber: 181 });

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty("fridayNumber");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("percentage");
    expect(stats).toHaveProperty("status");
    
    // التحقق من أن الإجمالي = 180 (60 قراءة × 3 أشخاص)
    expect(stats?.total).toBe(180);
    
    // التحقق من أن المكتمل + المنتظر = الإجمالي
    if (stats) {
      expect(stats.completed + stats.pending).toBe(stats.total);
    }
  });

  it("should get all fridays stats", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const allStats = await caller.stats.getAllFridaysStats();

    expect(allStats).toBeDefined();
    expect(Array.isArray(allStats)).toBe(true);
    
    // يجب أن يكون هناك 30 جمعة
    expect(allStats.length).toBe(30);
    
    // التحقق من أن كل جمعة لها إحصائيات صحيحة
    allStats.forEach((stat) => {
      expect(stat).toHaveProperty("fridayNumber");
      expect(stat).toHaveProperty("completed");
      expect(stat).toHaveProperty("pending");
      expect(stat).toHaveProperty("total");
      expect(stat).toHaveProperty("percentage");
      expect(stat).toHaveProperty("status");
      expect(stat.total).toBe(180);
    });
  });

  it("should get top readers", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const topReaders = await caller.stats.getTopReaders({ limit: 10 });

    expect(topReaders).toBeDefined();
    expect(Array.isArray(topReaders)).toBe(true);
    expect(topReaders.length).toBeLessThanOrEqual(10);
    
    // التحقق من بنية القارئ
    if (topReaders.length > 0) {
      const firstReader = topReaders[0];
      expect(firstReader).toHaveProperty("name");
      expect(firstReader).toHaveProperty("completed");
      expect(firstReader).toHaveProperty("total");
      expect(firstReader).toHaveProperty("percentage");
      
      // التحقق من أن النسبة المئوية محسوبة بشكل صحيح
      const expectedPercentage = firstReader.total > 0 
        ? Math.round((firstReader.completed / firstReader.total) * 100) 
        : 0;
      expect(firstReader.percentage).toBe(expectedPercentage);
    }
  });

  it("should search readings by person name", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // البحث عن "شخص 1-1"
    const searchResults = await caller.readings.search({ searchTerm: "شخص 1-1" });

    expect(searchResults).toBeDefined();
    expect(Array.isArray(searchResults)).toBe(true);
    
    // يجب أن يكون هناك نتائج تحتوي على "شخص 1-1"
    if (searchResults.length > 0) {
      const hasMatchingName = searchResults.some(
        (r) =>
          r.person1Name.includes("شخص 1-1") ||
          r.person2Name.includes("شخص 1-1") ||
          r.person3Name.includes("شخص 1-1")
      );
      expect(hasMatchingName).toBe(true);
    }
  });

  it("should update reading status", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // الحصول على قراءة للاختبار
    const readings = await caller.readings.getByFriday({ fridayNumber: 181 });
    const testReading = readings[0];

    if (testReading) {
      // تحديث حالة الشخص الأول
      const result = await caller.readings.updateStatus({
        readingId: testReading.id,
        personNumber: 1,
        status: true,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // التحقق من التحديث
      const updatedReadings = await caller.readings.getByFriday({ fridayNumber: 181 });
      const updatedReading = updatedReadings.find((r) => r.id === testReading.id);

      expect(updatedReading?.person1Status).toBe(true);
      expect(updatedReading?.person1Date).toBeDefined();

      // إعادة الحالة إلى false
      await caller.readings.updateStatus({
        readingId: testReading.id,
        personNumber: 1,
        status: false,
      });
    }
  });
});
