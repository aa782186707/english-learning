// 数据库类型定义

export interface Word {
  id: string;
  user_id: string;
  word: string;
  phonetic: string | null;
  meaning: string;
  example_sentences: string[];
  tags: string[];
  difficulty: number;
  notes: string | null;
  // 记忆技巧
  memory_tips?: {
    association?: string;      // 联想记忆
    word_root?: string;        // 词根词缀
    similar_words?: string[];  // 形近词/易混词
    mnemonic?: string;         // 口诀/谐音
    image_hint?: string;       // 画面联想
  };
  created_at: string;
  updated_at: string;
}

export interface Grammar {
  id: string;
  user_id: string;
  title: string;
  explanation: string;
  examples: string[];
  tags: string[];
  difficulty: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningProgress {
  id: string;
  user_id: string;
  item_type: 'word' | 'grammar';
  item_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_reviewed_at: string | null;
  last_quality?: number; // 上次复习的评分 (0-5)
  created_at: string;
  updated_at: string;
}

export interface DailyStats {
  id: string;
  user_id: string;
  date: string;
  words_learned: number;
  words_reviewed: number;
  grammar_learned: number;
  grammar_reviewed: number;
  study_minutes: number;
  created_at: string;
  updated_at: string;
}

// 学习项目（单词或语法 + 进度）
export interface LearningItem {
  type: 'word' | 'grammar';
  item: Word | Grammar;
  progress: LearningProgress | null;
}

// 复习评分
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0 = 完全忘记
// 1 = 错误，但看到答案后记起
// 2 = 错误，但答案很熟悉
// 3 = 正确，但很费力
// 4 = 正确，有些犹豫
// 5 = 完美记忆

// API 响应类型
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// 新增单词请求
export interface AddWordRequest {
  word: string;
  phonetic?: string;
  meaning: string;
  example_sentences?: string[];
  tags?: string[];
  difficulty?: number;
  notes?: string;
  memory_tips?: {
    association?: string;
    word_root?: string;
    similar_words?: string[];
    mnemonic?: string;
    image_hint?: string;
  };
}

// 新增语法请求
export interface AddGrammarRequest {
  title: string;
  explanation: string;
  examples?: string[];
  tags?: string[];
  difficulty?: number;
  notes?: string;
}

// 题目类型
export type ExerciseType = 'choice' | 'fill' | 'judge' | 'translate';

// 练习题目
export interface Exercise {
  id: string;
  grammar_id?: string;       // 关联的语法点ID（可选）
  type: ExerciseType;        // 题目类型
  question: string;          // 题目内容
  options?: string[];        // 选项（选择题/判断题用）
  correct_answer: string;    // 正确答案
  explanation: string;       // 答案解析
  tags: string[];            // 标签
  difficulty: number;        // 难度 1-5
  created_at: string;
  updated_at: string;
}

// 答题记录
export interface ExerciseRecord {
  id: string;
  exercise_id: string;
  user_answer: string;
  is_correct: boolean;
  answered_at: string;
}

// 练习统计
export interface ExerciseStats {
  total: number;
  correct: number;
  accuracy: number;
}
