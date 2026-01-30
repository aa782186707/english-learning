# 部署指南

## 快速部署步骤

### 1. 创建 Supabase 项目

1. 访问 https://supabase.com 并登录（推荐用 GitHub 账号）
2. 点击 **New Project**
3. 填写：
   - Project name: `english-learning`
   - Database Password: 设置一个强密码
   - Region: 选择 **Singapore** 或 **Northeast Asia (Tokyo)**
4. 点击 **Create new project**，等待约 2 分钟

### 2. 初始化数据库

1. 在 Supabase 控制台，点击左侧 **SQL Editor**
2. 点击 **New query**
3. 复制 `supabase/migrations/002_simple_schema.sql` 文件的全部内容并粘贴
4. 点击 **Run** 执行

成功后你会看到表已创建，并且有 3 个示例单词和 2 个语法点。

### 3. 获取 API 密钥

1. 在 Supabase 控制台，点击左侧 **Project Settings**（齿轮图标）
2. 点击 **API**
3. 记下以下信息：
   - **Project URL**: `https://xxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`（这是公开密钥，可以暴露）

### 4. 部署到 Vercel

#### 方法 A：一键部署（推荐）

1. 将代码推送到 GitHub:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/english-learning.git
   git push -u origin main
   ```

2. 访问 https://vercel.com 并登录（用 GitHub 账号）

3. 点击 **Add New** → **Project**

4. 选择你的 `english-learning` 仓库

5. 在 **Environment Variables** 中添加：

   - `NEXT_PUBLIC_SUPABASE_URL` = 你的 Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon public key

6. 点击 **Deploy**

7. 等待部署完成，你会得到一个域名如 `english-learning-xxx.vercel.app`

#### 方法 B：Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署（会提示输入环境变量）
vercel --prod
```

### 5. 配置自定义域名（可选）

1. 在 Vercel 项目设置中，点击 **Domains**
2. 添加你的域名
3. 按照提示配置 DNS

## 本地开发

```bash
# 复制环境变量文件
cp .env.local.example .env.local

# 编辑 .env.local，填入 Supabase 密钥
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# 启动开发服务器
npm run dev
```

## 多设备同步

部署完成后，数据存储在 Supabase 云端数据库中：

- 在任何设备上访问你的域名即可
- 数据自动同步，无需手动操作
- 支持同时在多个设备上使用

## AI 添加内容

配置好 Supabase 后，你可以在 Cursor 中对我说：

> "帮我添加单词 meticulous 到数据库"

我会直接通过 Supabase API 添加到云端数据库，所有设备都能立即看到。

## 常见问题

### Q: 数据显示"本地数据"而不是"云端同步"？

检查环境变量是否正确配置。在 Vercel 中：

1. 进入项目设置 → Environment Variables
2. 确保两个变量都已添加
3. 重新部署：点击 Deployments → 选择最新部署 → Redeploy

### Q: 如何备份数据？

在 Supabase 控制台：

1. 点击 **Table Editor**
2. 选择表（如 words）
3. 点击 **Export** 导出为 CSV

### Q: 免费额度够用吗？

Supabase 免费计划包含：

- 500MB 数据库存储
- 1GB 文件存储
- 50,000 月活用户

对于个人学习应用完全够用。
