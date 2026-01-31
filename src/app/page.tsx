'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import { WordCard } from '@/components/word-card';
import { GrammarCard } from '@/components/grammar-card';
import { ExerciseCard } from '@/components/exercise-card';
import {
  BookOpen,
  Brain,
  Calendar,
  Plus,
  PlayCircle,
  ChevronRight,
  Sparkles,
  Loader2,
  Cloud,
  HardDrive,
  PenTool,
  Trophy,
  Target
} from 'lucide-react';
import type { Word, Grammar, Exercise, ExerciseStats } from '@/types';
import { fetchWords, fetchGrammar, isSupabaseConfigured } from '@/lib/supabase-client';

// 本地备用数据
import wordsData from '@/../data/words.json';
import grammarData from '@/../data/grammar.json';
import exercisesData from '@/../data/exercises.json';

const localWords: Word[] = wordsData.words.map(w => ({
  ...w,
  user_id: 'local',
  phonetic: w.phonetic || null,
  notes: w.notes || null,
}));

const localGrammar: Grammar[] = grammarData.grammar.map(g => ({
  ...g,
  user_id: 'local',
  notes: g.notes || null,
}));

const localExercises: Exercise[] = exercisesData.exercises as Exercise[];

type View = 'dashboard' | 'words' | 'grammar' | 'review' | 'word-detail' | 'grammar-detail' | 'exercises' | 'exercise-practice';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number>(0);
  const [selectedGrammar, setSelectedGrammar] = useState<Grammar | null>(null);
  const [words, setWords] = useState<Word[]>(localWords);
  const [grammar, setGrammar] = useState<Grammar[]>(localGrammar);
  const [exercises, setExercises] = useState<Exercise[]>(localExercises);
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  
  // 练习统计
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats>({
    total: 0,
    correct: 0,
    accuracy: 0,
  });

  // 从 Supabase 或本地加载数据
  const loadData = useCallback(async () => {
    setLoading(true);

    if (isSupabaseConfigured) {
      try {
        const [wordsFromDb, grammarFromDb] = await Promise.all([
          fetchWords(),
          fetchGrammar(),
        ]);

        if (wordsFromDb.length > 0 || grammarFromDb.length > 0) {
          setWords(wordsFromDb.length > 0 ? wordsFromDb : localWords);
          setGrammar(grammarFromDb.length > 0 ? grammarFromDb : localGrammar);
          setIsCloud(true);
        } else {
          // 数据库为空，使用本地数据
          setWords(localWords);
          setGrammar(localGrammar);
          setIsCloud(false);
        }
      } catch (error) {
        console.error('Error loading from Supabase:', error);
        setWords(localWords);
        setGrammar(localGrammar);
        setIsCloud(false);
      }
    } else {
      // 未配置 Supabase，使用本地数据
      setWords(localWords);
      setGrammar(localGrammar);
      setIsCloud(false);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 模拟统计数据
  const stats = {
    totalWords: words.length,
    totalGrammar: grammar.length,
    totalExercises: exercises.length,
    dueForReview: 5,
    todayLearned: 3,
  };

  const handleViewWord = (word: Word, index?: number) => {
    setSelectedWord(word);
    setSelectedWordIndex(index ?? words.findIndex(w => w.id === word.id));
    setCurrentView('word-detail');
  };

  const handleNextWord = () => {
    const nextIndex = (selectedWordIndex + 1) % words.length;
    setSelectedWordIndex(nextIndex);
    setSelectedWord(words[nextIndex]);
  };

  const handlePrevWord = () => {
    const prevIndex = (selectedWordIndex - 1 + words.length) % words.length;
    setSelectedWordIndex(prevIndex);
    setSelectedWord(words[prevIndex]);
  };

  const handleViewGrammar = (g: Grammar) => {
    setSelectedGrammar(g);
    setCurrentView('grammar-detail');
  };

  // 仪表盘视图
  const DashboardView = () => (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">英语学习助手</h1>
          <p className="text-muted-foreground mt-1">
            基于间隔重复算法，让记忆更持久
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isCloud ? "default" : "secondary"} className="text-sm">
            {isCloud ? (
              <>
                <Cloud className="h-4 w-4 mr-1" />
                云端同步
              </>
            ) : (
              <>
                <HardDrive className="h-4 w-4 mr-1" />
                本地数据
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="单词总数"
          value={stats.totalWords}
          description="已添加到词库"
          icon="words"
        />
        <StatsCard
          title="语法点"
          value={stats.totalGrammar}
          description="已学习的语法"
          icon="grammar"
        />
        <StatsCard
          title="待复习"
          value={stats.dueForReview}
          description="今天需要复习"
          icon="review"
        />
        <StatsCard
          title="今日学习"
          value={stats.todayLearned}
          description="今日新学内容"
          icon="time"
        />
      </div>

      {/* 快速操作 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('review')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              开始复习
            </CardTitle>
            <CardDescription>
              复习今天到期的 {stats.dueForReview} 个项目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              立即开始
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-200 bg-orange-50/30" onClick={() => setCurrentView('exercises')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5 text-orange-500" />
              题库练习
            </CardTitle>
            <CardDescription>
              {stats.totalExercises} 道题目，边做边学
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full border-orange-300 text-orange-700 hover:bg-orange-100">
              开始做题
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('words')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              单词库
            </CardTitle>
            <CardDescription>
              浏览和管理你的 {stats.totalWords} 个单词
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              查看单词
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('grammar')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              语法库
            </CardTitle>
            <CardDescription>
              浏览和管理你的 {stats.totalGrammar} 个语法点
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              查看语法
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 最近添加 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">最近添加的单词</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {words.slice(0, 4).map((word) => (
            <Card
              key={word.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleViewWord(word)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{word.word}</CardTitle>
                  <span className="text-sm text-muted-foreground">{word.phonetic}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{word.meaning}</p>
                <div className="flex gap-1 mt-2">
                  {word.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  // 单词列表视图
  const WordsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mb-2">
            ← 返回
          </Button>
          <h1 className="text-2xl font-bold">单词库</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          添加单词
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {words.map((word, index) => (
          <Card
            key={word.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewWord(word, index)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{word.word}</CardTitle>
                <span className="text-sm text-muted-foreground">{word.phonetic}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{word.meaning}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {word.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // 语法列表视图
  const GrammarView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mb-2">
            ← 返回
          </Button>
          <h1 className="text-2xl font-bold">语法库</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          添加语法
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {grammar.map((g) => (
          <Card
            key={g.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleViewGrammar(g)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                {g.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">{g.explanation}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {g.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // 复习视图
  const ReviewView = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const allItems = [...words, ...grammar];
    const currentItem = allItems[currentIndex];

    const handleNext = () => {
      if (currentIndex < allItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentView('dashboard');
      }
    };

    if (!currentItem) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
            ← 返回
          </Button>
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold">太棒了！</h2>
              <p className="text-muted-foreground mt-2">
                今天的复习任务已全部完成
              </p>
              <Button className="mt-4" onClick={() => setCurrentView('dashboard')}>
                返回首页
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    const isWord = 'word' in currentItem;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
            ← 返回
          </Button>
          <Badge variant="outline">
            {currentIndex + 1} / {allItems.length}
          </Badge>
        </div>

        {isWord ? (
          <WordCard
            word={currentItem as Word}
            mode="review"
            onReview={(quality) => {
              console.log('Review quality:', quality);
              handleNext();
            }}
          />
        ) : (
          <GrammarCard
            grammar={currentItem as Grammar}
            mode="review"
            onReview={(quality) => {
              console.log('Review quality:', quality);
              handleNext();
            }}
          />
        )}
      </div>
    );
  };

  // 单词详情视图
  const WordDetailView = () => {
    if (!selectedWord) return null;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCurrentView('words')}>
            ← 返回单词库
          </Button>
          <Badge variant="outline">
            {selectedWordIndex + 1} / {words.length}
          </Badge>
        </div>
        <WordCard
          word={selectedWord}
          mode="view"
          onNext={handleNextWord}
          onPrev={handlePrevWord}
          currentIndex={selectedWordIndex}
          totalCount={words.length}
        />
      </div>
    );
  };

  // 语法详情视图
  const GrammarDetailView = () => {
    if (!selectedGrammar) return null;
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setCurrentView('grammar')}>
          ← 返回语法库
        </Button>
        <GrammarCard grammar={selectedGrammar} mode="view" />
      </div>
    );
  };

  // 题库列表视图
  const ExercisesView = () => {
    const typeLabels: Record<string, string> = {
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

    const startPractice = () => {
      setExerciseStats({ total: 0, correct: 0, accuracy: 0 });
      setCurrentView('exercise-practice');
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mb-2">
              ← 返回
            </Button>
            <h1 className="text-2xl font-bold">题库练习</h1>
            <p className="text-muted-foreground mt-1">
              通过做题来巩固语法知识，加深记忆
            </p>
          </div>
          <Button onClick={startPractice} size="lg">
            <Target className="h-5 w-5 mr-2" />
            开始练习
          </Button>
        </div>

        {/* 题目统计 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{exercises.length}</div>
              <div className="text-sm text-muted-foreground">题目总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {exercises.filter(e => e.type === 'choice').length}
              </div>
              <div className="text-sm text-muted-foreground">选择题</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {exercises.filter(e => e.type === 'fill').length}
              </div>
              <div className="text-sm text-muted-foreground">填空题</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {exercises.filter(e => e.type === 'judge' || e.type === 'translate').length}
              </div>
              <div className="text-sm text-muted-foreground">判断/翻译题</div>
            </CardContent>
          </Card>
        </div>

        {/* 题目列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">题目预览</h2>
          {exercises.map((exercise, index) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{typeLabels[exercise.type]}</Badge>
                      <Badge className={difficultyColors[exercise.difficulty - 1]}>
                        难度 {exercise.difficulty}
                      </Badge>
                      {exercise.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm line-clamp-2">{exercise.question}</p>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground/30">
                    #{index + 1}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // 练习视图
  const ExercisePracticeView = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [shuffledExercises] = useState(() => 
      [...exercises].sort(() => Math.random() - 0.5)
    );
    
    const currentExercise = shuffledExercises[currentIndex];

    const handleAnswer = (isCorrect: boolean) => {
      setExerciseStats(prev => ({
        total: prev.total + 1,
        correct: prev.correct + (isCorrect ? 1 : 0),
        accuracy: Math.round(((prev.correct + (isCorrect ? 1 : 0)) / (prev.total + 1)) * 100),
      }));
    };

    const handleNext = () => {
      if (currentIndex < shuffledExercises.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    };

    // 完成所有题目
    if (currentIndex >= shuffledExercises.length - 1 && exerciseStats.total > 0 && exerciseStats.total === currentIndex + 1) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setCurrentView('exercises')}>
            ← 返回题库
          </Button>
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold">练习完成！</h2>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary">{exerciseStats.total}</div>
                    <div className="text-sm text-muted-foreground">总题数</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-500">{exerciseStats.correct}</div>
                    <div className="text-sm text-muted-foreground">答对</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-blue-500">{exerciseStats.accuracy}%</div>
                    <div className="text-sm text-muted-foreground">正确率</div>
                  </div>
                </div>
                <div className="pt-4">
                  {exerciseStats.accuracy >= 80 ? (
                    <p className="text-green-600">太棒了！你掌握得很好！</p>
                  ) : exerciseStats.accuracy >= 60 ? (
                    <p className="text-yellow-600">不错，继续加油！</p>
                  ) : (
                    <p className="text-orange-600">还需要多复习一下哦！</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setCurrentView('grammar')}>
                  复习语法
                </Button>
                <Button className="flex-1" onClick={() => {
                  setExerciseStats({ total: 0, correct: 0, accuracy: 0 });
                  setCurrentIndex(0);
                }}>
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
          <Button variant="ghost" onClick={() => setCurrentView('exercises')}>
            ← 返回题库
          </Button>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              {currentIndex + 1} / {shuffledExercises.length}
            </Badge>
            {exerciseStats.total > 0 && (
              <Badge variant="secondary" className="text-sm">
                正确率: {exerciseStats.accuracy}%
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
          exercise={currentExercise}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      </div>
    );
  };

  // 渲染当前视图
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'words':
        return <WordsView />;
      case 'grammar':
        return <GrammarView />;
      case 'review':
        return <ReviewView />;
      case 'word-detail':
        return <WordDetailView />;
      case 'grammar-detail':
        return <GrammarDetailView />;
      case 'exercises':
        return <ExercisesView />;
      case 'exercise-practice':
        return <ExercisePracticeView />;
      default:
        return <DashboardView />;
    }
  };

  // 加载状态
  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">加载中...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {renderView()}
    </main>
  );
}
