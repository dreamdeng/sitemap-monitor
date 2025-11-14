"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function FindingsPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isReadFilter, setIsReadFilter] = useState<boolean | undefined>(
    undefined
  );
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading, refetch } = api.finding.getList.useQuery({
    page,
    pageSize: 20,
    searchTerm: searchTerm || undefined,
    isRead: isReadFilter,
  });

  const exportQuery = api.export.exportCSV.useQuery(
    {
      isRead: isReadFilter,
    },
    {
      enabled: false, // 不自动执行
    }
  );

  const markAsReadMutation = api.finding.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteMutation = api.finding.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
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
    markAsReadMutation.mutate({
      id,
      isRead: !currentIsRead,
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条发现吗？")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // 使用 refetch 触发查询
      const result = await exportQuery.refetch();

      if (!result.data) {
        throw new Error("导出数据失败");
      }

      const csvContent = result.data.content;
      const filename = result.data.filename;

      // 创建 Blob 并下载
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;"
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

  // Selection handlers
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

  // Batch operations
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
      batchDeleteMutation.mutate({
        ids: Array.from(selectedIds),
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!data) return;
    const unreadFindings = data.findings.filter((f) => !f.isRead);
    if (unreadFindings.length === 0) {
      alert("没有未读的发现");
      return;
    }
    if (confirm(`确定要将当前页面的 ${unreadFindings.length} 条未读发现标记为已读吗？`)) {
      batchMarkAsReadMutation.mutate({
        ids: unreadFindings.map((f) => f.id),
        isRead: true,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">新发现</h1>
            <p className="mt-2 text-sm text-gray-600">
              浏览和管理发现的内容
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllAsRead}
              disabled={batchMarkAsReadMutation.isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              一键全部已读
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {exporting ? "导出中..." : "导出 CSV"}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
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
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            新发现
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700"
                >
                  搜索
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="搜索标题、描述、关键词..."
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  状态
                </label>
                <select
                  id="status"
                  value={
                    isReadFilter === undefined
                      ? "all"
                      : isReadFilter
                      ? "read"
                      : "unread"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setIsReadFilter(
                      value === "all"
                        ? undefined
                        : value === "read"
                        ? true
                        : false
                    );
                    setPage(1);
                  }}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="all">全部</option>
                  <option value="unread">未读</option>
                  <option value="read">已读</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  搜索
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Findings List */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              {data && data.findings.length > 0 && (
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size > 0 &&
                    selectedIds.size === data.findings.length
                  }
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        selectedIds.size > 0 &&
                        selectedIds.size < data.findings.length;
                    }
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              )}
              <h2 className="text-lg font-semibold text-gray-900">
                所有发现 ({data?.total || 0})
              </h2>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <span className="text-sm text-gray-600">
                  已选择 {selectedIds.size} 项
                </span>
              </div>
            )}
          </div>

          {/* Batch Action Bar */}
          {selectedIds.size > 0 && (
            <div className="border-b border-gray-200 bg-blue-50 px-6 py-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBatchMarkAsRead(true)}
                  disabled={batchMarkAsReadMutation.isPending}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  批量标为已读
                </button>
                <button
                  onClick={() => handleBatchMarkAsRead(false)}
                  disabled={batchMarkAsReadMutation.isPending}
                  className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  批量标为未读
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={batchDeleteMutation.isPending}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  批量删除
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="ml-auto rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  取消选择
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {!data || data.findings.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  没有找到发现。尝试调整筛选条件。
                </p>
              </div>
            ) : (
              data.findings.map((finding) => (
                <div
                  key={finding.id}
                  className={`px-6 py-4 ${
                    selectedIds.has(finding.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(finding.id)}
                      onChange={() => handleSelectOne(finding.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex flex-1 items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {finding.title}
                          </h3>
                          {!finding.isRead && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              新
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {finding.website.name}
                        </p>
                        {finding.description && (
                          <p className="mt-2 text-sm text-gray-500">
                            {finding.description}
                          </p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <a
                            href={finding.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            访问链接
                          </a>
                          <span>
                            {new Date(finding.foundAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex gap-2">
                        <button
                          onClick={() =>
                            handleMarkAsRead(finding.id, finding.isRead)
                          }
                          disabled={markAsReadMutation.isPending}
                          className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        >
                          {finding.isRead ? "标为未读" : "标为已读"}
                        </button>
                        <button
                          onClick={() => handleDelete(finding.id)}
                          disabled={deleteMutation.isPending}
                          className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-700">
                第 {page} 页，共 {data.totalPages} 页
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === data.totalPages}
                className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
