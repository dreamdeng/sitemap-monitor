# 登录信息和快速访问

## 🔐 登录信息

**登录地址：** http://localhost:3001/login

**登录密码：** `sitemap_admin_2024`

---

## 🚀 快速访问链接

### 主要功能页面

| 功能 | 地址 | 说明 |
|------|------|------|
| 登录页面 | http://localhost:3001/login | 首次访问需要登录 |
| 仪表盘 | http://localhost:3001/dashboard | 查看统计数据 |
| 网站管理 | http://localhost:3001/websites | 添加和管理网站 |
| 新发现 | http://localhost:3001/findings | 浏览发现的内容 |

---

## 📊 系统配置

**数据库：**
- 主机：124.156.206.90
- 端口：5432
- 数据库：sitemap
- 用户：n8n

**管理密码：**
- ADMIN_PASSWORD=sitemap_admin_2024

**Cron 密钥：**
- CRON_SECRET=cron_secret_sitemap_2024_xyz

---

## 🧪 测试网站推荐

添加这些网站进行测试：

### 1. Poki
- 名称：Poki
- Sitemap URL：https://poki.com/sitemap.xml
- 说明：大型游戏网站，内容丰富

### 2. CrazyGames
- 名称：CrazyGames
- Sitemap URL：https://www.crazygames.com/sitemap.xml
- 说明：游戏平台，更新频繁

### 3. Y8
- 名称：Y8
- Sitemap URL：https://www.y8.com/sitemap.xml
- 说明：老牌游戏网站

---

## ⚡ 快速开始步骤

1. **启动服务（如果未运行）**
   ```bash
   cd /mnt/d/workspace/sitemap-monitor
   npm run dev
   ```

2. **访问系统**
   - 打开浏览器
   - 访问：http://localhost:3001
   - 输入密码：sitemap_admin_2024

3. **添加第一个网站**
   - 点击"网站管理"
   - 点击"添加网站"
   - 填写：
     - 名称：Poki
     - URL：https://poki.com/sitemap.xml
   - 点击"添加网站"

4. **执行监控**
   - 点击网站旁边的"监控"按钮
   - 等待1-2分钟

5. **查看结果**
   - 点击"新发现"
   - 查看抓取到的新内容

---

## 📝 开发命令

```bash
# 启动开发服务器
npm run dev

# 生成 Prisma Client
npx prisma generate

# 同步数据库结构
npx prisma db push

# 查看数据库（图形界面）
npx prisma studio

# 安装依赖
npm install

# 构建生产版本
npm run build

# 运行生产版本
npm run start
```

---

## 🔧 故障排查

### 无法访问系统？
```bash
# 检查服务是否运行
# 应该看到：✓ Ready in X.Xs

# 检查端口
# 默认 3000，如果被占用会使用 3001
```

### 无法连接数据库？
```bash
# 检查 .env 文件中的数据库配置
# DATABASE_URL="postgresql://n8n:sitemap_pw_2024@124.156.206.90:5432/sitemap"
```

### 监控失败？
```bash
# 检查网络连接
# 确认 sitemap URL 可以在浏览器中打开
# 查看服务器终端的错误日志
```

---

## 📖 文档索引

- **使用手册：** `使用手册.md` - 详细的功能说明和操作指南
- **项目状态：** `PROJECT_STATUS.md` - 项目完成情况和技术细节
- **README：** `README.md` - 项目概述和快速开始

---

**保存此文件以便快速查找登录信息！**
