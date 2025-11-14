/**
 * Website Router
 * Handles website CRUD operations
 */

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const websiteRouter = createTRPCRouter({
  // Get all websites
  getAll: publicProcedure.query(async ({ ctx }) => {
    const websites = await ctx.db.website.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { findings: true },
        },
      },
    });
    return websites;
  }),

  // Get single website by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const website = await ctx.db.website.findUnique({
        where: { id: input.id },
        include: {
          findings: {
            take: 10,
            orderBy: { foundAt: "desc" },
          },
          _count: {
            select: { findings: true },
          },
        },
      });
      return website;
    }),

  // Create new website
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        sitemapUrl: z.string().url(),
        checkFrequency: z.number().min(1).default(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const website = await ctx.db.website.create({
        data: {
          name: input.name,
          sitemapUrl: input.sitemapUrl,
          checkFrequency: input.checkFrequency,
        },
      });
      return website;
    }),

  // Update website
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        sitemapUrl: z.string().url().optional(),
        status: z.enum(["ACTIVE", "PAUSED"]).optional(),
        checkFrequency: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const website = await ctx.db.website.update({
        where: { id },
        data,
      });
      return website;
    }),

  // Delete website
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.website.delete({
        where: { id: input.id },
      });
      return { success: true };
    }),

  // Batch create websites
  batchCreate: publicProcedure
    .input(
      z.object({
        websites: z.array(
          z.object({
            name: z.string().min(1),
            sitemapUrl: z.string().url(),
            checkFrequency: z.number().min(1).default(12),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.website.createMany({
        data: input.websites,
        skipDuplicates: true,
      });
      return { count: result.count };
    }),

  // Get website statistics
  getStats: publicProcedure.query(async ({ ctx }) => {
    const [total, active, paused, totalFindings] = await Promise.all([
      ctx.db.website.count(),
      ctx.db.website.count({ where: { status: "ACTIVE" } }),
      ctx.db.website.count({ where: { status: "PAUSED" } }),
      ctx.db.finding.count(),
    ]);

    return {
      total,
      active,
      paused,
      totalFindings,
    };
  }),
});
