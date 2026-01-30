import { getSupabaseClient } from './supabase';
import type { Word, Grammar, LearningProgress, DailyStats, AddWordRequest, AddGrammarRequest, ReviewQuality } from '@/types';
import { calculateFromProgress } from './spaced-repetition';

const supabase = getSupabaseClient();

// ============================================
// 单词相关操作
// ============================================

export async function getWords(userId: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Word[];
}

export async function getWord(id: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Word;
}

export async function addWord(userId: string, word: AddWordRequest) {
  const { data, error } = await supabase
    .from('words')
    .insert({
      user_id: userId,
      word: word.word,
      phonetic: word.phonetic || null,
      meaning: word.meaning,
      example_sentences: word.example_sentences || [],
      tags: word.tags || [],
      difficulty: word.difficulty || 1,
      notes: word.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // 创建初始学习进度
  await createLearningProgress(userId, 'word', data.id);

  return data as Word;
}

export async function updateWord(id: string, updates: Partial<AddWordRequest>) {
  const { data, error } = await supabase
    .from('words')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Word;
}

export async function deleteWord(id: string) {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// 语法相关操作
// ============================================

export async function getGrammarList(userId: string) {
  const { data, error } = await supabase
    .from('grammar')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Grammar[];
}

export async function getGrammar(id: string) {
  const { data, error } = await supabase
    .from('grammar')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Grammar;
}

export async function addGrammar(userId: string, grammar: AddGrammarRequest) {
  const { data, error } = await supabase
    .from('grammar')
    .insert({
      user_id: userId,
      title: grammar.title,
      explanation: grammar.explanation,
      examples: grammar.examples || [],
      tags: grammar.tags || [],
      difficulty: grammar.difficulty || 1,
      notes: grammar.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  // 创建初始学习进度
  await createLearningProgress(userId, 'grammar', data.id);

  return data as Grammar;
}

export async function updateGrammar(id: string, updates: Partial<AddGrammarRequest>) {
  const { data, error } = await supabase
    .from('grammar')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Grammar;
}

export async function deleteGrammar(id: string) {
  const { error } = await supabase
    .from('grammar')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// 学习进度相关操作
// ============================================

export async function createLearningProgress(
  userId: string,
  itemType: 'word' | 'grammar',
  itemId: string
) {
  const { data, error } = await supabase
    .from('learning_progress')
    .insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
      next_review_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as LearningProgress;
}

export async function getProgress(userId: string, itemType: 'word' | 'grammar', itemId: string) {
  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data as LearningProgress | null;
}

export async function getDueItems(userId: string) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_at', now)
    .order('next_review_at', { ascending: true });

  if (error) throw error;
  return data as LearningProgress[];
}

export async function updateProgress(
  progressId: string,
  quality: ReviewQuality,
  currentProgress: LearningProgress
) {
  const result = calculateFromProgress(currentProgress, quality);

  const { data, error } = await supabase
    .from('learning_progress')
    .update({
      ease_factor: result.easeFactor,
      interval_days: result.intervalDays,
      repetitions: result.repetitions,
      next_review_at: result.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq('id', progressId)
    .select()
    .single();

  if (error) throw error;
  return data as LearningProgress;
}

// ============================================
// 统计相关操作
// ============================================

export async function getTodayStats(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as DailyStats | null;
}

export async function updateTodayStats(
  userId: string,
  updates: Partial<Omit<DailyStats, 'id' | 'user_id' | 'date' | 'created_at' | 'updated_at'>>
) {
  const today = new Date().toISOString().split('T')[0];

  // 尝试获取今天的统计
  const existing = await getTodayStats(userId);

  if (existing) {
    const { data, error } = await supabase
      .from('daily_stats')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as DailyStats;
  } else {
    const { data, error } = await supabase
      .from('daily_stats')
      .insert({
        user_id: userId,
        date: today,
        ...updates,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DailyStats;
  }
}

export async function getWeeklyStats(userId: string) {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', weekAgo.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (error) throw error;
  return data as DailyStats[];
}

// ============================================
// 总览统计
// ============================================

export async function getOverviewStats(userId: string) {
  const [words, grammar, dueItems, todayStats] = await Promise.all([
    supabase.from('words').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('grammar').select('id', { count: 'exact' }).eq('user_id', userId),
    getDueItems(userId),
    getTodayStats(userId),
  ]);

  return {
    totalWords: words.count || 0,
    totalGrammar: grammar.count || 0,
    dueForReview: dueItems.length,
    todayLearned: (todayStats?.words_learned || 0) + (todayStats?.grammar_learned || 0),
    todayReviewed: (todayStats?.words_reviewed || 0) + (todayStats?.grammar_reviewed || 0),
  };
}
