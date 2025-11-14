# 02 - 数据库Schema设计

## Prisma Schema 完整定义

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 网站表 ====================
model Website {
  id              String        @id @default(cuid())
  name            String        // 网站名称
  sitemapUrl      String        @unique @map("sitemap_url") // Sitemap URL
  status          WebsiteStatus @default(ACTIVE) // 状态
  lastUrls        Json          @default("[]") @map("last_urls") // 上次的URL列表(JSON数组)
  totalUrls       Int           @default(0) @map("total_urls") // 总URL数
  lastCheckTime   DateTime?     @map("last_check_time") // 最后检查时间
  checkFrequency  Int           @default(12) @map("check_frequency") // 检查频率(小时)
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  
  // 关联
  findings        Finding[]
  monitorLogs     MonitorLog[]
  
  @@map("websites")
  @@index([status])
  @@index([lastCheckTime])
}

// 网站状态枚举
enum WebsiteStatus {
  ACTIVE  // 激活
  PAUSED  // 暂停
}

// ==================== 新发现表 ====================
model Finding {
  id          String   @id @default(cuid())
  websiteId   String   @map("website_id")
  url         String   // 页面URL
  title       String   @default("") // 页面标题
  description String   @default("") @db.Text // 页面描述
  keywords    String   @default("") @db.Text // 关键词
  h1          String   @default("") // H1标签
  isRead      Boolean  @default(false) @map("is_read") // 是否已读
  foundAt     DateTime @default(now()) @map("found_at") // 发现时间
  
  // 关联
  website     Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  @@unique([websiteId, url]) // 同一网站的同一URL只记录一次
  @@map("findings")
  @@index([websiteId])
  @@index([foundAt])
  @@index([isRead])
}

// ==================== 监控日志表 ====================
model MonitorLog {
  id              String         @id @default(cuid())
  websiteId       String?        @map("website_id") // 可为空(全局监控)
  status          MonitorStatus  @default(SUCCESS)
  newCount        Int            @default(0) @map("new_count") // 新发现数量
  errorMessage    String?        @map("error_message") @db.Text
  durationSeconds Int            @default(0) @map("duration_seconds") // 执行耗时(秒)
  executedAt      DateTime       @default(now()) @map("executed_at")
  
  // 关联
  website         Website?       @relation(fields: [websiteId], references: [id], onDelete: SetNull)
  
  @@map("monitor_logs")
  @@index([websiteId])
  @@index([executedAt])
  @@index([status])
}

// 监控状态枚举
enum MonitorStatus {
  SUCCESS   // 成功
  FAILED    // 失败
  PARTIAL   // 部分成功
}

// ==================== 系统配置表 ====================
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique // 配置键
  value     String   @db.Text // 配置值(JSON字符串)
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@map("system_configs")
}
```

---

## 数据库迁移命令

```bash
# 创建迁移
npx prisma migrate dev --name init

# 生成Prisma Client
npx prisma generate

# 查看数据库
npx prisma studio

# 重置数据库(开发环境)
npx prisma migrate reset
```

---

## 表关系说明

```
Website (一) ──→ (多) Finding
  ↓
  └─→ (多) MonitorLog

SystemConfig (独立表)
```

---

## 索引策略

### Website表索引
- `status` - 频繁按状态筛选
- `lastCheckTime` - 按时间排序

### Finding表索引
- `websiteId` - 关联查询
- `foundAt` - 按时间排序
- `isRead` - 筛选未读
- `(websiteId, url)` - 唯一约束

### MonitorLog表索引
- `websiteId` - 关联查询
- `executedAt` - 按时间排序
- `status` - 筛选状态

---

## JSON字段说明

### lastUrls (Website表)
存储上次抓取的所有URL，用于对比

```typescript
type LastUrls = string[] // URL数组

// 示例
[
  "https://poki.com/en/g/subway-surfers",
  "https://poki.com/en/g/temple-run-2",
  "https://poki.com/en/g/among-us"
]
```

### value (SystemConfig表)
存储系统配置，JSON格式

```typescript
// 示例：监控配置
{
  "maxConcurrentSites": 5,
  "maxConcurrentPages": 20,
  "maxNewUrlsPerSite": 50,
  "requestTimeout": 30000,
  "retryTimes": 3
}
```

---

## 数据类型映射

| Prisma类型 | PostgreSQL类型 | TypeScript类型 |
|-----------|---------------|---------------|
| String    | TEXT/VARCHAR  | string        |
| Int       | INTEGER       | number        |
| Boolean   | BOOLEAN       | boolean       |
| DateTime  | TIMESTAMP     | Date          |
| Json      | JSONB         | any/JsonValue |
| @db.Text  | TEXT(无限)    | string        |

---

## 默认值说明

| 字段 | 默认值 | 说明 |
|------|--------|------|
| status | ACTIVE | 新添加的网站默认激活 |
| lastUrls | [] | 空数组 |
| totalUrls | 0 | 初始为0 |
| checkFrequency | 12 | 每12小时检查一次 |
| isRead | false | 新发现默认未读 |
| newCount | 0 | 日志默认0个新发现 |
| durationSeconds | 0 | 默认耗时0秒 |

---

## 级联删除规则

### Website删除
- Finding: CASCADE (删除网站时同时删除所有新发现)
- MonitorLog: SET NULL (保留日志,但websiteId设为NULL)

---

## 查询示例

### 1. 获取激活的网站
```typescript
const activeWebsites = await prisma.website.findMany({
  where: { status: 'ACTIVE' },
  orderBy: { lastCheckTime: 'asc' }
});
```

### 2. 获取某网站的新发现
```typescript
const findings = await prisma.finding.findMany({
  where: { websiteId: 'xxx' },
  orderBy: { foundAt: 'desc' },
  take: 50
});
```

### 3. 统计今日新增
```typescript
const todayCount = await prisma.finding.count({
  where: {
    foundAt: {
      gte: new Date(new Date().setHours(0, 0, 0, 0))
    }
  }
});
```

### 4. 分页查询
```typescript
const findings = await prisma.finding.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  where: { isRead: false },
  include: { website: true },
  orderBy: { foundAt: 'desc' }
});
```

### 5. 全文搜索(需要PostgreSQL扩展)
```typescript
// 搜索标题或关键词
const results = await prisma.$queryRaw`
  SELECT * FROM findings 
  WHERE 
    title ILIKE ${'%' + keyword + '%'} OR 
    keywords ILIKE ${'%' + keyword + '%'}
  ORDER BY found_at DESC 
  LIMIT 50
`;
```

---

## 数据库优化建议

### 1. 定期清理旧数据
```typescript
// 删除30天前的findings
await prisma.finding.deleteMany({
  where: {
    foundAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
});

// 删除90天前的logs
await prisma.monitorLog.deleteMany({
  where: {
    executedAt: {
      lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    }
  }
});
```

### 2. 批量插入优化
```typescript
// 使用createMany提高性能
await prisma.finding.createMany({
  data: findings,
  skipDuplicates: true // 跳过重复
});
```

### 3. 事务处理
```typescript
// 更新网站信息和插入findings在同一事务
await prisma.$transaction([
  prisma.website.update({
    where: { id: websiteId },
    data: { 
      lastUrls: newUrls,
      totalUrls: newUrls.length,
      lastCheckTime: new Date()
    }
  }),
  prisma.finding.createMany({
    data: findingsData,
    skipDuplicates: true
  })
]);
```

---

## Seed数据示例

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 清空数据
  await prisma.finding.deleteMany();
  await prisma.monitorLog.deleteMany();
  await prisma.website.deleteMany();
  await prisma.systemConfig.deleteMany();
  
  // 创建测试网站
  const poki = await prisma.website.create({
    data: {
      name: 'Poki',
      sitemapUrl: 'https://poki.com/sitemap.xml',
      status: 'ACTIVE'
    }
  });
  
  const crazyGames = await prisma.website.create({
    data: {
      name: 'CrazyGames',
      sitemapUrl: 'https://www.crazygames.com/sitemap.xml',
      status: 'ACTIVE'
    }
  });
  
  // 创建系统配置
  await prisma.systemConfig.create({
    data: {
      key: 'monitor_config',
      value: JSON.stringify({
        maxConcurrentSites: 5,
        maxConcurrentPages: 20,
        maxNewUrlsPerSite: 50
      })
    }
  });
  
  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

运行seed:
```bash
npx prisma db seed
```

在package.json中添加:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 类型定义导出

```typescript
// src/types/database.ts
import { Website, Finding, MonitorLog, WebsiteStatus, MonitorStatus } from '@prisma/client';

// 扩展类型
export type WebsiteWithFindings = Website & {
  findings: Finding[];
  _count?: {
    findings: number;
  };
};

export type FindingWithWebsite = Finding & {
  website: Website;
};

// 导出基础类型
export type { Website, Finding, MonitorLog, WebsiteStatus, MonitorStatus };
```

---

这就是完整的数据库设计！接下来创建API设计文档...
