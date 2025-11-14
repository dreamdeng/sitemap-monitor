/**
 * Export Router
 * Handles data export to CSV and Excel
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const exportRouter = createTRPCRouter({
  // Export findings to CSV format
  exportCSV: publicProcedure
    .input(
      z.object({
        websiteId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.websiteId) {
        where.websiteId = input.websiteId;
      }

      if (input.startDate || input.endDate) {
        where.foundAt = {};
        if (input.startDate) where.foundAt.gte = input.startDate;
        if (input.endDate) where.foundAt.lte = input.endDate;
      }

      if (input.isRead !== undefined) {
        where.isRead = input.isRead;
      }

      const findings = await ctx.db.finding.findMany({
        where,
        include: {
          website: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { foundAt: "desc" },
      });

      // Convert to CSV format
      const headers = [
        "Website",
        "URL",
        "Title",
        "Description",
        "Keywords",
        "H1",
        "Is Read",
        "Found At",
      ];

      const rows = findings.map((finding) => [
        finding.website.name,
        finding.url,
        finding.title,
        finding.description,
        finding.keywords,
        finding.h1,
        finding.isRead ? "Yes" : "No",
        finding.foundAt.toISOString(),
      ]);

      // Escape CSV values
      const escapeCSV = (value: string) => {
        if (value.includes(",") || value.includes('"') || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");

      return {
        content: csvContent,
        filename: `findings-export-${new Date().toISOString().split("T")[0]}.csv`,
        count: findings.length,
      };
    }),

  // Get export data for Excel (returns JSON that can be processed on frontend)
  exportData: publicProcedure
    .input(
      z.object({
        websiteId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isRead: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.websiteId) {
        where.websiteId = input.websiteId;
      }

      if (input.startDate || input.endDate) {
        where.foundAt = {};
        if (input.startDate) where.foundAt.gte = input.startDate;
        if (input.endDate) where.foundAt.lte = input.endDate;
      }

      if (input.isRead !== undefined) {
        where.isRead = input.isRead;
      }

      const findings = await ctx.db.finding.findMany({
        where,
        include: {
          website: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { foundAt: "desc" },
      });

      return {
        findings: findings.map((finding) => ({
          website: finding.website.name,
          url: finding.url,
          title: finding.title,
          description: finding.description,
          keywords: finding.keywords,
          h1: finding.h1,
          isRead: finding.isRead,
          foundAt: finding.foundAt,
        })),
        count: findings.length,
      };
    }),
});
