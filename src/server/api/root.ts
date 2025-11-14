import { createTRPCRouter } from "~/server/api/trpc";
import { websiteRouter } from "./routers/website";
import { findingRouter } from "./routers/finding";
import { monitorRouter } from "./routers/monitor";
import { dashboardRouter } from "./routers/dashboard";
import { exportRouter } from "./routers/export";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  website: websiteRouter,
  finding: findingRouter,
  monitor: monitorRouter,
  dashboard: dashboardRouter,
  export: exportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
