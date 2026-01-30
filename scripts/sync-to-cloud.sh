#!/bin/bash
# 一键同步本地修改到云端
# 用法: ./scripts/sync-to-cloud.sh "提交信息"

cd "$(dirname "$0")/.."

MESSAGE="${1:-Update learning content}"

echo "📦 正在提交修改..."
git add -A
git commit -m "$MESSAGE"

echo "🚀 正在推送到 GitHub..."
git push

echo "✅ 完成！Vercel 将自动部署更新。"
echo "🌐 访问: https://english-learning-u8xy-xiaozengyus-projects.vercel.app"
