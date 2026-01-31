'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExerciseCard } from '@/components/exercise-card';
import { Trophy } from 'lucide-react';
import type { Exercise, ExerciseStats } from '@/types';

interface ExercisePracticeProps {
  exercises: Exercise[];
  onBack: () => void;
  onGoToGrammar: () => void;
}

export function ExercisePractice({ exercises, onBack, onGoToGrammar }: ExercisePracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledExercises] = useState(() => 
    [...exercises].sort(() => Math.random() - 0.5)
  );
  const [stats, setStats] = useState<ExerciseStats>({
    total: 0,
    correct: 0,
    accuracy: 0,
  });

  const currentExercise = shuffledExercises[currentIndex];

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setStats(prev => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      accuracy: Math.round(((prev.correct + (isCorrect ? 1 : 0)) / (prev.total + 1)) * 100),
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentIndex < shuffledExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, shuffledExercises.length]);

  const handleRestart = useCallback(() => {
    setStats({ total: 0, correct: 0, accuracy: 0 });
    setCurrentIndex(0);
  }, []);

  // 完成所有题目
  if (currentIndex >= shuffledExercises.length - 1 && stats.total > 0 && stats.total === currentIndex + 1) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={onBack}>
          ← 返回题库
        </Button>
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold">练习完成！</h2>
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">总题数</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500">{stats.correct}</div>
                  <div className="text-sm text-muted-foreground">答对</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-blue-500">{stats.accuracy}%</div>
                  <div className="text-sm text-muted-foreground">正确率</div>
                </div>
              </div>
              <div className="pt-4">
                {stats.accuracy >= 80 ? (
                  <p className="text-green-600">太棒了！你掌握得很好！</p>
                ) : stats.accuracy >= 60 ? (
                  <p className="text-yellow-600">不错，继续加油！</p>
                ) : (
                  <p className="text-orange-600">还需要多复习一下哦！</p>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={onGoToGrammar}>
                复习语法
              </Button>
              <Button className="flex-1" onClick={handleRestart}>
                再来一次
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← 返回题库
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm">
            {currentIndex + 1} / {shuffledExercises.length}
          </Badge>
          {stats.total > 0 && (
            <Badge variant="secondary" className="text-sm">
              正确率: {stats.accuracy}%
            </Badge>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / shuffledExercises.length) * 100}%` }}
        />
      </div>

      <ExerciseCard
        key={currentExercise.id}
        exercise={currentExercise}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />
    </div>
  );
}
