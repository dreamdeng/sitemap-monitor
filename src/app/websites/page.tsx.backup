"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function WebsitesPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [name, setName] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [batchText, setBatchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: websites, isLoading, refetch } = api.website.getAll.useQuery();

  const createMutation = api.website.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setName("");
      setSitemapUrl("");
      alert("网站添加成功！");
    },
  });

  const batchCreateMutation = api.website.batchCreate.useMutation({
    onSuccess: (data) => {
      refetch();
      setShowBatchImport(false);
      setBatchText("");
      alert(`成功导入 ${data.count} 个网站！`);
    },
    onError: (error) => {
      alert(`批量导入失败: ${error.message}`);
    },
  });

  const deleteMutation = api.website.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const monitorMutation = api.monitor.runSingle.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`监控失败: ${error.message}`);
    },
  });

  // 从URL自动提取网站名称
  const extractNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      // 移除 www. 和顶级域名
      const name = hostname
        .replace(/^www\./, "")
        .split(".")
        .slice(0, -1)
        .join(".");
      // 首字母大写
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch {
      return "";
    }
  };

  // 处理URL输入变化
  const handleUrlChange = (url: string) => {
    setSitemapUrl(url);
    if (url && !name) {
      const extractedName = extractNameFromUrl(url);
      if (extractedName) {
        setName(extractedName);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      sitemapUrl,
      checkFrequency: 12,
    });
  };

  // 批量导入处理
  const handleBatchImport = () => {
    const lines = batchText.split("\n").filter((line) => line.trim());
    const websites = lines
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length === 2) {
          return {
            name: parts[0]!,
            sitemapUrl: parts[1]!,
            checkFrequency: 12,
          };
        } else if (parts.length === 1 && parts[0]) {
          // 只有URL，自动提取名称
          const url = parts[0];
          return {
            name: extractNameFromUrl(url),
            sitemapUrl: url,
            checkFrequency: 12,
          };
        }
        return null;
      })
      .filter((w) => w !== null);

    if (websites.length === 0) {
      alert("没有有效的网站数据，请检查格式");
      return;
    }

    if (confirm(`确定要导入 ${websites.length} 个网站吗？`)) {
      batchCreateMutation.mutate({ websites });
    }
  };

  // 复选框处理
  const handleSelectAll = (checked: boolean) => {
    if (checked && websites) {
      setSelectedIds(new Set(websites.map((w) => w.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert("请先选择要删除的网站");
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedIds.size} 个网站吗？`)) {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync({ id });
      }
      alert("批量删除成功！");
      setSelectedIds(new Set());
    }
  };

  // 批量监控
  const handleBatchMonitor = async () => {
    if (selectedIds.size === 0) {
      alert("请先选择要监控的网站");
      return;
    }

    if (confirm(`确定要监控选中的 ${selectedIds.size} 个网站吗？`)) {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await monitorMutation.mutateAsync({ websiteId: id });
          successCount++;
        } catch {
          failCount++;
        }
      }

      alert(
        `批量监控完成！\n成功: ${successCount} 个\n失败: ${failCount} 个`
      );
      setSelectedIds(new Set());
    }
  };

  const handleDelete = (id: string, websiteName: string) => {
    if (confirm(`确定要删除 ${websiteName} 吗？`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleMonitor = (id: string) => {
    if (confirm("立即开始监控这个网站吗？")) {
      monitorMutation.mutate({ websiteId: id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  const allSelected =
    websites && websites.length > 0 && selectedIds.size === websites.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">网站管理</h1>
            <p className="mt-2 text-sm text-gray-600">管理您监控的网站</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowBatchImport(!showBatchImport);
                setShowAddForm(false);
              }}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {showBatchImport ? "取消" : "批量导入"}
            </button>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowBatchImport(false);
              }}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {showAddForm ? "取消" : "添加网站"}
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
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
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

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              添加新网站
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="sitemapUrl"
                  className="block text-sm font-medium text-gray-700"
                >
                  Sitemap URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  id="sitemapUrl"
                  value={sitemapUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="https://example.com/sitemap.xml"
                />
                <p className="mt-1 text-xs text-gray-500">
                  输入URL后会自动提取网站名称
                </p>
              </div>
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  网站名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="例如：Poki"
                />
                <p className="mt-1 text-xs text-gray-500">
                  可以修改自动提取的名称
                </p>
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? "添加中..." : "添加网站"}
              </button>
            </form>
          </div>
        )}

        {/* Batch Import */}
        {showBatchImport && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              批量导入网站
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  导入格式
                </label>
                <div className="mt-2 rounded-md bg-gray-50 p-4 text-xs text-gray-600">
                  <p className="mb-2 font-medium">支持两种格式：</p>
                  <p className="mb-1">
                    1. 网站名称,Sitemap URL（推荐）
                  </p>
                  <p className="mb-2">例如：Poki,https://poki.com/sitemap.xml</p>
                  <p className="mb-1">2. 仅Sitemap URL（自动提取名称）</p>
                  <p>例如：https://poki.com/sitemap.xml</p>
                  <p className="mt-3 text-amber-600">
                    每行一个网站，可以混合使用两种格式
                  </p>
                </div>
              </div>
              <div>
                <label
                  htmlFor="batchText"
                  className="block text-sm font-medium text-gray-700"
                >
                  批量输入
                </label>
                <textarea
                  id="batchText"
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  rows={10}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder={`Poki,https://poki.com/sitemap.xml
CrazyGames,https://www.crazygames.com/sitemap.xml
https://www.y8.com/sitemap.xml`}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleBatchImport}
                  disabled={batchCreateMutation.isPending || !batchText.trim()}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {batchCreateMutation.isPending ? "导入中..." : "开始导入"}
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "确定要下载导入模板吗？模板中包含了示例数据。"
                      )
                    ) {
                      const template = `网站名称,Sitemap URL
Poki,https://poki.com/sitemap.xml
CrazyGames,https://www.crazygames.com/sitemap.xml
Y8,https://www.y8.com/sitemap.xml`;
                      const blob = new Blob(["\ufeff" + template], {
                        type: "text/csv;charset=utf-8;",
                      });
                      const link = document.createElement("a");
                      const url = URL.createObjectURL(blob);
                      link.setAttribute("href", url);
                      link.setAttribute("download", "网站导入模板.csv");
                      link.style.visibility = "hidden";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  下载模板
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Batch Actions */}
        {selectedIds.size > 0 && (
          <div className="mb-4 rounded-lg bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                已选择 {selectedIds.size} 个网站
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBatchMonitor}
                  disabled={monitorMutation.isPending}
                  className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  批量监控
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={deleteMutation.isPending}
                  className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  批量删除
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Websites List */}
        <div className="rounded-lg bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) {
                    input.indeterminate = someSelected;
                  }
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <h2 className="text-lg font-semibold text-gray-900">
                所有网站 ({websites?.length || 0})
              </h2>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {!websites || websites.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-gray-500">
                  还没有添加网站。点击"添加网站"或"批量导入"开始使用。
                </p>
              </div>
            ) : (
              websites.map((website) => (
                <div key={website.id} className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(website.id)}
                      onChange={(e) =>
                        handleSelectOne(website.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {website.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {website.sitemapUrl}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          状态：{" "}
                          <span
                            className={
                              website.status === "ACTIVE"
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            {website.status === "ACTIVE" ? "激活" : "暂停"}
                          </span>
                        </span>
                        <span>{website.totalUrls} 个 URL</span>
                        <span>{website._count.findings} 个发现</span>
                        {website.lastCheckTime && (
                          <span>
                            最后检查：{" "}
                            {new Date(website.lastCheckTime).toLocaleString(
                              "zh-CN"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMonitor(website.id)}
                        disabled={monitorMutation.isPending}
                        className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        监控
                      </button>
                      <button
                        onClick={() => handleDelete(website.id, website.name)}
                        disabled={deleteMutation.isPending}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
