/**
 * Dashboard Router
 * Provides dashboard statistics and overview data
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  // Get overview statistics
  getOverview: publicProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const [
      totalWebsites,
      activeWebsites,
      totalFindings,
      unreadFindings,
      todayFindings,
      yesterdayFindings,
      weekFindings,
      recentFindings,
      lastMonitorLog,
    ] = await Promise.all([
      ctx.db.website.count(),
      ctx.db.website.count({ where: { status: "ACTIVE" } }),
      ctx.db.finding.count(),
      ctx.db.finding.count({ where: { isRead: false } }),
      ctx.db.finding.count({ where: { foundAt: { gte: today } } }),
      ctx.db.finding.count({
        where: {
          foundAt: { gte: yesterday, lt: today },
        },
      }),
      ctx.db.finding.count({ where: { foundAt: { gte: lastWeek } } }),
      ctx.db.finding.findMany({
        take: 5,
        orderBy: { foundAt: "desc" },
        include: {
          website: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      ctx.db.monitorLog.findFirst({
        orderBy: { executedAt: "desc" },
        include: {
          website: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      websites: {
        total: totalWebsites,
        active: activeWebsites,
        paused: totalWebsites - activeWebsites,
      },
      findings: {
        total: totalFindings,
        unread: unreadFindings,
        today: todayFindings,
        yesterday: yesterdayFindings,
        week: weekFindings,
        recent: recentFindings,
      },
      lastMonitor: lastMonitorLog,
    };
  }),

  // Get trend data for charts
  getTrend: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);
      startDate.setHours(0, 0, 0, 0);

      // Get findings grouped by date
      const findings = await ctx.db.finding.groupBy({
        by: ["foundAt"],
        where: {
          foundAt: { gte: startDate },
        },
        _count: true,
        orderBy: {
          foundAt: "asc",
        },
      });

      // Group by date (YYYY-MM-DD)
      const trendData: Record<string, number> = {};

      for (let i = 0; i < input.days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        trendData[dateStr!] = 0;
      }

      findings.forEach((finding) => {
        const dateStr = finding.foundAt.toISOString().split("T")[0];
        if (dateStr && trendData[dateStr] !== undefined) {
          trendData[dateStr] += finding._count;
        }
      });

      const chartData = Object.entries(trendData).map(([date, count]) => ({
        date,
        count,
      }));

      return {
        days: input.days,
        data: chartData,
      };
    }),

  // Get website performance
  getWebsitePerformance: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(7),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      const websiteStats = await ctx.db.website.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              findings: {
                where: {
                  foundAt: { gte: startDate },
                },
              },
            },
          },
        },
        orderBy: {
          findings: {
            _count: "desc",
          },
        },
      });

      return {
        days: input.days,
        websites: websiteStats.map((ws) => ({
          id: ws.id,
          name: ws.name,
          findingsCount: ws._count.findings,
        })),
      };
    }),
});
