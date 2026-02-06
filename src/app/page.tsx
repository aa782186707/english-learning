'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/stats-card';
import { WordCard } from '@/components/word-card';
import { GrammarCard } from '@/components/grammar-card';
import { ExercisePractice } from '@/components/exercise-practice';
import {
  BookOpen,
  Brain,
  Calendar,
  Plus,
  PlayCircle,
  ChevronRight,
  Loader2,
  Cloud,
  HardDrive,
  PenTool,
  Target,
  CloudUpload,
  GraduationCap,
  LayoutDashboard,
  Filter
} from 'lucide-react';
import type { Word, Grammar, Exercise, LearningProgress, ReviewQuality } from '@/types';
import { fetchWords, fetchGrammar, fetchProgress, saveProgress, isSupabaseConfigured, supabase } from '@/lib/supabase-client';
import { calculateFromProgress } from '@/lib/spaced-repetition';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { addWord } from '@/lib/supabase-client';

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
  const [progressMap, setProgressMap] = useState<Record<string, LearningProgress>>({});
  const [reviewMode, setReviewMode] = useState<'due' | 'all' | 'hard' | 'new' | 'mastered'>('due');
  const [loading, setLoading] = useState(true);
  const [isCloud, setIsCloud] = useState(false);
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'word' | 'sentence'>('all');
  const [filterScenario, setFilterScenario] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);


  // 从 Supabase 或本地加载数据
  const loadData = useCallback(async () => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        const [wordsFromDb, grammarFromDb] = await Promise.all([
          fetchWords(),
          fetchGrammar(),
        ]);

        if (user) {
          const progress = await fetchProgress(user.id);
          const pMap: Record<string, LearningProgress> = {};
          progress.forEach(p => { pMap[p.item_id] = p; });
          setProgressMap(pMap);
        }

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

  // 统计数据
  const dueCount = Object.values(progressMap).filter(p => {
    const reviewDate = new Date(p.next_review_at);
    return reviewDate <= new Date();
  }).length;

  const stats = {
    totalWords: words.length,
    totalGrammar: grammar.length,
    totalExercises: exercises.length,
    dueForReview: dueCount,
    todayLearned: Object.values(progressMap).filter(p => {
      const lastReview = p.last_reviewed_at ? new Date(p.last_reviewed_at) : null;
      const today = new Date();
      return lastReview && lastReview.getDate() === today.getDate() && lastReview.getMonth() === today.getMonth() && lastReview.getFullYear() === today.getFullYear();
    }).length,
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

  const handleAddWordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    try {
      const newWord = {
        word: formData.get('word') as string,
        phonetic: formData.get('phonetic') as string,
        meaning: formData.get('meaning') as string,
        tags: (formData.get('tags') as string).split(/[,，]/).map(t => t.trim()).filter(Boolean),
        difficulty: 1,
        notes: formData.get('notes') as string,
        example_sentences: [],
      };

      await addWord({
        ...newWord,
        user_id: isCloud ? 'user' : 'local',
      });

      await loadData();
      setIsAddWordOpen(false);
    } catch (error) {
      console.error('Failed to add word:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);

    if (!supabase) {
      alert('未检测到 Supabase 客户端配置');
      setIsSyncing(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('请先登录以同步数据');
        setIsSyncing(false);
        return;
      }

      // Sync Words
      const wordsToSync = words.map(w => ({
        ...w,
        user_id: user.id
      }));

      for (const word of wordsToSync) {
        const { error } = await supabase.from('words').upsert(word);
        if (error) console.error('Error syncing word:', word.word, error);
      }

      // Sync Grammar
      const grammarToSync = grammar.map(g => ({
        ...g,
        user_id: user.id
      }));

      for (const item of grammarToSync) {
        const { error } = await supabase.from('grammar').upsert(item);
        if (error) console.error('Error syncing grammar:', item.title, error);
      }

      alert('同步完成！');
      await loadData();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('同步失败');
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Word Modal
  const AddWordModal = () => {
    const [isSentence, setIsSentence] = useState(false);

    if (!isAddWordOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">添加{isSentence ? '句子' : '单词/词组'}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground cursor-pointer" onClick={() => setIsSentence(!isSentence)}>
                {isSentence ? '切换到单词' : '切换到句子'}
              </span>
            </div>
          </div>
          <form onSubmit={handleAddWordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{isSentence ? '句子内容' : '单词/词组'}</label>
              {isSentence ? (
                <Textarea name="word" required placeholder="例如: The quick brown fox jumps over the lazy dog." className="h-24" />
              ) : (
                <Input name="word" required placeholder="例如: ubiquitous 或 piece of cake" />
              )}
            </div>

            {!isSentence && (
              <div>
                <label className="block text-sm font-medium mb-1">音标 (可选)</label>
                <Input name="phonetic" placeholder="/.../" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">含义</label>
              {isSentence ? (
                <Textarea name="meaning" required placeholder="中文释义" />
              ) : (
                <Input name="meaning" required placeholder="中文释义" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">标签 (逗号分隔)</label>
              <Input name="tags" placeholder={isSentence ? "口语, 电影台词" : "生活, 考试, 高频"} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">备注</label>
              <Input name="notes" placeholder="助记或其他" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAddWordOpen(false)}>取消</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                保存
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
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
          {!isCloud && (
            <Button size="sm" variant="outline" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CloudUpload className="h-4 w-4 mr-1" />}
              同步到云端
            </Button>
          )}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="词汇总数"
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
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              开始复习
            </CardTitle>
            <CardDescription>
              选择复习模式
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={reviewMode}
                onChange={(e) => setReviewMode(e.target.value as any)}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="due">到期复习 ({stats.dueForReview})</option>
                <option value="all">所有内容</option>
                <option value="new">新词/未学</option>
                <option value="hard">忘记 (Hard)</option>
                <option value="mastered">掌握 (Mastered)</option>
              </select>
            </div>
            <Button className="w-full" onClick={() => setCurrentView('review')}>
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
              词汇库
            </CardTitle>
            <CardDescription>
              浏览和管理你的 {stats.totalWords} 个单词/句子
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              查看词汇
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
        <h2 className="text-xl font-semibold">最近添加的内容</h2>
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
  const WordsView = () => {
    const filteredWords = words.filter(w => {
      // Date Filter
      if (filterDate) {
        const wordDate = new Date(w.created_at).toISOString().split('T')[0];
        if (wordDate !== filterDate) return false;
      }

      // Type Filter
      if (filterType === 'all') return true;

      // Heuristic for sentence detection
      const isSentence = w.tags.some(t => ['句子', '例句'].includes(t)) ||
        /[.?!]$/.test(w.word) ||
        (w.word.includes(' ') && w.word.length > 30);

      if (filterType === 'sentence') return isSentence;
      if (filterType === 'word') return !isSentence;

      return true;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mb-2">
              ← 返回
            </Button>
            <h1 className="text-2xl font-bold">词汇库</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="all">全部类型</option>
                <option value="word">单词/词组</option>
                <option value="sentence">句子</option>
              </select>

              <span className="text-sm text-muted-foreground hidden sm:inline">日期:</span>
              <Input
                type="date"
                className="w-auto"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
              {(filterDate || filterType !== 'all') && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterDate(''); setFilterType('all'); }}>清除</Button>
              )}
            </div>
            <Button onClick={() => setIsAddWordOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              添加
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWords.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              没有找到匹配的内容
            </div>
          ) : (
            filteredWords.map((word, index) => (
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
            ))
          )}
        </div>
      </div>
    );
  };

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
    const [isListeningMode, setIsListeningMode] = useState(false);
    const [reviewItems, setReviewItems] = useState<(Word | Grammar)[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize review items once on mount
    useEffect(() => {
      const allItems = [...words, ...grammar];
      const filtered = allItems.filter(item => {
        const progress = progressMap[item.id];

        switch (reviewMode) {
          case 'new':
            return !progress;
          case 'hard':
            // 0, 1, 2 = Hard/Forgot
            return progress && progress.last_quality !== undefined && progress.last_quality <= 2;
          case 'mastered':
            // 4, 5 = Easy/Mastered
            return progress && progress.last_quality !== undefined && progress.last_quality >= 4;
          case 'due':
            // Default behavior: Due for review or new
            if (!progress) return true;
            return new Date(progress.next_review_at) <= new Date();
          case 'all':
            return true;
          default:
            return true;
        }
      });

      // Shuffle items (Fisher-Yates shuffle)
      for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
      }
      setReviewItems(filtered);
      setIsInitialized(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount to avoid re-shuffling during review

    const currentItem = reviewItems[currentIndex];
    const currentProgress = currentItem ? progressMap[currentItem.id] : null;

    const handleNext = () => {
      if (currentIndex < reviewItems.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentView('dashboard');
      }
    };

    const handleReviewSubmit = async (quality: ReviewQuality) => {
      if (!currentItem) return;

      // Calculate next review
      const result = calculateFromProgress(currentProgress, quality);

      // Prepare new progress object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newProgress: any = {
        ...currentProgress,
        item_type: 'word' in currentItem ? 'word' : 'grammar',
        item_id: currentItem.id,
        ease_factor: result.easeFactor,
        interval_days: result.intervalDays,
        repetitions: result.repetitions,
        next_review_at: result.nextReviewAt.toISOString(),
        last_reviewed_at: new Date().toISOString(),
        last_quality: quality, // Save the quality!
        created_at: currentProgress?.created_at || new Date().toISOString(),
      };

      // 1. Update local state immediately (Optimistic UI)
      setProgressMap(prev => ({
        ...prev,
        [currentItem.id]: newProgress
      }));

      // 2. Save to cloud
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase!.auth.getUser();
        if (user) {
          await saveProgress({
            ...newProgress,
            user_id: user.id
          });
        }
      }

      handleNext();
    };

    if (!isInitialized) {
      return (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!currentItem) {
      return (
        <div className="space-y-6">
          <Button variant="ghost" onClick={() => setCurrentView('dashboard')}>
            ← 返回
          </Button>
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Calendar className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold">
                {reviewItems.length === 0 ? '暂无内容' : '太棒了！'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {reviewItems.length === 0 ? '没有符合当前筛选条件的复习内容' : '复习任务已全部完成'}
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
          <div className="flex items-center gap-4">
            {isWord && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="listening-mode"
                  checked={isListeningMode}
                  onChange={(e) => setIsListeningMode(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="listening-mode"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  听音模式
                </label>
              </div>
            )}
            <Badge variant="outline">
              {currentIndex + 1} / {reviewItems.length}
            </Badge>
          </div>
        </div>

        {isWord ? (
          <WordCard
            word={currentItem as Word}
            progress={currentProgress}
            mode="review"
            enableListeningMode={isListeningMode}
            onReview={handleReviewSubmit}
          />
        ) : (
          <GrammarCard
            grammar={currentItem as Grammar}
            progress={currentProgress}
            mode="review"
            onReview={handleReviewSubmit}
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
            ← 返回词汇库
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

    // Get all unique tags as scenarios
    const allScenarios = Array.from(new Set(exercises.flatMap(e => e.tags)));

    const filteredExercises = exercises.filter(e => {
      if (filterScenario === 'all') return true;
      return e.tags.includes(filterScenario);
    });

    const startPractice = () => {
      setCurrentView('exercise-practice');
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <Button variant="ghost" onClick={() => setCurrentView('dashboard')} className="mb-2">
              ← 返回
            </Button>
            <h1 className="text-2xl font-bold">题库练习</h1>
            <p className="text-muted-foreground mt-1">
              通过做题来巩固语法知识，加深记忆
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-muted-foreground">场景:</span>
              <select
                className="h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px]"
                value={filterScenario}
                onChange={(e) => setFilterScenario(e.target.value)}
              >
                <option value="all">全部场景</option>
                {allScenarios.map(scenario => (
                  <option key={scenario} value={scenario}>{scenario}</option>
                ))}
              </select>
            </div>
            <Button onClick={startPractice} size="lg" disabled={filteredExercises.length === 0}>
              <Target className="h-5 w-5 mr-2" />
              开始练习 ({filteredExercises.length})
            </Button>
          </div>
        </div>

        {/* 题目统计 */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{filteredExercises.length}</div>
              <div className="text-sm text-muted-foreground">题目总数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredExercises.filter(e => e.type === 'choice').length}
              </div>
              <div className="text-sm text-muted-foreground">选择题</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredExercises.filter(e => e.type === 'fill').length}
              </div>
              <div className="text-sm text-muted-foreground">填空题</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {filteredExercises.filter(e => e.type === 'judge' || e.type === 'translate').length}
              </div>
              <div className="text-sm text-muted-foreground">判断/翻译题</div>
            </CardContent>
          </Card>
        </div>

        {/* 题目列表 */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">题目预览</h2>
          {filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              该场景下暂无题目
            </div>
          ) : (
            filteredExercises.map((exercise, index) => (
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
            ))
          )}
        </div>
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
        const filteredExercises = exercises.filter(e => {
          if (filterScenario === 'all') return true;
          return e.tags.includes(filterScenario);
        });

        return (
          <ExercisePractice
            exercises={filteredExercises}
            onBack={() => setCurrentView('exercises')}
            onGoToGrammar={() => setCurrentView('grammar')}
          />
        );
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
      <AddWordModal />
    </main>
  );
}
