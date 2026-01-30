'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, getDifficultyColor, getDifficultyLabel } from '@/lib/utils';
import type { Word, LearningProgress, ReviewQuality } from '@/types';
import { qualityDescriptions, getQualityColor } from '@/lib/spaced-repetition';
import {
  Volume2,
  Eye,
  EyeOff,
  Lightbulb,
  ChevronRight,
  Sparkles,
  BookOpen,
  Link2,
  ImageIcon
} from 'lucide-react';

interface WordCardProps {
  word: Word;
  progress?: LearningProgress | null;
  mode: 'learn' | 'review' | 'view';
  onReview?: (quality: ReviewQuality) => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalCount?: number;
}

export function WordCard({
  word,
  progress,
  mode,
  onReview,
  onNext,
  onPrev,
  currentIndex,
  totalCount
}: WordCardProps) {
  const [showAnswer, setShowAnswer] = useState(mode === 'view');
  const [showMemoryTips, setShowMemoryTips] = useState(false);

  // 当单词变化时重置状态
  useEffect(() => {
    if (mode !== 'view') {
      setShowAnswer(false);
      setShowMemoryTips(false);
    }
  }, [word.id, mode]);

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'view') return;

      // 空格键显示答案
      if (e.code === 'Space' && !showAnswer) {
        e.preventDefault();
        setShowAnswer(true);
      }

      // 数字键评分 (1-6 对应 0-5)
      if (showAnswer && onReview) {
        const keyMap: Record<string, ReviewQuality> = {
          'Digit1': 0, 'Digit2': 1, 'Digit3': 2,
          'Digit4': 3, 'Digit5': 4, 'Digit6': 5,
        };
        if (keyMap[e.code] !== undefined) {
          onReview(keyMap[e.code]);
        }
      }

      // 左右箭头切换（view模式）
      if (mode === 'view') {
        if (e.code === 'ArrowLeft' && onPrev) onPrev();
        if (e.code === 'ArrowRight' && onNext) onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, showAnswer, onReview, onNext, onPrev]);

  const hasMemoryTips = word.memory_tips && (
    word.memory_tips.association ||
    word.memory_tips.word_root ||
    word.memory_tips.mnemonic ||
    word.memory_tips.image_hint ||
    (word.memory_tips.similar_words && word.memory_tips.similar_words.length > 0)
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold">{word.word}</CardTitle>
            {word.phonetic && (
              <p className="text-lg text-muted-foreground">{word.phonetic}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleSpeak} title="发音">
              <Volume2 className="h-5 w-5" />
            </Button>
            <Badge className={getDifficultyColor(word.difficulty)}>
              {getDifficultyLabel(word.difficulty)}
            </Badge>
          </div>
        </div>
        {word.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {word.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 未显示答案时的提示 */}
        {!showAnswer && mode !== 'view' && (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">你还记得这个单词的意思吗？</p>
            <Button
              size="lg"
              onClick={() => setShowAnswer(true)}
              className="min-w-[200px]"
            >
              <Eye className="h-5 w-5 mr-2" />
              显示答案
            </Button>
            <p className="text-xs text-muted-foreground mt-2">按 空格键 快速显示</p>
          </div>
        )}

        {/* 答案区域 */}
        {showAnswer && (
          <>
            {/* 释义 */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                释义
              </h4>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-lg">{word.meaning}</p>
              </div>
            </div>

            {/* 例句 */}
            {word.example_sentences.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">例句</h4>
                <div className="space-y-2">
                  {word.example_sentences.map((sentence, index) => (
                    <p
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 text-sm italic"
                    >
                      {sentence}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 记忆技巧区域 */}
            {(hasMemoryTips || word.notes) && (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMemoryTips(!showMemoryTips)}
                  className="w-full justify-between"
                >
                  <span className="flex items-center gap-1">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    记忆技巧
                  </span>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    showMemoryTips && "rotate-90"
                  )} />
                </Button>

                {showMemoryTips && (
                  <div className="space-y-3 p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                    {/* 联想记忆 */}
                    {word.memory_tips?.association && (
                      <div className="flex gap-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-purple-700">联想记忆</p>
                          <p className="text-sm">{word.memory_tips.association}</p>
                        </div>
                      </div>
                    )}

                    {/* 词根词缀 */}
                    {word.memory_tips?.word_root && (
                      <div className="flex gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-blue-700">词根词缀</p>
                          <p className="text-sm">{word.memory_tips.word_root}</p>
                        </div>
                      </div>
                    )}

                    {/* 谐音/口诀 */}
                    {word.memory_tips?.mnemonic && (
                      <div className="flex gap-2">
                        <Volume2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-green-700">谐音/口诀</p>
                          <p className="text-sm">{word.memory_tips.mnemonic}</p>
                        </div>
                      </div>
                    )}

                    {/* 画面联想 */}
                    {word.memory_tips?.image_hint && (
                      <div className="flex gap-2">
                        <ImageIcon className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-pink-700">画面联想</p>
                          <p className="text-sm">{word.memory_tips.image_hint}</p>
                        </div>
                      </div>
                    )}

                    {/* 形近词 */}
                    {word.memory_tips?.similar_words && word.memory_tips.similar_words.length > 0 && (
                      <div className="flex gap-2">
                        <Link2 className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-orange-700">相关词汇</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {word.memory_tips.similar_words.map((w, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 笔记 */}
                    {word.notes && (
                      <div className="flex gap-2 pt-2 border-t border-yellow-200">
                        <div>
                          <p className="text-xs font-medium text-gray-600">补充笔记</p>
                          <p className="text-sm text-gray-700">{word.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 复习评分按钮 */}
            {mode === 'review' && onReview && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm text-center text-muted-foreground">
                  你记得这个单词吗？选择记忆程度
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
                <p className="text-xs text-center text-muted-foreground">
                  按数字键 1-6 快速评分
                </p>
              </div>
            )}
          </>
        )}

        {/* view 模式下的导航按钮 */}
        {mode === 'view' && onNext && onPrev && (
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onPrev}>
              ← 上一个
            </Button>
            <Button variant="outline" onClick={onNext}>
              下一个 →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
