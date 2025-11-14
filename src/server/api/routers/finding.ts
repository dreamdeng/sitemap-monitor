/**
 * Finding Router
 * Handles finding queries and operations
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const findingRouter = createTRPCRouter({
  // Get findings with pagination and filters
  getList: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        websiteId: z.string().optional(),
        isRead: z.boolean().optional(),
        searchTerm: z.string().optional(),
        sortBy: z.enum(["foundAt", "title"]).default("foundAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        pageSize,
        websiteId,
        isRead,
        searchTerm,
        sortBy,
        sortOrder,
      } = input;

      const skip = (page - 1) * pageSize;

      // Build where clause
      const where: any = {};

      if (websiteId) {
        where.websiteId = websiteId;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (searchTerm) {
        where.OR = [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { keywords: { contains: searchTerm, mode: "insensitive" } },
        ];
      }

      const [findings, total] = await Promise.all([
        ctx.db.finding.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { [sortBy]: sortOrder },
          include: {
            website: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        ctx.db.finding.count({ where }),
      ]);

      return {
        findings,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // Get finding by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const finding = await ctx.db.finding.findUnique({
        where: { id: input.id },
        include: {
          website: true,
        },
      });
      return finding;
    }),

  // Mark finding as read/unread
  markAsRead: publicProcedure
    .input(
      z.object({
        id: z.string(),
        isRead: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const finding = await ctx.db.finding.update({
        where: { id: input.id },
        data: { isRead: input.isRead },
      });
      return finding;
    }),

  // Batch mark as read
  batchMarkAsRead: publicProcedure
    .input(
      z.object({
        ids: z.array(z.string()),
        isRead: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.finding.updateMany({
        where: { id: { in: input.ids } },
        data: { isRead: input.isRead },
      });
      return { count: result.count };
    }),

  // Delete finding
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.finding.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),

  // Batch delete findings
  batchDelete: publicProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.finding.deleteMany({
        where: { id: { in: input.ids } },
      });
      return { count: result.count };
    }),

  // Get statistics
  getStats: publicProcedure
    .input(
      z.object({
        websiteId: z.string().optional(),
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const where: any = {
        foundAt: { gte: startDate },
      };

      if (input.websiteId) {
        where.websiteId = input.websiteId;
      }

      const [total, unread, recentCount] = await Promise.all([
        ctx.db.finding.count({ where: input.websiteId ? { websiteId: input.websiteId } : undefined }),
        ctx.db.finding.count({
          where: {
            isRead: false,
            ...(input.websiteId ? { websiteId: input.websiteId } : {}),
          },
        }),
        ctx.db.finding.count({ where }),
      ]);

      return {
        total,
        unread,
        recentCount,
        days: input.days,
      };
    }),
});
