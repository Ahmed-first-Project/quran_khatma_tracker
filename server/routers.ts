import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // الجمعات
  fridays: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllFridays();
    }),
    
    getByNumber: publicProcedure
      .input(z.object({ fridayNumber: z.number() }))
      .query(async ({ input }) => {
        return await db.getFridayByNumber(input.fridayNumber);
      }),
  }),

  // القراءات
  readings: router({
    getAll: publicProcedure.query(async () => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      const { readings } = await import("../drizzle/schema");
      return await db_instance.select().from(readings);
    }),
    
    getByFriday: publicProcedure
      .input(z.object({ fridayNumber: z.number() }))
      .query(async ({ input }) => {
        return await db.getReadingsByFriday(input.fridayNumber);
      }),
    
    getByPerson: publicProcedure
      .input(z.object({ personName: z.string() }))
      .query(async ({ input }) => {
        return await db.getReadingsByPerson(input.personName);
      }),
    
    search: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchReadingsByName(input.searchTerm);
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        readingId: z.number(),
        personNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        status: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        const date = input.status ? new Date() : null;
        const success = await db.updateReadingStatus(
          input.readingId,
          input.personNumber,
          input.status,
          date
        );
        return { success };
      }),
    
    getByPersonName: publicProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return await db.getReadingsByPerson(input.name);
      }),
    
    markComplete: publicProcedure
      .input(z.object({
        readingId: z.number(),
        position: z.number(),
      }))
      .mutation(async ({ input }) => {
        const success = await db.updateReadingStatus(
          input.readingId,
          input.position as 1 | 2 | 3,
          true,
          new Date()
        );
        return { success };
      }),
  }),

  // الأشخاص
  persons: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllPersons();
    }),
    
    updateName: publicProcedure
      .input(z.object({
        personId: z.number(),
        newName: z.string().min(1, "يجب إدخال اسم صحيح"),
      }))
      .mutation(async ({ input }) => {
        return await db.updatePersonName(input.personId, input.newName);
      }),
    
    bulkUpdate: publicProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number(),
          name: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        return await db.bulkUpdatePersonNames(input.updates);
      }),
    
    addPerson: publicProcedure
      .input(z.object({
        name: z.string().min(1, "يجب إدخال اسم صحيح"),
        groupNumber: z.number().min(1).max(60),
      }))
      .mutation(async ({ input }) => {
        return await db.addPerson(input.name, input.groupNumber);
      }),
    
    deletePerson: publicProcedure
      .input(z.object({
        personId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.deletePerson(input.personId);
      }),
  }),

  // الإحصائيات
  telegram: router({
    linkAccount: publicProcedure
      .input(z.object({
        personName: z.string(),
        chatId: z.string(),
        username: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.linkTelegramAccount(
          input.personName,
          input.chatId,
          input.username
        );
      }),
    
    getPersonByChatId: publicProcedure
      .input(z.object({ chatId: z.string() }))
      .query(async ({ input }) => {
        return await db.getPersonByChatId(input.chatId);
      }),
    
    getAllAdmins: publicProcedure.query(async () => {
      return await db.getAllAdmins();
    }),
    
    setAdmin: publicProcedure
      .input(z.object({
        personId: z.number(),
        isAdmin: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        return await db.setPersonAsAdmin(input.personId, input.isAdmin);
      }),
  }),

  notifications: router({
    sendToAll: publicProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input }) => {
        const { sendCustomMessageToAll } = await import("./notifications");
        return await sendCustomMessageToAll(input.message);
      }),
    
    sendToAdmins: publicProcedure
      .input(z.object({ message: z.string() }))
      .mutation(async ({ input }) => {
        const { sendCustomMessageToAdmins } = await import("./notifications");
        return await sendCustomMessageToAdmins(input.message);
      }),
    
    sendDailyReport: publicProcedure
      .mutation(async () => {
        const { sendDailyReportToAdmins } = await import("./notifications");
        await sendDailyReportToAdmins();
        return { success: true };
      }),
    
    sendWeeklyReminder: publicProcedure
      .input(z.object({ fridayNumber: z.number() }))
      .mutation(async ({ input }) => {
        const { sendWeeklyReminder } = await import("./notifications");
        await sendWeeklyReminder(input.fridayNumber);
        return { success: true };
      }),
  }),
  
  stats: router({
    getFridayStats: publicProcedure
      .input(z.object({ fridayNumber: z.number() }))
      .query(async ({ input }) => {
        return await db.getFridayStats(input.fridayNumber);
      }),
    
    getAllFridaysStats: publicProcedure.query(async () => {
      return await db.getAllFridaysStats();
    }),
    
    getTopReaders: publicProcedure
      .input(z.object({ limit: z.number().optional().default(10) }))
      .query(async ({ input }) => {
        return await db.getTopReaders(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
