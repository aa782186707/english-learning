-- 英语学习应用数据库结构
-- 创建时间: 2026-01-30

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 单词表
-- ============================================
CREATE TABLE words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  phonetic VARCHAR(255),
  meaning TEXT NOT NULL,
  example_sentences TEXT[] DEFAULT '{}',
  tags VARCHAR(100)[] DEFAULT '{}',
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  notes TEXT,
  memory_tips JSONB DEFAULT '{}',  -- 记忆技巧：word_root, mnemonic, association, image_hint, similar_words
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 单词表索引
CREATE INDEX idx_words_user_id ON words(user_id);
CREATE INDEX idx_words_word ON words(word);
CREATE INDEX idx_words_tags ON words USING GIN(tags);
CREATE INDEX idx_words_created_at ON words(created_at DESC);

-- ============================================
-- 语法表
-- ============================================
CREATE TABLE grammar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  explanation TEXT NOT NULL,
  examples TEXT[] DEFAULT '{}',
  tags VARCHAR(100)[] DEFAULT '{}',
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 语法表索引
CREATE INDEX idx_grammar_user_id ON grammar(user_id);
CREATE INDEX idx_grammar_tags ON grammar USING GIN(tags);
CREATE INDEX idx_grammar_created_at ON grammar(created_at DESC);

-- ============================================
-- 学习进度表（间隔重复）
-- ============================================
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('word', 'grammar')),
  item_id UUID NOT NULL,
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

-- 学习进度索引
CREATE INDEX idx_learning_progress_user_id ON learning_progress(user_id);
CREATE INDEX idx_learning_progress_next_review ON learning_progress(next_review_at);
CREATE INDEX idx_learning_progress_item ON learning_progress(item_type, item_id);

-- ============================================
-- 每日统计表
-- ============================================
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  words_learned INTEGER DEFAULT 0,
  words_reviewed INTEGER DEFAULT 0,
  grammar_learned INTEGER DEFAULT 0,
  grammar_reviewed INTEGER DEFAULT 0,
  study_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 每日统计索引
CREATE INDEX idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

-- ============================================
-- 行级安全策略 (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- Words 策略
CREATE POLICY "Users can view their own words" ON words
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own words" ON words
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own words" ON words
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own words" ON words
  FOR DELETE USING (auth.uid() = user_id);

-- Grammar 策略
CREATE POLICY "Users can view their own grammar" ON grammar
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own grammar" ON grammar
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own grammar" ON grammar
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own grammar" ON grammar
  FOR DELETE USING (auth.uid() = user_id);

-- Learning Progress 策略
CREATE POLICY "Users can view their own progress" ON learning_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON learning_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON learning_progress
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own progress" ON learning_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Daily Stats 策略
CREATE POLICY "Users can view their own stats" ON daily_stats
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own stats" ON daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own stats" ON daily_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 更新时间触发器
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER words_updated_at
  BEFORE UPDATE ON words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER grammar_updated_at
  BEFORE UPDATE ON grammar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER learning_progress_updated_at
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER daily_stats_updated_at
  BEFORE UPDATE ON daily_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
