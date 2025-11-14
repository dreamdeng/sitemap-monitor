"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { TopNav } from "~/components/layout/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Eye,
  FileText,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, subDays } from "date-fns";

type TimeRange = "today" | "7days" | "30days" | "custom";

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const { data: overview, isLoading } = api.dashboard.getOverview.useQuery();

  // 生成模拟图表数据
  const chartData = Array.from({ length: 35 }, (_, i) => {
    const date = subDays(new Date(), 34 - i);
    return {
      date: format(date, "M/d"),
      value: Math.floor(Math.random() * 50) + 20,
    };
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  const stats = [
    {
      title: "Active Monitored Sites",
      value: overview?.websites?.active || 0,
      icon: Eye,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "New Pages Today",
      value: overview?.findings?.today || 0,
      icon: FileText,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "Total Pages Discovered",
      value: overview?.findings?.total || 0,
      icon: BarChart3,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "Errors/Issues",
      value: 0,
      icon: AlertCircle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
    },
  ];

  const recentActivities = [
    {
      site: "site-one.com",
      action: "5 new pages discovered",
      time: "2 minutes ago",
      icon: FileText,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      site: "another-site.dev",
      action: "Sitemap check completed",
      time: "10 minutes ago",
      icon: CheckCircle,
      iconColor: "text-green-600",
      iconBg: "bg-green-100",
    },
    {
      site: "example-corp.io",
      action: "Key information extracted",
      time: "1 hour ago",
      icon: BarChart3,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      site: "failing-site.com",
      action: "Sitemap fetch failed",
      time: "3 hours ago",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      iconBg: "bg-red-100",
    },
    {
      site: "new-domain.com",
      action: "added for monitoring",
      time: "Yesterday",
      icon: Plus,
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back, here's a summary of your sitemap activity.
            </p>
          </div>
          <Link href="/websites">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-2 h-4 w-4" />
              Add New Website
            </Button>
          </Link>
        </div>

        {/* Time Range Tabs */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="mb-8">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
            <TabsTrigger value="custom">Custom Range</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.iconBg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart and Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>New Pages Discovered Over Time</CardTitle>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {overview?.findings?.total.toLocaleString() || "2,450"}
                    </span>
                    <span className="text-sm text-gray-600">Last 30 Days</span>
                    <span className="text-sm font-medium text-green-600">
                      +15.3%
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`rounded-lg p-2 ${activity.iconBg}`}>
                      <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.site}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.action}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
