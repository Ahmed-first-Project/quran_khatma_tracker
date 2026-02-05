import { describe, it, expect } from "vitest";
import { getMotivationalMessage, getShortMotivationalMessage, MotivationalContext } from "./motivationalMessages";

describe("Motivational Messages System", () => {
  it("should return a message for first reading", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 1,
      totalCompleted: 1,
      completionRate: 3,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 181,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message.length).toBeGreaterThan(0);
  });

  it("should return special message for first in group", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 1,
      totalCompleted: 1,
      completionRate: 3,
      isFirstInGroup: true,
      isFirstOverall: false,
      weekNumber: 181,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("مجموعت");
  });

  it("should return special message for first overall", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 1,
      totalCompleted: 1,
      completionRate: 3,
      isFirstInGroup: false,
      isFirstOverall: true,
      weekNumber: 181,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("الجمعة");
  });

  it("should return message for 3 consecutive readings", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 3,
      totalCompleted: 3,
      completionRate: 10,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 183,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("ثلاث");
  });

  it("should return message for 5 consecutive readings", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 5,
      totalCompleted: 5,
      completionRate: 16,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 185,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("خمس");
  });

  it("should return message for 10 consecutive readings", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 10,
      totalCompleted: 10,
      completionRate: 33,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 190,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("عشر");
  });

  it("should return message for 30 consecutive readings (full khatma)", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 30,
      totalCompleted: 30,
      completionRate: 100,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 210,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("ختمة");
  });

  it("should return message for 25% completion rate", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 2,
      totalCompleted: 8,
      completionRate: 25,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 188,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
  });

  it("should return message for 50% completion rate", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 2,
      totalCompleted: 15,
      completionRate: 50,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 195,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("نصف");
  });

  it("should return message for 100% completion rate", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 30,
      totalCompleted: 30,
      completionRate: 100,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 210,
    };

    const message = getMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message).toContain("ختمة");
  });

  it("should return short message", () => {
    const context: MotivationalContext = {
      consecutiveReadings: 1,
      totalCompleted: 1,
      completionRate: 3,
      isFirstInGroup: false,
      isFirstOverall: false,
      weekNumber: 181,
    };

    const message = getShortMotivationalMessage(context);
    expect(message).toBeTruthy();
    expect(message.length).toBeGreaterThan(0);
    expect(message.split("\n").length).toBeLessThanOrEqual(1);
  });
});
