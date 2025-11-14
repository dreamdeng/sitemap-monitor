"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { DashboardLayout } from "~/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Download, FileSpreadsheet, FileText } from "lucide-react";

export default function ExportPage() {
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [exportFormat, setExportFormat] = useState<"csv" | "excel">("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: websites } = api.website.getAll.useQuery();

  const exportCSVQuery = api.export.exportCSV.useQuery(
    {
      websiteId: selectedWebsite === "all" ? undefined : selectedWebsite,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
    { enabled: false }
  );

  const exportDataQuery = api.export.exportData.useQuery(
    {
      websiteId: selectedWebsite === "all" ? undefined : selectedWebsite,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
    { enabled: false }
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "csv") {
        // Export CSV
        const result = await exportCSVQuery.refetch();
        if (!result.data) throw new Error("导出数据失败");

        const csvContent = result.data.content;
        const filename = result.data.filename;

        const blob = new Blob(["\ufeff" + csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        downloadFile(blob, filename);

        alert(`成功导出 ${result.data.count} 条数据！`);
      } else {
        // Export Excel (using CSV format for now, can be enhanced with xlsx library)
        const result = await exportDataQuery.refetch();
        if (!result.data) throw new Error("导出数据失败");

        // Convert to CSV format for Excel
        const headers = [
          "Website",
          "URL",
          "Title",
          "Description",
          "Keywords",
          "H1",
          "Is Read",
          "Found At",
        ];

        const rows = result.data.findings.map((finding) => [
          finding.website,
          finding.url,
          finding.title || "",
          finding.description || "",
          finding.keywords || "",
          finding.h1 || "",
          finding.isRead ? "Yes" : "No",
          new Date(finding.foundAt).toISOString(),
        ]);

        const escapeCSV = (value: string) => {
          if (
            value.includes(",") ||
            value.includes('"') ||
            value.includes("\n")
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        const csvContent = [
          headers.join(","),
          ...rows.map((row) => row.map(escapeCSV).join(",")),
        ].join("\n");

        const blob = new Blob(["\ufeff" + csvContent], {
          type: "application/vnd.ms-excel;charset=utf-8;",
        });

        const filename = `findings-export-${new Date().toISOString().split("T")[0]}.xlsx`;
        downloadFile(blob, filename);

        alert(`成功导出 ${result.data.count} 条数据！`);
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">数据导出</h1>
            <p className="mt-1 text-sm text-gray-600">
              选择您的条件以生成和下载数据报告
            </p>
          </div>
        </div>

        <div className="px-8 py-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-8">
                {/* 1. Data Scope */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    1. 数据范围
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="website">选择网站</Label>
                      <Select
                        value={selectedWebsite}
                        onValueChange={setSelectedWebsite}
                      >
                        <SelectTrigger id="website">
                          <SelectValue placeholder="选择一个或多个网站" />
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
                    <div className="space-y-2">
                      <Label htmlFor="dateRange">选择时间范围</Label>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          id="startDate"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="flex items-center text-gray-500">至</span>
                        <input
                          type="date"
                          id="endDate"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Export Format */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    2. 导出格式
                  </h2>
                  <RadioGroup
                    value={exportFormat}
                    onValueChange={(value) =>
                      setExportFormat(value as "csv" | "excel")
                    }
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    <div>
                      <label
                        htmlFor="format-excel"
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          exportFormat === "excel"
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value="excel" id="format-excel" />
                        <FileSpreadsheet className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            Excel (.xlsx)
                          </div>
                          <div className="text-sm text-gray-500">
                            适合数据分析和处理
                          </div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <label
                        htmlFor="format-csv"
                        className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          exportFormat === "csv"
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <RadioGroupItem value="csv" id="format-csv" />
                        <FileText className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            CSV (.csv)
                          </div>
                          <div className="text-sm text-gray-500">
                            通用格式，兼容性好
                          </div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Export Info */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    导出内容包括：URL、发现日期、关键信息、最后检查状态等详细数据
                  </p>
                </div>

                {/* Export Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="bg-indigo-600 hover:bg-indigo-700 px-8"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    {isExporting ? "生成中..." : "生成并下载"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
