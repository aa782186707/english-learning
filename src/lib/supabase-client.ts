import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Word, Grammar, LearningProgress } from '@/types';

// 创建 Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 兼容新版和旧版 Supabase 的变量名
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// 检查是否配置了 Supabase
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// ============================================
// 单词操作
// ============================================

export async function fetchWords(): Promise<Word[]> {
  if (!supabase) {
    console.log('Supabase not configured, using local data');
    return [];
  }

  const { data, error } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching words:', error);
    return [];
  }

  return data as Word[];
}

export async function addWord(word: Omit<Word, 'id' | 'created_at' | 'updated_at'>): Promise<Word | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('words')
    .insert(word)
    .select()
    .single();

  if (error) {
    console.error('Error adding word:', error);
    return null;
  }

  return data as Word;
}

export async function updateWord(id: string, updates: Partial<Word>): Promise<Word | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('words')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating word:', error);
    return null;
  }

  return data as Word;
}

export async function deleteWord(id: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting word:', error);
    return false;
  }

  return true;
}

// ============================================
// 语法操作
// ============================================

export async function fetchGrammar(): Promise<Grammar[]> {
  if (!supabase) {
    console.log('Supabase not configured, using local data');
    return [];
  }

  const { data, error } = await supabase
    .from('grammar')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching grammar:', error);
    return [];
  }

  return data as Grammar[];
}

export async function addGrammar(grammar: Omit<Grammar, 'id' | 'created_at' | 'updated_at'>): Promise<Grammar | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('grammar')
    .insert(grammar)
    .select()
    .single();

  if (error) {
    console.error('Error adding grammar:', error);
    return null;
  }

  return data as Grammar;
}

// ============================================
// 学习进度操作
// ============================================

export async function fetchProgress(userId: string): Promise<LearningProgress[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching progress:', error);
    return [];
  }

  return data as LearningProgress[];
}

export async function updateProgress(
  id: string,
  updates: Partial<LearningProgress>
): Promise<LearningProgress | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('learning_progress')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating progress:', error);
    return null;
  }

  return data as LearningProgress;
}
