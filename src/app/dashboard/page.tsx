"use client";

import { api } from "~/trpc/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: overview, isLoading } = api.dashboard.getOverview.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">暂无数据</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">仪表盘</h1>
          <p className="mt-2 text-sm text-gray-600">
            监控您的网站 Sitemap 并发现新内容
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            仪表盘
          </Link>
          <Link
            href="/websites"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            网站管理
          </Link>
          <Link
            href="/findings"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            新发现
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Websites */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">网站总数</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {overview.websites.total}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {overview.websites.active} 个激活，{overview.websites.paused} 个暂停
            </p>
          </div>

          {/* Total Findings */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">发现总数</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {overview.findings.total}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {overview.findings.unread} 个未读
            </p>
          </div>

          {/* Today's Findings */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">今日发现</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {overview.findings.today}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              昨日 {overview.findings.yesterday} 个
            </p>
          </div>

          {/* This Week */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">本周数据</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {overview.findings.week}
            </p>
            <p className="mt-2 text-sm text-gray-600">新发现</p>
          </div>
        </div>

        {/* Recent Findings */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            最近发现
          </h2>
          {overview.findings.recent.length === 0 ? (
            <p className="text-sm text-gray-500">暂无发现</p>
          ) : (
            <div className="space-y-4">
              {overview.findings.recent.map((finding) => (
                <div
                  key={finding.id}
                  className="border-l-4 border-indigo-500 pl-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {finding.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {finding.website.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(finding.foundAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    {!finding.isRead && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        新
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Last Monitor Run */}
        {overview.lastMonitor && (
          <div className="mt-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              最后监控运行
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {overview.lastMonitor.website?.name || "所有网站"}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(overview.lastMonitor.executedAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    overview.lastMonitor.status === "SUCCESS"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {overview.lastMonitor.status === "SUCCESS" ? "成功" : "失败"}
                </span>
                <p className="mt-1 text-sm text-gray-600">
                  {overview.lastMonitor.newCount} 个新发现
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
