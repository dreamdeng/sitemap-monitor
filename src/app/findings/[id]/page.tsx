"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { DashboardLayout } from "~/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  ExternalLink,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Zap,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

export default function FindingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: finding, isLoading } = api.finding.getById.useQuery({
    id: params.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!finding) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">未找到页面</h2>
            <p className="mt-2 text-gray-600">该发现不存在或已被删除</p>
            <Button
              onClick={() => router.push("/findings")}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回列表
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const keywords = finding.keywords
    ? finding.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="border-b bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/findings")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回列表
                </Button>
                {!finding.isRead && (
                  <Badge className="bg-blue-500">新发现</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">页面详情</h1>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <a
                  href={finding.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"
                >
                  {finding.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                重新获取数据
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => window.open(finding.url, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                访问原始页面
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Page Title */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    页面标题
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium text-gray-900">
                    {finding.title || "无标题"}
                  </p>
                </CardContent>
              </Card>

              {/* Meta Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    元描述
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {finding.description || "无描述信息"}
                  </p>
                </CardContent>
              </Card>

              {/* Meta Keywords */}
              {keywords.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      关键词
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* H1 Tag */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    H1 标签
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {finding.h1 || "无 H1 标签"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Metadata - Right Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-gray-900">
                    元数据
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Discovered At */}
                  <div className="flex items-start gap-3 border-b pb-4">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        发现时间
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {format(
                          new Date(finding.foundAt),
                          "yyyy年MM月dd日 HH:mm"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Website */}
                  <div className="flex items-start gap-3 border-b pb-4">
                    <div className="rounded-lg bg-purple-50 p-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        来源网站
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {finding.website.name}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-start gap-3 border-b pb-4">
                    <div className="rounded-lg bg-green-50 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">状态</p>
                      <Badge className="mt-1 bg-green-500 hover:bg-green-600">
                        200 OK
                      </Badge>
                    </div>
                  </div>

                  {/* Read Status */}
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-amber-50 p-2">
                      <Zap className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">
                        阅读状态
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {finding.isRead ? "已读" : "未读"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
