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
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Search,
  Plus,
  Play,
  Trash2,
  MoreVertical,
  Upload,
  Download,
} from "lucide-react";

export default function WebsitesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [name, setName] = useState("");
  const [sitemapUrl, setSitemapUrl] = useState("");
  const [checkFrequency, setCheckFrequency] = useState(12);
  const [batchText, setBatchText] = useState("");

  const { data: websites, refetch } = api.website.getAll.useQuery();
  const deleteMutation = api.website.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const createMutation = api.website.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      setName("");
      setSitemapUrl("");
      alert("网站添加成功！");
    },
  });
  const batchCreateMutation = api.website.batchCreate.useMutation({
    onSuccess: (data) => {
      refetch();
      setIsBatchImportOpen(false);
      setBatchText("");
      alert(`成功导入 ${data.count} 个网站！`);
    },
    onError: (error) => {
      alert(`批量导入失败: ${error.message}`);
    },
  });
  const monitorMutation = api.monitor.runSingle.useMutation({
    onSuccess: () => refetch(),
    onError: (error) => {
      alert(`监控失败: ${error.message}`);
    },
  });

  const filteredWebsites = websites?.filter(
    (site) =>
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.sitemapUrl.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 从URL自动提取网站名称
  const extractNameFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const name = hostname
        .replace(/^www\./, "")
        .split(".")
        .slice(0, -1)
        .join(".");
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

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredWebsites) {
      setSelectedIds(new Set(filteredWebsites.map((w) => w.id)));
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

  const handleDelete = (id: string, websiteName: string) => {
    if (confirm(`确定要删除 ${websiteName} 吗？`)) {
      deleteMutation.mutate({ id });
    }
  };

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

  const handleMonitor = (id: string) => {
    if (confirm("立即开始监控这个网站吗？")) {
      monitorMutation.mutate({ websiteId: id });
    }
  };

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

      alert(`批量监控完成！\n成功: ${successCount} 个\n失败: ${failCount} 个`);
      setSelectedIds(new Set());
    }
  };

  const handleAddWebsite = () => {
    if (!name || !sitemapUrl) {
      alert("请填写完整信息");
      return;
    }
    createMutation.mutate({
      name,
      sitemapUrl,
      checkFrequency,
    });
  };

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

  const handleDownloadTemplate = () => {
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
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500 hover:bg-green-600">激活</Badge>;
      case "ERROR":
        return <Badge variant="destructive">错误</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">待检查</Badge>;
      default:
        return <Badge variant="secondary">暂停</Badge>;
    }
  };

  const allSelected =
    filteredWebsites && filteredWebsites.length > 0 && selectedIds.size === filteredWebsites.length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">网站管理</h1>
              <p className="mt-1 text-sm text-gray-600">
                管理您监控的所有网站和站点地图
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setIsBatchImportOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                批量导入
              </Button>
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                添加网站
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="搜索网站名称或URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      已选择 {selectedIds.size} 项
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchMonitor}
                      disabled={monitorMutation.isPending}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      批量监控
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDelete}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      批量删除
                    </Button>
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
                    <TableHead>网站名称</TableHead>
                    <TableHead>站点地图URL</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>URL数量</TableHead>
                    <TableHead>发现数</TableHead>
                    <TableHead>上次检查</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWebsites?.map((website) => (
                    <TableRow key={website.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(website.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(website.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {website.name}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-sm text-gray-600">
                        {website.sitemapUrl}
                      </TableCell>
                      <TableCell>{getStatusBadge(website.status)}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {website.totalUrls}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {website._count.findings}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {website.lastCheckTime
                          ? new Date(website.lastCheckTime).toLocaleString("zh-CN")
                          : "从未检查"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMonitor(website.id)}
                            disabled={monitorMutation.isPending}
                            title="立即监控"
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleDelete(website.id, website.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!filteredWebsites || filteredWebsites.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {searchQuery ? "未找到匹配的网站" : "还没有添加网站。点击「添加网站」或「批量导入」开始使用。"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Website Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加网站</DialogTitle>
            <DialogDescription>
              添加一个新的网站进行监控
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sitemapUrl">
                站点地图URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sitemapUrl"
                type="url"
                placeholder="https://example.com/sitemap.xml"
                value={sitemapUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                输入URL后会自动提取网站名称
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">
                网站名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="例如：Poki"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                可以修改自动提取的名称
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">监控频率（小时）</Label>
              <Select
                value={checkFrequency.toString()}
                onValueChange={(value) => setCheckFrequency(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">每小时</SelectItem>
                  <SelectItem value="6">每6小时</SelectItem>
                  <SelectItem value="12">每12小时</SelectItem>
                  <SelectItem value="24">每天</SelectItem>
                  <SelectItem value="168">每周</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleAddWebsite}
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Import Dialog */}
      <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量导入网站</DialogTitle>
            <DialogDescription>
              每行输入一个站点地图URL，网站名称将自动从URL中提取
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-gray-50 p-4 text-xs text-gray-600">
              <p className="mb-2 font-medium">支持两种格式：</p>
              <p className="mb-1">1. 网站名称,Sitemap URL（推荐）</p>
              <p className="mb-2">例如：Poki,https://poki.com/sitemap.xml</p>
              <p className="mb-1">2. 仅Sitemap URL（自动提取名称）</p>
              <p>例如：https://poki.com/sitemap.xml</p>
              <p className="mt-3 text-amber-600">
                每行一个网站，可以混合使用两种格式
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchText">批量输入</Label>
              <textarea
                id="batchText"
                className="min-h-[200px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Poki,https://poki.com/sitemap.xml
CrazyGames,https://www.crazygames.com/sitemap.xml
https://www.y8.com/sitemap.xml`}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                已输入 {batchText.split("\n").filter((l) => l.trim()).length} 个URL
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBatchImportOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleBatchImport}
              disabled={batchCreateMutation.isPending || !batchText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {batchCreateMutation.isPending ? "导入中..." : "导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
