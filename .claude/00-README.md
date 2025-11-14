# Sitemap监控平台 - 完整开发文档包

## 🎯 项目概述

这是一个完整的SaaS产品开发文档包，用于在Claude Code中快速开发Sitemap监控平台。

**项目特点：**
- ✅ 基于Next.js 14 + T3 Stack
- ✅ TypeScript全栈类型安全
- ✅ Supabase PostgreSQL数据库
- ✅ 监控逻辑从Python迁移到TypeScript
- ✅ Vercel一键部署
- ✅ 简单密码保护
- ✅ 完整的开发指令（可直接复制执行）

---

## 📚 文档目录

### 核心开发文档

| 文档 | 说明 | 重要程度 |
|------|------|----------|
| `01-architecture.md` | 项目架构和技术栈说明 | ⭐⭐⭐⭐⭐ |
| `02-database-schema.md` | 完整的Prisma Schema设计 | ⭐⭐⭐⭐⭐ |
| `03-api-design.md` | tRPC API接口设计 | ⭐⭐⭐⭐⭐ |
| `10-claude-code-instructions.md` | **Claude Code开发指令（最重要）** | ⭐⭐⭐⭐⭐ |

### 参考文档

| 文档 | 说明 |
|------|------|
| `COMPARISON.md` | 第一版vs精简版对比 |
| `DATABASE-OPTIONS.md` | 数据库选项说明 |
| `DEPLOY-TENCENT.md` | 腾讯云部署指南 |
| `IMPROVEMENTS.md` | 功能改进说明 |
| `QUICK-START.md` | Python脚本快速开始 |
| `README-SIMPLIFIED.md` | 精简版说明 |
| `USAGE-MULTITHREAD.md` | 多线程版本使用指南 |

---

## 🚀 快速开始

### 方式1: 使用Claude Code（推荐）

1. **打开Claude Code**
2. **复制并执行** `10-claude-code-instructions.md` 中的指令
3. **按步骤执行**，无需任何修改
4. **4-6天完成MVP**

### 方式2: 手动开发

1. 阅读 `01-architecture.md` 了解整体架构
2. 参考 `02-database-schema.md` 创建数据库
3. 参考 `03-api-design.md` 开发API
4. 逐步实现功能

---

## 📋 开发清单

### Phase 1: 基础搭建（Day 1）
- [ ] 使用create-t3-app初始化项目
- [ ] 配置环境变量
- [ ] 配置Prisma Schema
- [ ] 创建数据库表
- [ ] 配置Supabase连接

### Phase 2: 监控服务层（Day 2）
- [ ] 实现SitemapFetcher
- [ ] 实现SitemapParser
- [ ] 实现PageFetcher
- [ ] 实现MetadataExtractor
- [ ] 实现URLComparator
- [ ] 实现MonitorOrchestrator

### Phase 3: tRPC API（Day 3）
- [ ] Website Router (网站管理API)
- [ ] Finding Router (新发现API)
- [ ] Monitor Router (监控执行API)
- [ ] Dashboard Router (仪表盘API)
- [ ] Export Router (导出API)

### Phase 4: 认证中间件（Day 3）
- [ ] 实现密码保护中间件
- [ ] 创建登录页面
- [ ] Cookie管理

### Phase 5: 前端页面（Day 4-5）
- [ ] Dashboard页面
- [ ] 网站管理页面
- [ ] 新发现列表页面
- [ ] 设置页面
- [ ] 导出功能

### Phase 6: Vercel Cron（Day 6）
- [ ] 创建Cron API端点
- [ ] 配置vercel.json
- [ ] 测试定时任务

### Phase 7: 测试部署（Day 7）
- [ ] 本地测试
- [ ] 部署到Vercel
- [ ] 配置环境变量
- [ ] 测试生产环境

---

## 🛠️ 技术栈

### 前端
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- Shadcn/ui

### 后端
- Next.js API Routes
- tRPC (类型安全API)
- Prisma ORM
- Zod (数据验证)

### 数据库
- Supabase PostgreSQL

### 部署
- Vercel (前端+API)
- Vercel Cron (定时任务)

### 工具库
- p-limit (并发控制)
- cheerio (HTML解析)
- xml2js (XML解析)
- xlsx (Excel导出)

---

## 📂 项目结构

```
sitemap-monitor/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 需要认证的路由
│   │   │   ├── dashboard/
│   │   │   ├── websites/
│   │   │   ├── findings/
│   │   │   └── settings/
│   │   ├── login/             # 登录页面
│   │   └── api/
│   │       ├── trpc/          # tRPC handler
│   │       └── cron/          # Vercel Cron端点
│   │
│   ├── components/            # React组件
│   │   ├── ui/               # 基础UI组件
│   │   ├── dashboard/
│   │   ├── websites/
│   │   ├── findings/
│   │   └── layout/
│   │
│   ├── server/               # 服务端代码
│   │   ├── api/             # tRPC API
│   │   │   └── routers/
│   │   ├── services/        # 业务逻辑
│   │   │   ├── monitor/    # 监控服务
│   │   │   └── export/     # 导出服务
│   │   └── db.ts           # Prisma client
│   │
│   ├── lib/                 # 工具库
│   ├── types/              # 类型定义
│   └── middleware.ts       # 认证中间件
│
├── prisma/
│   ├── schema.prisma       # 数据库Schema
│   └── seed.ts            # 种子数据
│
├── .env                   # 环境变量
├── next.config.mjs       # Next.js配置
├── vercel.json          # Vercel部署配置
└── package.json
```

---

## ⚙️ 环境变量

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Admin Password
ADMIN_PASSWORD="your_password"

# Vercel Cron Secret
CRON_SECRET="random_secret"

# Next.js
NEXTAUTH_SECRET="random_secret"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🎯 MVP功能范围

### ✅ 包含的功能
1. 网站管理（添加/编辑/删除/批量导入）
2. 自动监控（Vercel Cron每天09:00和21:00）
3. 手动触发监控
4. 新发现列表（分页/筛选/搜索）
5. Dashboard数据统计
6. CSV/Excel导出
7. 简单密码保护

### ❌ 不包含的功能（V2）
- 多用户系统
- API开放
- Google Trends集成
- Webhook通知
- 高级分析
- 移动App

---

## 📊 开发时间预估

| 阶段 | 耗时 |
|------|------|
| 项目初始化 | 4小时 |
| 监控服务层 | 6小时 |
| tRPC API | 6小时 |
| 前端页面 | 18小时 |
| 测试部署 | 4小时 |
| **总计** | **38小时** |

**实际开发周期：4-6天**

---

## 🔗 相关链接

- [T3 Stack文档](https://create.t3.gg/)
- [Next.js文档](https://nextjs.org/docs)
- [Prisma文档](https://www.prisma.io/docs)
- [tRPC文档](https://trpc.io/)
- [Supabase文档](https://supabase.com/docs)
- [Vercel文档](https://vercel.com/docs)
- [Shadcn/ui组件](https://ui.shadcn.com/)

---

## 💡 核心设计理念

1. **类型安全** - 端到端TypeScript，tRPC保证API类型同步
2. **开发效率** - T3 Stack预配置最佳实践
3. **可维护性** - 清晰的目录结构和代码注释
4. **可扩展性** - 模块化设计，易于添加新功能
5. **性能优化** - 并发控制，数据库索引优化

---

## 🚨 重要提示

1. **环境变量** - 务必正确配置.env文件
2. **Supabase设置** - 确保获取正确的数据库连接字符串
3. **密码安全** - ADMIN_PASSWORD使用强密码
4. **Cron Secret** - CRON_SECRET要随机生成
5. **测试充分** - 部署前在本地充分测试

---

## 🎓 学习路径

如果你不熟悉某些技术栈，建议学习顺序：

1. **必须掌握** - TypeScript基础
2. **必须掌握** - React基础
3. **建议了解** - Next.js App Router
4. **建议了解** - Prisma ORM
5. **可以边学边做** - tRPC
6. **可以边学边做** - Tailwind CSS

---

## 📞 获取帮助

在开发过程中遇到问题：

1. 查看对应文档章节
2. 查看官方文档
3. 搜索相关issue
4. 询问Claude

---
