'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import type { Exercise, ExerciseType } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onAnswer?: (isCorrect: boolean) => void;
  onNext?: () => void;
  showResult?: boolean;
}

const typeLabels: Record<ExerciseType, string> = {
  choice: '选择题',
  fill: '填空题',
  judge: '判断题',
  translate: '翻译题',
};

const difficultyColors = [
  'bg-green-100 text-green-800',
  'bg-lime-100 text-lime-800',
  'bg-yellow-100 text-yellow-800',
  'bg-orange-100 text-orange-800',
  'bg-red-100 text-red-800',
];

export function ExerciseCard({ exercise, onAnswer, onNext }: ExerciseCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [fillAnswer, setFillAnswer] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // 重置状态
  const resetState = useCallback(() => {
    setSelectedAnswer('');
    setFillAnswer('');
    setIsSubmitted(false);
    setIsCorrect(false);
  }, []);

  // 当 exercise 变化时重置状态
  useEffect(() => {
    resetState();
  }, [exercise.id, resetState]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 已提交答案后，按 Enter 或空格进入下一题
      if (isSubmitted) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNext?.();
        }
        return;
      }

      // 选择题/判断题快捷键
      if (exercise.type === 'choice' && exercise.options) {
        const keyMap: Record<string, string> = {
          '1': 'A', '2': 'B', '3': 'C', '4': 'D',
          'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
        };
        if (keyMap[e.key.toLowerCase()]) {
          setSelectedAnswer(keyMap[e.key.toLowerCase()]);
        }
      }

      if (exercise.type === 'judge') {
        if (e.key === '1' || e.key.toLowerCase() === 'y') {
          setSelectedAnswer('正确');
        } else if (e.key === '2' || e.key.toLowerCase() === 'n') {
          setSelectedAnswer('错误');
        }
      }

      // Enter 提交答案
      if (e.key === 'Enter' && !isSubmitted) {
        if (exercise.type === 'choice' || exercise.type === 'judge') {
          if (selectedAnswer) {
            handleSubmit();
          }
        } else if (fillAnswer.trim()) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exercise, selectedAnswer, fillAnswer, isSubmitted, onNext]);

  const handleSubmit = () => {
    let userAnswer = '';
    let correct = false;

    if (exercise.type === 'choice') {
      userAnswer = selectedAnswer;
      correct = selectedAnswer === exercise.correct_answer;
    } else if (exercise.type === 'judge') {
      userAnswer = selectedAnswer;
      correct = selectedAnswer === exercise.correct_answer;
    } else if (exercise.type === 'fill' || exercise.type === 'translate') {
      userAnswer = fillAnswer.trim().toLowerCase();
      // 填空题和翻译题：忽略大小写和标点进行比较
      const correctLower = exercise.correct_answer.toLowerCase()
        .replace(/[.,!?']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      const userLower = userAnswer
        .replace(/[.,!?']/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      correct = userLower === correctLower;
    }

    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer?.(correct);
  };

  const renderOptions = () => {
    if (exercise.type === 'choice' && exercise.options) {
      return (
        <div className="space-y-3">
          {exercise.options.map((option, index) => {
            const optionLetter = option.charAt(0);
            const isSelected = selectedAnswer === optionLetter;
            const isCorrectOption = optionLetter === exercise.correct_answer;

            let optionClass = 'border-2 p-4 rounded-lg cursor-pointer transition-all';
            
            if (isSubmitted) {
              if (isCorrectOption) {
                optionClass += ' border-green-500 bg-green-50';
              } else if (isSelected && !isCorrect) {
                optionClass += ' border-red-500 bg-red-50';
              } else {
                optionClass += ' border-gray-200 opacity-50';
              }
            } else {
              if (isSelected) {
                optionClass += ' border-primary bg-primary/5';
              } else {
                optionClass += ' border-gray-200 hover:border-primary/50';
              }
            }

            return (
              <div
                key={option}
                className={optionClass}
                onClick={() => !isSubmitted && setSelectedAnswer(optionLetter)}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isSubmitted && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {isSubmitted && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-muted-foreground mt-2">
            快捷键：按 1/2/3/4 或 A/B/C/D 选择，Enter 提交
          </p>
        </div>
      );
    }

    if (exercise.type === 'judge' && exercise.options) {
      return (
        <div className="flex gap-4">
          {exercise.options.map((option) => {
            const isSelected = selectedAnswer === option;
            const isCorrectOption = option === exercise.correct_answer;

            let btnVariant: 'default' | 'outline' | 'destructive' | 'secondary' = 'outline';
            
            if (isSubmitted) {
              if (isCorrectOption) {
                btnVariant = 'default';
              } else if (isSelected) {
                btnVariant = 'destructive';
              }
            } else if (isSelected) {
              btnVariant = 'secondary';
            }

            return (
              <Button
                key={option}
                variant={btnVariant}
                size="lg"
                className="flex-1"
                onClick={() => !isSubmitted && setSelectedAnswer(option)}
                disabled={isSubmitted}
              >
                {option}
                {isSubmitted && isCorrectOption && (
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                )}
              </Button>
            );
          })}
        </div>
      );
    }

    if (exercise.type === 'fill' || exercise.type === 'translate') {
      return (
        <div className="space-y-4">
          <Input
            type="text"
            placeholder={exercise.type === 'fill' ? '输入答案...' : '输入翻译...'}
            value={fillAnswer}
            onChange={(e) => setFillAnswer(e.target.value)}
            disabled={isSubmitted}
            className={`text-lg p-6 ${
              isSubmitted
                ? isCorrect
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : ''
            }`}
            autoFocus
          />
          {isSubmitted && !isCorrect && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm text-green-800">
                正确答案：<strong>{exercise.correct_answer}</strong>
              </span>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline">{typeLabels[exercise.type]}</Badge>
          <div className="flex gap-2">
            {exercise.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            <Badge className={difficultyColors[exercise.difficulty - 1]}>
              难度 {exercise.difficulty}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-xl leading-relaxed">
          {exercise.question}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {renderOptions()}

        {/* 答案解析 */}
        {isSubmitted && (
          <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-start gap-3">
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Lightbulb className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p className={`font-semibold ${isCorrect ? 'text-green-800' : 'text-amber-800'}`}>
                  {isCorrect ? '回答正确！' : '答案解析'}
                </p>
                <p className={`mt-1 text-sm ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
                  {exercise.explanation}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        {!isSubmitted ? (
          <>
            <Button variant="ghost" onClick={resetState}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重置
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                (exercise.type === 'choice' || exercise.type === 'judge')
                  ? !selectedAnswer
                  : !fillAnswer.trim()
              }
            >
              提交答案
            </Button>
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              按 Enter 或空格进入下一题
            </div>
            <Button onClick={onNext}>
              下一题
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
