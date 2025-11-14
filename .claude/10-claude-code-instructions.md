# 10 - Claude Code开发指令（直接执行）

## 📋 说明
将以下指令依次复制粘贴到Claude Code中执行。每个步骤都是完整的，无需修改。

---

## Phase 1: 项目初始化

### 步骤1.1: 创建T3项目

```
请帮我创建一个新的Next.js项目，使用T3 Stack：

1. 运行命令：
   npx create-t3-app@latest sitemap-monitor

2. 选择以下选项：
   - TypeScript: Yes
   - App Router: Yes  
   - Tailwind CSS: Yes
   - tRPC: Yes
   - Prisma: Yes
   - NextAuth: No (我们用自定义认证)
   - Database Provider: PostgreSQL

3. 安装额外依赖：
   npm install zod p-limit node-html-parser xlsx cheerio
   npm install -D @types/node
```

---

### 步骤1.2: 配置环境变量

```
创建 .env 文件，内容如下：

# Database (Supabase)
DATABASE_URL="postgresql://user:password@host:port/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:port/database"

# Admin Password
ADMIN_PASSWORD="your_secure_password_here"

# Vercel Cron Secret
CRON_SECRET="your_random_secret_here"

# Next.js
NEXTAUTH_SECRET="generate_a_random_secret"
NEXTAUTH_URL="http://localhost:3000"

注意：
1. DATABASE_URL 和 DIRECT_URL 需要替换为 Supabase 提供的连接字符串
2. ADMIN_PASSWORD 是登录系统的密码，请设置一个强密码
3. CRON_SECRET 用于保护 Vercel Cron 端点
4. 这个文件不要提交到 git
```

创建 `.env.example` 文件作为模板：
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
ADMIN_PASSWORD=""
CRON_SECRET=""
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"
```

---

### 步骤1.3: 配置 Prisma Schema

```
替换 prisma/schema.prisma 文件内容为：

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Website {
  id             String        @id @default(cuid())
  name           String
  sitemapUrl     String        @unique @map("sitemap_url")
  status         WebsiteStatus @default(ACTIVE)
  lastUrls       Json          @default("[]") @map("last_urls")
  totalUrls      Int           @default(0) @map("total_urls")
  lastCheckTime  DateTime?     @map("last_check_time")
  checkFrequency Int           @default(12) @map("check_frequency")
  createdAt      DateTime      @default(now()) @map("created_at")
  updatedAt      DateTime      @updatedAt @map("updated_at")
  
  findings    Finding[]
  monitorLogs MonitorLog[]
  
  @@map("websites")
  @@index([status])
  @@index([lastCheckTime])
}

enum WebsiteStatus {
  ACTIVE
  PAUSED
}

model Finding {
  id          String   @id @default(cuid())
  websiteId   String   @map("website_id")
  url         String
  title       String   @default("")
  description String   @default("") @db.Text
  keywords    String   @default("") @db.Text
  h1          String   @default("")
  isRead      Boolean  @default(false) @map("is_read")
  foundAt     DateTime @default(now()) @map("found_at")
  
  website Website @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  
  @@unique([websiteId, url])
  @@map("findings")
  @@index([websiteId])
  @@index([foundAt])
  @@index([isRead])
}

model MonitorLog {
  id              String        @id @default(cuid())
  websiteId       String?       @map("website_id")
  status          MonitorStatus @default(SUCCESS)
  newCount        Int           @default(0) @map("new_count")
  errorMessage    String?       @map("error_message") @db.Text
  durationSeconds Int           @default(0) @map("duration_seconds")
  executedAt      DateTime      @default(now()) @map("executed_at")
  
  website Website? @relation(fields: [websiteId], references: [id], onDelete: SetNull)
  
  @@map("monitor_logs")
  @@index([websiteId])
  @@index([executedAt])
  @@index([status])
}

enum MonitorStatus {
  SUCCESS
  FAILED
  PARTIAL
}

执行完成后运行：
npx prisma generate
npx prisma db push

这将创建数据库表结构。
```

---

## Phase 2: 监控服务层开发

### 步骤2.1: 创建监控服务基础结构

```
创建以下文件和目录结构：

src/server/services/monitor/
├── sitemap-fetcher.ts
├── sitemap-parser.ts
├── page-fetcher.ts
├── metadata-extractor.ts
├── url-comparator.ts
└── monitor-orchestrator.ts

每个文件的内容我将在后续步骤中提供。
```

---

### 步骤2.2: 实现 Sitemap Fetcher

```
创建文件 src/server/services/monitor/sitemap-fetcher.ts：

/**
 * Sitemap抓取器
 * 负责抓取sitemap.xml内容
 */

const REQUEST_TIMEOUT = 30000;
const RETRY_TIMES = 3;

export class SitemapFetcher {
  /**
   * 抓取sitemap内容
   * @param url Sitemap URL
   * @returns XML字符串
   */
  async fetch(url: string): Promise<string | null> {
    for (let attempt = 0; attempt < RETRY_TIMES; attempt++) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SitemapMonitor/1.0)'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.text();
      } catch (error) {
        console.warn(`Fetch attempt ${attempt + 1} failed for ${url}:`, error);
        
        if (attempt < RETRY_TIMES - 1) {
          await this.sleep(1000 * (attempt + 1));
        }
      }
    }
    
    console.error(`Failed to fetch ${url} after ${RETRY_TIMES} attempts`);
    return null;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

### 步骤2.3: 实现 Sitemap Parser

```
创建文件 src/server/services/monitor/sitemap-parser.ts：

/**
 * Sitemap解析器
 * 负责解析XML并提取URL列表
 */

import { parseString } from 'xml2js';

interface SitemapUrl {
  loc: string[];
  lastmod?: string[];
}

export class SitemapParser {
  /**
   * 解析sitemap XML
   * @param xml XML字符串
   * @returns URL数组
   */
  async parse(xml: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      parseString(xml, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          // 检查是否是sitemap索引
          if (result.sitemapindex) {
            const subsitemaps = result.sitemapindex.sitemap || [];
            const urls = subsitemaps.map((s: any) => s.loc[0]);
            resolve(urls);
            return;
          }
          
          // 普通sitemap
          if (result.urlset && result.urlset.url) {
            const urls = result.urlset.url.map((u: SitemapUrl) => u.loc[0]);
            resolve(urls);
            return;
          }
          
          resolve([]);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  
  /**
   * 判断URL是否是sitemap索引
   */
  isSitemapUrl(url: string): boolean {
    return url.toLowerCase().includes('sitemap') && url.endsWith('.xml');
  }
}
```

---

### 步骤2.4: 实现 Page Fetcher

```
创建文件 src/server/services/monitor/page-fetcher.ts：

/**
 * 页面抓取器
 * 负责抓取页面HTML内容
 */

import pLimit from 'p-limit';

const MAX_CONCURRENT = 20;
const REQUEST_TIMEOUT = 30000;

export class PageFetcher {
  private limiter = pLimit(MAX_CONCURRENT);
  
  /**
   * 并发抓取多个页面
   * @param urls URL数组
   * @returns HTML内容数组
   */
  async fetchMultiple(urls: string[]): Promise<Array<{ url: string; html: string | null }>> {
    const tasks = urls.map(url => 
      this.limiter(() => this.fetchSingle(url))
    );
    
    return Promise.all(tasks);
  }
  
  /**
   * 抓取单个页面
   */
  private async fetchSingle(url: string): Promise<{ url: string; html: string | null }> {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        return { url, html: null };
      }
      
      const html = await response.text();
      return { url, html };
    } catch (error) {
      console.error(`Failed to fetch page ${url}:`, error);
      return { url, html: null };
    }
  }
}
```

---

### 步骤2.5: 实现 Metadata Extractor

```
创建文件 src/server/services/monitor/metadata-extractor.ts：

/**
 * 元数据提取器
 * 负责从HTML中提取Title、Description、Keywords
 */

import * as cheerio from 'cheerio';

export interface PageMetadata {
  title: string;
  description: string;
  keywords: string;
  h1: string;
}

export class MetadataExtractor {
  /**
   * 从HTML提取元数据
   */
  extract(html: string): PageMetadata {
    const $ = cheerio.load(html);
    
    // 提取Title
    let title = $('title').text().trim();
    title = this.cleanTitle(title);
    
    // 提取Description
    const description = this.extractDescription($);
    
    // 提取Keywords
    const keywords = this.extractKeywords($, title);
    
    // 提取H1
    const h1 = $('h1').first().text().trim();
    
    return {
      title: title || 'No Title',
      description,
      keywords,
      h1
    };
  }
  
  /**
   * 清理Title（去除网站名称后缀）
   */
  private cleanTitle(title: string): string {
    const patterns = [
      /\s*[-|]\s*Play\s+Online.*$/i,
      /\s*[-|]\s*Free\s+Game.*$/i,
      /\s*[-|]\s*Poki\s*$/i,
      /\s*[-|]\s*CrazyGames\s*$/i,
      /\s*[-|]\s*Play\s+Free.*$/i,
    ];
    
    let cleaned = title;
    patterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });
    
    return cleaned.trim();
  }
  
  /**
   * 提取Description
   */
  private extractDescription($: cheerio.CheerioAPI): string {
    const desc = $('meta[name="description"]').attr('content') ||
                 $('meta[property="og:description"]').attr('content') ||
                 '';
    
    return desc.trim().slice(0, 500);
  }
  
  /**
   * 提取Keywords
   */
  private extractKeywords($: cheerio.CheerioAPI, title: string): string {
    let keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // 如果没有keywords，从title生成
    if (!keywords && title && title !== 'No Title') {
      const words = title.split(/\s+/).slice(0, 5);
      keywords = words.join(', ');
    }
    
    return keywords.trim().slice(0, 200);
  }
}
```

---

继续下一部分
