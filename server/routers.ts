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
  }),

  // الإحصائيات
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
