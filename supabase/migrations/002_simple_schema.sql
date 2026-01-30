-- 简化版数据库结构（个人使用，无需认证）
-- 如果你是个人使用，请使用这个版本
-- 在 Supabase SQL Editor 中执行

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 单词表（简化版，无 user_id）
-- ============================================
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  word VARCHAR(255) NOT NULL,
  phonetic VARCHAR(255),
  meaning TEXT NOT NULL,
  example_sentences TEXT[] DEFAULT '{}',
  tags VARCHAR(100)[] DEFAULT '{}',
  difficulty INTEGER DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  notes TEXT,
  memory_tips JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 单词表索引
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_words_tags ON words USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_words_created_at ON words(created_at DESC);

-- ============================================
-- 语法表（简化版，无 user_id）
-- ============================================
CREATE TABLE IF NOT EXISTS grammar (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX IF NOT EXISTS idx_grammar_tags ON grammar USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_grammar_created_at ON grammar(created_at DESC);

-- ============================================
-- 学习进度表
-- ============================================
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('word', 'grammar')),
  item_id UUID NOT NULL,
  ease_factor DECIMAL(3,2) DEFAULT 2.50 CHECK (ease_factor >= 1.30),
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(item_type, item_id)
);

-- 学习进度索引
CREATE INDEX IF NOT EXISTS idx_learning_progress_next_review ON learning_progress(next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_progress_item ON learning_progress(item_type, item_id);

-- ============================================
-- 允许公开访问（个人使用）
-- ============================================

-- 禁用 RLS（个人使用不需要行级安全）
ALTER TABLE words DISABLE ROW LEVEL SECURITY;
ALTER TABLE grammar DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress DISABLE ROW LEVEL SECURITY;

-- 或者启用 RLS 但允许所有操作（更安全的方式）
-- ALTER TABLE words ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all" ON words FOR ALL USING (true) WITH CHECK (true);

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

DROP TRIGGER IF EXISTS words_updated_at ON words;
CREATE TRIGGER words_updated_at
  BEFORE UPDATE ON words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS grammar_updated_at ON grammar;
CREATE TRIGGER grammar_updated_at
  BEFORE UPDATE ON grammar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS learning_progress_updated_at ON learning_progress;
CREATE TRIGGER learning_progress_updated_at
  BEFORE UPDATE ON learning_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 插入示例数据
-- ============================================
INSERT INTO words (word, phonetic, meaning, example_sentences, tags, difficulty, notes, memory_tips) VALUES
(
  'ubiquitous',
  '/juːˈbɪkwɪtəs/',
  'adj. 无处不在的，普遍存在的',
  ARRAY['Smartphones have become ubiquitous in modern society.', 'The ubiquitous presence of social media has changed how we communicate.', 'Coffee shops are ubiquitous in big cities.'],
  ARRAY['高级词汇', 'GRE', '形容词'],
  4,
  '同义词: omnipresent, pervasive, everywhere',
  '{"word_root": "ubique (拉丁语\"到处\") + -ous (形容词后缀) = 到处都有的", "mnemonic": "\"you-BIG-wi-tous\" → 你(you)太大(big)了，到处都能看到你", "association": "想象 WiFi 信号无处不在，ubiquitous 就像无线网络覆盖整个城市", "image_hint": "想象一个巨大的蜘蛛网覆盖整个地球，每个角落都有", "similar_words": ["omnipresent", "pervasive", "prevalent", "widespread"]}'::jsonb
),
(
  'serendipity',
  '/ˌserənˈdɪpɪti/',
  'n. 意外发现珍奇事物的运气；机缘巧合',
  ARRAY['Finding this book was pure serendipity.', 'Many scientific discoveries were made by serendipity.', 'Our meeting was a happy serendipity.'],
  ARRAY['高级词汇', '美丽单词', '名词'],
  3,
  '这是英语中最美的单词之一，常用于描述美好的意外相遇',
  '{"word_root": "源自童话《三位锡兰王子》(Serendip是锡兰的古称，即今天的斯里兰卡)", "mnemonic": "\"serene-dip-ity\" → 在宁静(serene)中蘸(dip)一下，获得惊喜", "association": "就像你随便翻开一本旧书，发现里面夹着一张100元钞票", "image_hint": "想象在海滩散步时，无意中发现一颗美丽的珍珠", "similar_words": ["fortune", "luck", "chance", "coincidence"]}'::jsonb
),
(
  'ephemeral',
  '/ɪˈfemərəl/',
  'adj. 短暂的，转瞬即逝的',
  ARRAY['Fame is often ephemeral.', 'The ephemeral beauty of cherry blossoms reminds us of life''s transience.', 'Social media posts feel ephemeral compared to printed books.'],
  ARRAY['高级词汇', 'GRE', '形容词'],
  4,
  '反义词: permanent, lasting, enduring, eternal',
  '{"word_root": "epi- (在...上) + hemer (一天，希腊语) + -al = 只存在一天的 → 短暂的", "mnemonic": "\"一-费-摸-弱\" → 一费力气去摸，结果太弱了，转瞬即逝", "association": "蜉蝣(ephemera)只活一天，ephemeral 就是像蜉蝣一样短暂", "image_hint": "想象清晨的露珠，太阳一出来就消失了", "similar_words": ["transient", "fleeting", "momentary", "brief"]}'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO grammar (title, explanation, examples, tags, difficulty, notes) VALUES
(
  '虚拟语气 - 与现在事实相反',
  E'当表达与现在事实相反的假设时，使用虚拟语气：\n\n1. if 从句用过去式（be 动词一律用 were）\n2. 主句用 would/could/might + 动词原形\n\n结构：If + 主语 + 过去式, 主语 + would/could/might + 动词原形\n\n注意：不管主语是第几人称，be 动词都用 were（正式用法）',
  ARRAY['If I were you, I would accept the offer. (如果我是你，我会接受这个提议)', 'If she had more time, she could finish the project. (如果她有更多时间，她能完成这个项目)', 'If it weren''t raining, we might go for a walk. (如果没下雨，我们可能会去散步)', 'If I knew the answer, I would tell you. (如果我知道答案，我会告诉你)'],
  ARRAY['语法', '虚拟语气', '重点', '条件句'],
  3,
  '口语中有时会用 was 代替 were，但正式写作中应使用 were'
),
(
  '现在完成时 vs 一般过去时',
  E'现在完成时 (have/has + 过去分词) 和一般过去时 (动词过去式) 的区别：\n\n1. 现在完成时：强调过去的动作对现在的影响或结果\n2. 一般过去时：仅表示过去发生的动作，与现在无关\n\n关键区别：\n- 现在完成时不能与具体的过去时间连用\n- 一般过去时可以与 yesterday, last week 等连用',
  ARRAY['I have lost my keys. (我丢了钥匙 - 现在还没找到)', 'I lost my keys yesterday. (我昨天丢了钥匙 - 只是陈述事实)', 'She has lived in Beijing for 5 years. (她在北京住了5年 - 现在还住在那)', 'She lived in Beijing for 5 years. (她在北京住过5年 - 现在不住那了)'],
  ARRAY['语法', '时态', '重点'],
  2,
  '美式英语中，现在完成时的使用频率低于英式英语，很多情况会用一般过去时代替'
)
ON CONFLICT DO NOTHING;
