/**
 * Vercel Cron endpoint for automated monitoring
 */

import { NextResponse } from "next/server";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { MonitorOrchestrator } from "~/server/services/monitor/monitor-orchestrator";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token !== env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run monitoring
    console.log("[Cron] Starting automated monitoring...");
    const orchestrator = new MonitorOrchestrator(db);
    const results = await orchestrator.monitorAllWebsites();

    const summary = {
      timestamp: new Date().toISOString(),
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalNewFindings: results.reduce((sum, r) => sum + r.newCount, 0),
    };

    console.log("[Cron] Monitoring completed:", summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
    });
  } catch (error) {
    console.error("[Cron] Monitoring failed:", error);
    return NextResponse.json(
      {
        error: "Monitoring failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
