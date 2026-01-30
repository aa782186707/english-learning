# 英语学习助手

一个基于间隔重复算法的个人英语学习应用，支持 AI 协作维护学习内容。

## 功能特点

- **单词学习**: 添加、管理和复习英语单词
- **语法学习**: 整理和复习语法知识点
- **间隔重复**: 基于 SM-2 算法的智能复习计划
- **AI 协作**: 通过 Cursor AI 快速添加学习内容
- **学习统计**: 追踪学习进度和效果

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + TailwindCSS
- **后端**: Supabase (PostgreSQL + Auth + RLS)
- **算法**: SM-2 间隔重复算法

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 复制环境变量:
   ```bash
   cp .env.local.example .env.local
   ```
3. 填入你的 Supabase URL 和 Anon Key

### 3. 初始化数据库

在 Supabase SQL 编辑器中执行 `supabase/migrations/001_initial_schema.sql`

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## AI 协作使用

### 添加单词

在 Cursor 中对话:

> "今天学了 ubiquitous 这个词，帮我添加到学习库"

AI 会自动:

1. 生成音标、例句、词根分析
2. 添加到本地数据文件 `data/words.json`

### 使用管理脚本

```bash
# 添加单词
npx tsx scripts/manage-content.ts add-word \
  --word "ephemeral" \
  --meaning "短暂的" \
  --phonetic "/ɪˈfemərəl/" \
  --difficulty 4

# 添加语法
npx tsx scripts/manage-content.ts add-grammar \
  --title "虚拟语气" \
  --explanation "表示假设的语法结构..." \
  --difficulty 3

# 列出所有单词
npx tsx scripts/manage-content.ts list-words

# 搜索单词
npx tsx scripts/manage-content.ts search --query "un"
```

## 项目结构

```
english-learning/
├── src/
│   ├── app/                 # Next.js 页面
│   ├── components/          # React 组件
│   │   ├── ui/             # 基础 UI 组件
│   │   ├── word-card.tsx   # 单词卡片
│   │   └── grammar-card.tsx # 语法卡片
│   ├── lib/
│   │   ├── supabase.ts     # Supabase 客户端
│   │   ├── spaced-repetition.ts  # SM-2 算法
│   │   ├── data.ts         # 数据操作函数
│   │   └── utils.ts        # 工具函数
│   └── types/              # TypeScript 类型定义
├── data/
│   ├── words.json          # 本地单词数据
│   └── grammar.json        # 本地语法数据
├── scripts/
│   └── manage-content.ts   # AI 内容管理脚本
├── supabase/
│   └── migrations/         # 数据库迁移
└── .cursor/
    └── rules/              # Cursor AI 规则
```

## 数据存储

### 本地模式 (默认)

数据存储在 `data/` 目录下的 JSON 文件中，适合个人使用。

### 云端模式 (Supabase)

配置 Supabase 后，数据同步到云端，支持多设备访问。

## 间隔重复算法

使用 SM-2 算法计算复习间隔:

- **评分 0-2**: 忘记了，从头开始
- **评分 3**: 勉强记得，短间隔复习
- **评分 4**: 记得，正常间隔
- **评分 5**: 完美记忆，延长间隔

## 部署

### Vercel (推荐)

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 部署完成

## License

MIT
