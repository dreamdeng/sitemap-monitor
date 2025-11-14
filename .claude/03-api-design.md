# 03 - tRPC API设计

## tRPC配置

### 基础配置文件
```typescript
// src/server/api/trpc.ts
import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { prisma } from '~/server/db';

// 创建context
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  return {
    prisma,
    ...opts,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// 导出router和procedure
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;
```

---

## API Router清单

1. **website** - 网站管理 (9个端点)
2. **finding** - 新发现管理 (6个端点)
3. **monitor** - 监控执行 (4个端点)
4. **dashboard** - 仪表盘数据 (2个端点)
5. **export** - 数据导出 (2个端点)

**总计：23个API端点**

---

## 完整API列表

### Website API
- `website.getAll` - 获取所有网站
- `website.getById` - 获取单个网站
- `website.create` - 创建网站
- `website.update` - 更新网站
- `website.delete` - 删除网站
- `website.batchCreate` - 批量创建
- `website.getStats` - 网站统计

### Finding API
- `finding.getList` - 分页查询新发现
- `finding.getById` - 获取详情
- `finding.markAsRead` - 标记已读
- `finding.batchDelete` - 批量删除
- `finding.getStats` - 统计数据

### Monitor API
- `monitor.runSingle` - 执行单个网站监控
- `monitor.runAll` - 执行全部监控
- `monitor.getStatus` - 获取执行状态
- `monitor.getLogs` - 获取监控日志

### Dashboard API
- `dashboard.getOverview` - 获取概览数据
- `dashboard.getTrend` - 获取趋势图数据

### Export API
- `export.exportCSV` - 导出CSV
- `export.exportExcel` - 导出Excel

详细实现见完整文档。
