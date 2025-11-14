/**
 * Monitor Router
 * Handles monitoring execution and logs
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { MonitorOrchestrator } from "~/server/services/monitor/monitor-orchestrator";

export const monitorRouter = createTRPCRouter({
  // Run monitoring for a single website
  runSingle: publicProcedure
    .input(z.object({ websiteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const orchestrator = new MonitorOrchestrator(ctx.db);
      const result = await orchestrator.monitorWebsite(input.websiteId);
      return result;
    }),

  // Run monitoring for all active websites
  runAll: publicProcedure.mutation(async ({ ctx }) => {
    const orchestrator = new MonitorOrchestrator(ctx.db);
    const results = await orchestrator.monitorAllWebsites();
    return {
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        totalNewFindings: results.reduce((sum, r) => sum + r.newCount, 0),
      },
    };
  }),

  // Get monitoring logs
  getLogs: publicProcedure
    .input(
      z.object({
        websiteId: z.string().optional(),
        status: z.enum(["SUCCESS", "FAILED", "PARTIAL"]).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { websiteId, status, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      const where: any = {};
      if (websiteId) where.websiteId = websiteId;
      if (status) where.status = status;

      const [logs, total] = await Promise.all([
        ctx.db.monitorLog.findMany({
          where,
          skip,
          take: pageSize,
          orderBy: { executedAt: "desc" },
          include: {
            website: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        ctx.db.monitorLog.count({ where }),
      ]);

      return {
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  // Get recent monitoring status
  getRecentStatus: publicProcedure.query(async ({ ctx }) => {
    const recentLogs = await ctx.db.monitorLog.findMany({
      take: 10,
      orderBy: { executedAt: "desc" },
      include: {
        website: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const [successCount, failedCount, totalNewFindings] = await Promise.all([
      ctx.db.monitorLog.count({
        where: {
          status: "SUCCESS",
          executedAt: { gte: last24Hours },
        },
      }),
      ctx.db.monitorLog.count({
        where: {
          status: "FAILED",
          executedAt: { gte: last24Hours },
        },
      }),
      ctx.db.monitorLog.aggregate({
        where: { executedAt: { gte: last24Hours } },
        _sum: { newCount: true },
      }),
    ]);

    return {
      recentLogs,
      last24Hours: {
        successCount,
        failedCount,
        totalNewFindings: totalNewFindings._sum.newCount || 0,
      },
    };
  }),
});
