import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return '今天';
    if (absDays === 1) return '昨天';
    return `${absDays}天前`;
  } else {
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    return `${diffDays}天后`;
  }
}

/**
 * 难度等级标签
 */
export function getDifficultyLabel(difficulty: number): string {
  const labels: Record<number, string> = {
    1: '入门',
    2: '简单',
    3: '中等',
    4: '困难',
    5: '高级',
  };
  return labels[difficulty] || '未知';
}

/**
 * 难度颜色
 */
export function getDifficultyColor(difficulty: number): string {
  const colors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
  };
  return colors[difficulty] || 'bg-gray-100 text-gray-800';
}
