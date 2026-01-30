-- 清理重复数据并添加唯一约束
-- 在 Supabase SQL Editor 中执行

-- 1. 删除 words 表中的重复数据，只保留每个单词最早的一条
DELETE FROM words a
USING words b
WHERE a.id > b.id 
  AND a.word = b.word;

-- 2. 删除 grammar 表中的重复数据
DELETE FROM grammar a
USING grammar b
WHERE a.id > b.id 
  AND a.title = b.title;

-- 3. 给 word 字段添加唯一约束，防止以后重复
ALTER TABLE words ADD CONSTRAINT words_word_unique UNIQUE (word);

-- 4. 给 grammar title 字段添加唯一约束
ALTER TABLE grammar ADD CONSTRAINT grammar_title_unique UNIQUE (title);

-- 查看清理后的数据
SELECT * FROM words;
SELECT * FROM grammar;
