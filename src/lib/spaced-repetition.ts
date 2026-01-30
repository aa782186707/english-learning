import type { ReviewQuality, LearningProgress } from '@/types';

/**
 * SM-2 间隔重复算法
 * 基于 SuperMemo 2 算法实现
 * 
 * 参考: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 */

export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
}

/**
 * 计算下次复习时间
 * @param quality 复习质量评分 (0-5)
 * @param currentEaseFactor 当前简易度因子
 * @param currentInterval 当前间隔天数
 * @param currentRepetitions 当前重复次数
 */
export function calculateNextReview(
  quality: ReviewQuality,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 1,
  currentRepetitions: number = 0
): SM2Result {
  // 质量评分小于3表示回答错误，需要重新开始
  if (quality < 3) {
    return {
      easeFactor: Math.max(1.3, currentEaseFactor - 0.2),
      intervalDays: 1,
      repetitions: 0,
      nextReviewAt: addDays(new Date(), 1),
    };
  }

  // 计算新的简易度因子
  // EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
  const newEaseFactor = Math.max(
    1.3,
    currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // 计算新的间隔
  let newInterval: number;
  const newRepetitions = currentRepetitions + 1;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentInterval * newEaseFactor);
  }

  // 最大间隔限制为 365 天
  newInterval = Math.min(newInterval, 365);

  return {
    easeFactor: newEaseFactor,
    intervalDays: newInterval,
    repetitions: newRepetitions,
    nextReviewAt: addDays(new Date(), newInterval),
  };
}

/**
 * 从学习进度记录计算下次复习
 */
export function calculateFromProgress(
  progress: LearningProgress | null,
  quality: ReviewQuality
): SM2Result {
  if (!progress) {
    return calculateNextReview(quality);
  }

  return calculateNextReview(
    quality,
    progress.ease_factor,
    progress.interval_days,
    progress.repetitions
  );
}

/**
 * 获取今天需要复习的项目
 */
export function isDueForReview(nextReviewAt: string | Date): boolean {
  const reviewDate = new Date(nextReviewAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate <= today;
}

/**
 * 计算距离下次复习的天数
 */
export function daysUntilReview(nextReviewAt: string | Date): number {
  const reviewDate = new Date(nextReviewAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  reviewDate.setHours(0, 0, 0, 0);

  const diffTime = reviewDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 辅助函数：添加天数
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 评分描述
 */
export const qualityDescriptions: Record<ReviewQuality, string> = {
  0: '完全忘记',
  1: '错误，但看到答案后记起',
  2: '错误，但答案很熟悉',
  3: '正确，但很费力',
  4: '正确，有些犹豫',
  5: '完美记忆',
};

/**
 * 获取评分对应的颜色
 */
export function getQualityColor(quality: ReviewQuality): string {
  const colors: Record<ReviewQuality, string> = {
    0: 'bg-red-500',
    1: 'bg-orange-500',
    2: 'bg-yellow-500',
    3: 'bg-lime-500',
    4: 'bg-green-500',
    5: 'bg-emerald-500',
  };
  return colors[quality];
}
