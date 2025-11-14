"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { DashboardLayout } from "~/components/layout";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "SUCCESS" | "FAILED" | "PARTIAL";

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");

  const { data, isLoading, refetch } = api.monitor.getLogs.useQuery({
    page,
    pageSize: 20,
    websiteId: selectedWebsite === "all" ? undefined : selectedWebsite,
    status:
      statusFilter === "all"
        ? undefined
        : (statusFilter as "SUCCESS" | "FAILED" | "PARTIAL"),
  });

  const { data: websites } = api.website.getAll.useQuery();
  const runAllMutation = api.monitor.runAll.useMutation({
    onSuccess: () => {
      refetch();
      alert("全部监控已开始执行！");
    },
    onError: (error) => {
      alert(`执行失败: ${error.message}`);
    },
  });

  const filteredLogs = data?.logs.filter((log) => {
    if (!searchTerm) return true;
    return (
      log.website?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            成功
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            失败
          </Badge>
        );
      case "PARTIAL":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            部分成功
          </Badge>
        );
      default:
        return <Badge variant="secondary">未知</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">加载中...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">监控日志</h1>
              <p className="mt-1 text-sm text-gray-600">
                查看所有网站的监控执行记录
              </p>
            </div>
            <Button
              onClick={() => runAllMutation.mutate()}
              disabled={runAllMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${runAllMutation.isPending ? "animate-spin" : ""}`}
              />
              {runAllMutation.isPending ? "执行中..." : "手动检查"}
            </Button>
          </div>
        </div>

        <div className="px-8 py-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                {/* Search and Filters Row */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="搜索网站名或URL..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={selectedWebsite}
                    onValueChange={(value) => {
                      setSelectedWebsite(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="选择网站" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有网站</SelectItem>
                      {websites?.map((website) => (
                        <SelectItem key={website.id} value={website.id}>
                          {website.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as StatusFilter);
                    setPage(1);
                  }}
                >
                  <TabsList>
                    <TabsTrigger value="all">全部</TabsTrigger>
                    <TabsTrigger value="SUCCESS">成功</TabsTrigger>
                    <TabsTrigger value="FAILED">失败</TabsTrigger>
                    <TabsTrigger value="PARTIAL">部分成功</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>执行时间</TableHead>
                    <TableHead>监控网站</TableHead>
                    <TableHead>新增页面</TableHead>
                    <TableHead>执行结果</TableHead>
                    <TableHead className="text-right">耗时</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {format(
                          new Date(log.executedAt),
                          "yyyy-MM-dd HH:mm:ss"
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.website?.name || "未知网站"}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span
                          className={
                            log.newCount > 0
                              ? "font-semibold text-green-600"
                              : "text-gray-600"
                          }
                        >
                          {log.newCount}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {log.durationSeconds
                          ? `${log.durationSeconds.toFixed(2)}s`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredLogs || filteredLogs.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? "未找到匹配的日志"
                          : "还没有监控日志记录"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    显示第 {(page - 1) * 20 + 1} 到{" "}
                    {Math.min(page * 20, data.total)} 条，共 {data.total} 条结果
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      上一页
                    </Button>
                    <div className="text-sm text-gray-600">
                      第 {page} 页，共 {data.totalPages} 页
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
