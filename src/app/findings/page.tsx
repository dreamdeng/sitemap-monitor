"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "~/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  Download,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function FindingsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(undefined);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = api.finding.getList.useQuery({
    page,
    pageSize: 20,
    searchTerm: searchTerm || undefined,
    isRead: isReadFilter,
  });

  const { data: websites } = api.website.getAll.useQuery();

  const exportQuery = api.export.exportCSV.useQuery(
    { isRead: isReadFilter },
    { enabled: false }
  );

  const markAsReadMutation = api.finding.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = api.finding.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const batchMarkAsReadMutation = api.finding.batchMarkAsRead.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set());
      refetch();
    },
  });

  const batchDeleteMutation = api.finding.batchDelete.useMutation({
    onSuccess: () => {
      setSelectedIds(new Set());
      refetch();
    },
  });

  const handleMarkAsRead = (id: string, currentIsRead: boolean) => {
    markAsReadMutation.mutate({ id, isRead: !currentIsRead });
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条发现吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportQuery.refetch();
      if (!result.data) throw new Error("导出数据失败");

      const csvContent = result.data.content;
      const filename = result.data.filename;

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert("导出成功！");
    } catch (error) {
      console.error("Export error:", error);
      alert("导出失败，请重试");
    } finally {
      setExporting(false);
    }
  };

  const handleSelectAll = () => {
    if (!data) return;
    if (selectedIds.size === data.findings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.findings.map((f) => f.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBatchMarkAsRead = (isRead: boolean) => {
    if (selectedIds.size === 0) {
      alert("请先选择要操作的发现");
      return;
    }
    batchMarkAsReadMutation.mutate({
      ids: Array.from(selectedIds),
      isRead,
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      alert("请先选择要删除的发现");
      return;
    }
    if (confirm(`确定要删除选中的 ${selectedIds.size} 条发现吗？`)) {
      batchDeleteMutation.mutate({ ids: Array.from(selectedIds) });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!data) return;
    const unreadFindings = data.findings.filter((f) => !f.isRead);
    if (unreadFindings.length === 0) {
      alert("没有未读的发现");
      return;
    }
    if (
      confirm(
        `确定要将当前页面的 ${unreadFindings.length} 条未读发现标记为已读吗？`
      )
    ) {
      batchMarkAsReadMutation.mutate({
        ids: unreadFindings.map((f) => f.id),
        isRead: true,
      });
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setIsReadFilter(undefined);
    setSelectedWebsite("all");
    setPage(1);
  };

  const filteredData = data?.findings.filter((finding) => {
    if (selectedWebsite !== "all" && finding.website.id !== selectedWebsite) {
      return false;
    }
    return true;
  });

  const allSelected = filteredData && filteredData.length > 0 && selectedIds.size === filteredData.length;

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
              <h1 className="text-2xl font-bold text-gray-900">新发现</h1>
              <p className="mt-1 text-sm text-gray-600">
                浏览和管理发现的新页面内容
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {exporting ? "导出中..." : "导出 CSV"}
              </Button>
              <Button
                onClick={handleMarkAllAsRead}
                disabled={batchMarkAsReadMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                一键全部已读
              </Button>
            </div>
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
                      placeholder="搜索标题或URL..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
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
                      <SelectValue placeholder="按网站筛选" />
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
                  <Select
                    value={
                      isReadFilter === undefined
                        ? "all"
                        : isReadFilter
                        ? "read"
                        : "unread"
                    }
                    onValueChange={(value) => {
                      setIsReadFilter(
                        value === "all"
                          ? undefined
                          : value === "read"
                          ? true
                          : false
                      );
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      <SelectItem value="unread">未读</SelectItem>
                      <SelectItem value="read">已读</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={handleClearFilters}>
                    清除筛选
                  </Button>
                </div>

                {/* Batch Actions Row */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3">
                    <span className="text-sm font-medium text-blue-900">
                      已选择 {selectedIds.size} 项
                    </span>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchMarkAsRead(true)}
                        disabled={batchMarkAsReadMutation.isPending}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        标为已读
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBatchMarkAsRead(false)}
                        disabled={batchMarkAsReadMutation.isPending}
                      >
                        <EyeOff className="mr-2 h-4 w-4" />
                        标为未读
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBatchDelete}
                        disabled={batchDeleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>页面标题</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>来源网站</TableHead>
                    <TableHead>发现时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((finding) => (
                    <TableRow key={finding.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(finding.id)}
                          onCheckedChange={() => handleSelectOne(finding.id)}
                        />
                      </TableCell>
                      <TableCell
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/findings/${finding.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {!finding.isRead && (
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {finding.title}
                            </p>
                            {finding.description && (
                              <p className="mt-1 text-sm text-gray-500">
                                {finding.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        <a
                          href={finding.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          {finding.url}
                        </a>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {finding.website.name}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(finding.foundAt).toLocaleString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleMarkAsRead(finding.id, finding.isRead)
                            }
                            disabled={markAsReadMutation.isPending}
                            title={finding.isRead ? "标为未读" : "标为已读"}
                          >
                            {finding.isRead ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(finding.id)}
                            disabled={deleteMutation.isPending}
                            title="删除"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredData || filteredData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        没有找到发现。尝试调整筛选条件。
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
