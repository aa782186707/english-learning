'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getDifficultyColor, getDifficultyLabel } from '@/lib/utils';
import type { Grammar, LearningProgress, ReviewQuality } from '@/types';
import { qualityDescriptions, getQualityColor } from '@/lib/spaced-repetition';
import { Eye, EyeOff, BookOpen } from 'lucide-react';

interface GrammarCardProps {
  grammar: Grammar;
  progress?: LearningProgress | null;
  mode: 'learn' | 'review' | 'view';
  onReview?: (quality: ReviewQuality) => void;
}

export function GrammarCard({ grammar, progress, mode, onReview }: GrammarCardProps) {
  const [showExplanation, setShowExplanation] = useState(mode === 'view');
  const [showExamples, setShowExamples] = useState(mode === 'view');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-2xl font-bold">{grammar.title}</CardTitle>
            </div>
          </div>
          <Badge className={getDifficultyColor(grammar.difficulty)}>
            {getDifficultyLabel(grammar.difficulty)}
          </Badge>
        </div>
        {grammar.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {grammar.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 解释区域 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-muted-foreground">语法解释</h4>
            {mode !== 'view' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExplanation(!showExplanation)}
              >
                {showExplanation ? (
                  <EyeOff className="h-4 w-4 mr-1" />
                ) : (
                  <Eye className="h-4 w-4 mr-1" />
                )}
                {showExplanation ? '隐藏' : '显示'}
              </Button>
            )}
          </div>
          <div
            className={cn(
              'p-4 rounded-lg bg-muted transition-all prose prose-sm max-w-none',
              !showExplanation && 'blur-md select-none'
            )}
          >
            <div className="whitespace-pre-wrap">{grammar.explanation}</div>
          </div>
        </div>

        {/* 例句区域 */}
        {grammar.examples.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm text-muted-foreground">
                示例
              </h4>
              {mode !== 'view' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExamples(!showExamples)}
                >
                  {showExamples ? (
                    <EyeOff className="h-4 w-4 mr-1" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1" />
                  )}
                  {showExamples ? '隐藏' : '显示'}
                </Button>
              )}
            </div>
            <div
              className={cn(
                'space-y-2 transition-all',
                !showExamples && 'blur-md select-none'
              )}
            >
              {grammar.examples.map((example, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-green-50 border border-green-200"
                >
                  <p className="text-sm">{example}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 笔记 */}
        {grammar.notes && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">笔记</h4>
            <p className="p-3 rounded-lg bg-blue-50 text-sm">{grammar.notes}</p>
          </div>
        )}

        {/* 复习评分按钮 */}
        {mode === 'review' && showExplanation && onReview && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium text-sm text-center text-muted-foreground">
              你掌握这个语法点了吗？
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2, 3, 4, 5] as ReviewQuality[]).map((quality) => (
                <Button
                  key={quality}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-auto py-2 flex flex-col',
                    getQualityColor(quality),
                    'text-white border-0 hover:opacity-90'
                  )}
                  onClick={() => onReview(quality)}
                >
                  <span className="text-lg font-bold">{quality}</span>
                  <span className="text-xs">{qualityDescriptions[quality]}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 学习模式下的按钮 */}
        {mode === 'learn' && !showExplanation && (
          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => {
                setShowExplanation(true);
                setShowExamples(true);
              }}
            >
              显示答案
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
